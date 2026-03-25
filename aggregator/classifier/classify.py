import json
import asyncio
import httpx
from aggregator.models import (
    RawContent,
    ClassifiedContent,
    ContentLevel,
    ContentFocus,
)
from aggregator.config import get_settings


BATCH_CLASSIFICATION_PROMPT = """You are a content classifier for a knowledge learning app.
Classify each content item against the user's interests.

User interests: {interests}

Items to classify:
{items_block}

Respond with ONLY a valid JSON array (no markdown, no explanation). One object per item, in the same order:
[
  {{
    "index": 0,
    "interest_ids": ["matching interest IDs"],
    "level": "beginner|intermediate|advanced|research",
    "focus": "applied|theoretical|tutorial|news|entertainment",
    "confidence": 0.0 to 1.0
  }},
  ...
]

Rules:
- interest_ids: only IDs from the provided list that genuinely match
- level: "research" for academic papers, "beginner" for intro content, "intermediate" for mid-depth, "advanced" for expert
- focus: "tutorial" for how-to, "news" for current events, "theoretical" for theory, "applied" for practical, "entertainment" for casual/fun
- confidence: 0.5-1.0 for matches, below 0.5 if nothing matches
- Return exactly {count} objects in the array"""


BATCH_SIZE = 12  # Items per API call — keeps prompt under token limits


# ============================================================
# Public API
# ============================================================

async def classify_content(
    item: RawContent,
    interest_map: dict[str, str],
) -> ClassifiedContent:
    """Classify a single item. Used when not batching."""
    results = await classify_content_batch([item], interest_map)
    return results[0]


async def classify_content_batch(
    items: list[RawContent],
    interest_map: dict[str, str],
) -> list[ClassifiedContent]:
    """
    Classify a batch of items. Sends them to Gemini in chunks,
    falls back to keywords on failure.
    """
    if not items:
        return []

    settings = get_settings()
    all_results: list[ClassifiedContent] = []

    # Process in batches
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i : i + BATCH_SIZE]

        if settings.openai_api_key:
            try:
                batch_results = await _classify_batch_gemini(batch, interest_map, settings)
                all_results.extend(batch_results)
                continue
            except Exception as e:
                print(f"Gemini batch failed ({len(batch)} items), using keywords: {e}")

        # Fallback: keyword classify entire batch
        all_results.extend(_classify_with_keywords(item, interest_map) for item in batch)

    return all_results


# ============================================================
# Gemini batch classification
# ============================================================

async def _classify_batch_gemini(
    items: list[RawContent],
    interest_map: dict[str, str],
    settings,
) -> list[ClassifiedContent]:
    """Send up to BATCH_SIZE items in a single Gemini call."""
    interests_str = ", ".join(f"{k} ({v})" for k, v in interest_map.items())

    # Build the items block
    lines = []
    for idx, item in enumerate(items):
        lines.append(
            f"[{idx}] Title: {item.title}\n"
            f"     Desc: {(item.description or '')[:200]}\n"
            f"     Source: {item.source_type.value} | Type: {item.media_type.value} | Author: {item.author or 'unknown'}"
        )
    items_block = "\n\n".join(lines)

    prompt = BATCH_CLASSIFICATION_PROMPT.format(
        interests=interests_str,
        items_block=items_block,
        count=len(items),
    )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.openai_model}:generateContent?key={settings.openai_api_key}"
    )

    # Respect rate limits: wait between batches
    await asyncio.sleep(2.0)

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 2048,
                },
            },
        )
        if resp.status_code == 429:
            raise Exception("Rate limited")
        resp.raise_for_status()
        data = resp.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0]

    parsed = json.loads(text)

    # Map results back to items
    results: list[ClassifiedContent] = []
    for idx, item in enumerate(items):
        # Find matching result by index
        entry = None
        if isinstance(parsed, list):
            for r in parsed:
                if r.get("index") == idx:
                    entry = r
                    break
            # If no index match, try positional
            if entry is None and idx < len(parsed):
                entry = parsed[idx]

        if entry:
            valid_ids = [i for i in entry.get("interest_ids", []) if i in interest_map]
            try:
                results.append(ClassifiedContent(
                    content=item,
                    interest_ids=valid_ids,
                    level=ContentLevel(entry.get("level", "intermediate")),
                    focus=ContentFocus(entry.get("focus", "news")),
                    confidence=min(1.0, max(0.0, float(entry.get("confidence", 0.8)))),
                ))
            except (ValueError, KeyError):
                results.append(_classify_with_keywords(item, interest_map))
        else:
            results.append(_classify_with_keywords(item, interest_map))

    return results


# ============================================================
# Keyword fallback
# ============================================================

def _classify_with_keywords(
    item: RawContent,
    interest_map: dict[str, str],
) -> ClassifiedContent:
    """Keyword-based classification fallback."""
    text = f"{item.title} {item.description or ''}".lower()

    matched_ids = []
    for interest_id, interest_name in interest_map.items():
        keywords = interest_name.lower().split()
        keywords.append(interest_id.lower())
        # Also split hyphenated IDs
        keywords.extend(interest_id.lower().split("-"))
        if any(kw in text for kw in keywords if len(kw) > 2):
            matched_ids.append(interest_id)

    # Determine level
    level = ContentLevel.INTERMEDIATE
    if item.media_type.value == "paper":
        level = ContentLevel.RESEARCH
    elif any(w in text for w in ["beginner", "introduction", "basics", "101", "getting started", "for beginners"]):
        level = ContentLevel.BEGINNER
    elif any(w in text for w in ["advanced", "deep dive", "in-depth", "expert", "masterclass"]):
        level = ContentLevel.ADVANCED
    elif any(w in text for w in ["research", "paper", "arxiv", "novel", "we propose", "we present", "our method"]):
        level = ContentLevel.RESEARCH

    # Determine focus
    focus = ContentFocus.NEWS
    if any(w in text for w in ["tutorial", "how to", "step by step", "learn", "guide", "course", "lesson"]):
        focus = ContentFocus.TUTORIAL
    elif any(w in text for w in ["theory", "theoretical", "proof", "theorem", "formalism", "mathematical"]):
        focus = ContentFocus.THEORETICAL
    elif any(w in text for w in ["practical", "applied", "implement", "build", "code", "hands-on", "project"]):
        focus = ContentFocus.APPLIED
    elif any(w in text for w in ["fun", "amazing", "cool", "mind-blowing", "entertainment", "fascinating"]):
        focus = ContentFocus.ENTERTAINMENT

    confidence = 0.7 if matched_ids else 0.3

    return ClassifiedContent(
        content=item,
        interest_ids=matched_ids,
        level=level,
        focus=focus,
        confidence=confidence,
    )
