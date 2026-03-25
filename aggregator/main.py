"""
MindReel Content Aggregator — FastAPI Service

Fetches content from YouTube, Reddit, arXiv, RSS, and HackerNews,
classifies it by interest/level/focus, and stores it in Supabase.
"""

import asyncio
from fastapi import FastAPI, HTTPException, Depends
from aggregator.models import (
    AggregationRequest,
    AggregationResult,
    SourceType,
)
from aggregator.config import Settings, get_settings
from aggregator.connectors import (
    YouTubeConnector,
    RedditConnector,
    ArxivConnector,
    RssConnector,
    HackerNewsConnector,
    DevtoConnector,
    WikipediaConnector,
    PodcastConnector,
)
from aggregator.classifier import classify_content, classify_content_batch
from aggregator.storage import store_content, fetch_user_interests, fetch_user_sub_interests

app = FastAPI(
    title="MindReel Aggregator",
    description="Content aggregation and classification service",
    version="1.1.0",
)

# Connector registry
CONNECTORS = {
    SourceType.YOUTUBE: YouTubeConnector(),
    SourceType.REDDIT: RedditConnector(),
    SourceType.ARXIV: ArxivConnector(),
    SourceType.RSS: RssConnector(),
    SourceType.HACKERNEWS: HackerNewsConnector(),
    SourceType.DEVTO: DevtoConnector(),
    SourceType.WIKIPEDIA: WikipediaConnector(),
    SourceType.PODCAST: PodcastConnector(),
}


def _build_queries(interests: dict[str, str], sub_interests: list[dict]) -> list[str]:
    """Build search queries from interests and sub-interests."""
    queries = []
    for interest_id, interest_name in interests.items():
        queries.append(interest_name)
        # Add sub-interest queries
        for sub in sub_interests:
            if sub["interest_id"] == interest_id:
                queries.append(f"{interest_name} {sub['name']}")
    return queries


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mindreel-aggregator"}


@app.post("/aggregate", response_model=list[AggregationResult])
async def aggregate(
    request: AggregationRequest,
    settings: Settings = Depends(get_settings),
):
    """
    Trigger content aggregation from configured sources.
    Fetches, classifies, and stores content in Supabase.
    """
    if not settings.target_user_id:
        raise HTTPException(status_code=400, detail="TARGET_USER_ID not configured")

    user_id = settings.target_user_id

    # Fetch user interests
    interests = await fetch_user_interests(user_id)
    if not interests:
        raise HTTPException(status_code=404, detail="No interests found for user")

    sub_interests = await fetch_user_sub_interests(user_id)
    queries = _build_queries(interests, sub_interests)

    # Optionally filter by requested interest IDs
    if request.interest_ids:
        filtered = {k: v for k, v in interests.items() if k in request.interest_ids}
        if filtered:
            interests = filtered
            queries = _build_queries(interests, sub_interests)

    # Determine which sources to run
    source_types = request.source_types or list(CONNECTORS.keys())

    results: list[AggregationResult] = []

    for source_type in source_types:
        connector = CONNECTORS.get(source_type)
        if not connector:
            results.append(
                AggregationResult(
                    source_type=source_type.value,
                    errors=[f"No connector for {source_type.value}"],
                )
            )
            continue

        result = AggregationResult(source_type=source_type.value)

        try:
            # Fetch
            raw_items = await connector.fetch(queries, request.max_items_per_source)
            result.fetched = len(raw_items)

            # Classify in batch (much fewer API calls)
            try:
                all_classified = await classify_content_batch(raw_items, interests)
                classified = [c for c in all_classified if c.interest_ids and c.confidence >= 0.4]
            except Exception as e:
                result.errors.append(f"Batch classify error: {str(e)[:100]}")
                classified = []
            result.classified = len(classified)

            # Store
            stored = await store_content(classified, user_id)
            result.stored = stored

        except Exception as e:
            result.errors.append(f"Pipeline error: {str(e)[:200]}")

        results.append(result)

    return results


@app.post("/aggregate/{source_type}", response_model=AggregationResult)
async def aggregate_source(
    source_type: SourceType,
    settings: Settings = Depends(get_settings),
):
    """Aggregate content from a single source."""
    request = AggregationRequest(
        source_types=[source_type],
        max_items_per_source=20,
    )
    results = await aggregate(request, settings)
    return results[0] if results else AggregationResult(source_type=source_type.value)


@app.get("/interests")
async def list_interests(settings: Settings = Depends(get_settings)):
    """List the target user's interests."""
    if not settings.target_user_id:
        raise HTTPException(status_code=400, detail="TARGET_USER_ID not configured")
    interests = await fetch_user_interests(settings.target_user_id)
    return {"interests": interests}
