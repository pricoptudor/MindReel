import json
from openai import AsyncOpenAI
from aggregator.models import (
    RawContent,
    ClassifiedContent,
    ContentLevel,
    ContentFocus,
)
from aggregator.config import get_settings


CLASSIFICATION_PROMPT = """You are a content classifier for a knowledge learning app. 
Given a content item and a list of user interests, classify it.

User interests: {interests}

Content:
- Title: {title}
- Description: {description}
- Source: {source}
- Media type: {media_type}
- Author: {author}

Respond with ONLY valid JSON (no markdown):
{{
  "interest_ids": ["list of matching interest IDs from the user's interests"],
  "level": "beginner|intermediate|advanced|research",
  "focus": "applied|theoretical|tutorial|news|entertainment",
  "confidence": 0.0 to 1.0
}}

Rules:
- interest_ids: only IDs from the provided list that genuinely match
- level: "research" for academic papers, "beginner" for introductory content, etc.
- focus: "tutorial" for how-to content, "news" for current events, "theoretical" for theory, "applied" for practical, "entertainment" for fun/casual
- confidence: how confident you are in the classification (0.5-1.0)
- If no interests match at all, return empty interest_ids and confidence < 0.5"""


async def classify_content(
    item: RawContent,
    interest_map: dict[str, str],  # {id: name}
) -> ClassifiedContent:
    """
    Classify a content item using AI.
    Falls back to keyword matching if OpenAI is unavailable.
    """
    settings = get_settings()

    if settings.openai_api_key:
        try:
            return await _classify_with_ai(item, interest_map, settings)
        except Exception as e:
            print(f"AI classification failed, using keywords: {e}")

    return _classify_with_keywords(item, interest_map)


async def _classify_with_ai(
    item: RawContent,
    interest_map: dict[str, str],
    settings,
) -> ClassifiedContent:
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    interests_str = ", ".join(f"{k} ({v})" for k, v in interest_map.items())

    prompt = CLASSIFICATION_PROMPT.format(
        interests=interests_str,
        title=item.title,
        description=(item.description or "")[:300],
        source=item.source_type.value,
        media_type=item.media_type.value,
        author=item.author or "unknown",
    )

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=200,
    )

    text = response.choices[0].message.content or "{}"
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0]

    result = json.loads(text)

    # Validate interest IDs
    valid_ids = [i for i in result.get("interest_ids", []) if i in interest_map]

    return ClassifiedContent(
        content=item,
        interest_ids=valid_ids,
        level=ContentLevel(result.get("level", "intermediate")),
        focus=ContentFocus(result.get("focus", "news")),
        confidence=min(1.0, max(0.0, float(result.get("confidence", 0.8)))),
    )


def _classify_with_keywords(
    item: RawContent,
    interest_map: dict[str, str],
) -> ClassifiedContent:
    """Simple keyword-based classification fallback."""
    text = f"{item.title} {item.description or ''}".lower()

    matched_ids = []
    for interest_id, interest_name in interest_map.items():
        keywords = interest_name.lower().split()
        # Also add the ID itself as a keyword
        keywords.append(interest_id.lower())
        if any(kw in text for kw in keywords if len(kw) > 2):
            matched_ids.append(interest_id)

    # Determine level
    level = ContentLevel.INTERMEDIATE
    if item.media_type.value == "paper":
        level = ContentLevel.RESEARCH
    elif any(w in text for w in ["beginner", "introduction", "basics", "101", "getting started"]):
        level = ContentLevel.BEGINNER
    elif any(w in text for w in ["advanced", "deep dive", "in-depth", "expert"]):
        level = ContentLevel.ADVANCED
    elif any(w in text for w in ["research", "paper", "arxiv", "novel", "we propose"]):
        level = ContentLevel.RESEARCH

    # Determine focus
    focus = ContentFocus.NEWS
    if any(w in text for w in ["tutorial", "how to", "step by step", "learn", "guide"]):
        focus = ContentFocus.TUTORIAL
    elif any(w in text for w in ["theory", "theoretical", "proof", "theorem", "formalism"]):
        focus = ContentFocus.THEORETICAL
    elif any(w in text for w in ["practical", "applied", "implement", "build", "code"]):
        focus = ContentFocus.APPLIED
    elif any(w in text for w in ["fun", "amazing", "cool", "mind-blowing", "entertainment"]):
        focus = ContentFocus.ENTERTAINMENT

    confidence = 0.7 if matched_ids else 0.3

    return ClassifiedContent(
        content=item,
        interest_ids=matched_ids,
        level=level,
        focus=focus,
        confidence=confidence,
    )
