import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class HackerNewsConnector(BaseConnector):
    """Fetches stories from Hacker News Firebase API."""

    BASE_URL = "https://hacker-news.firebaseio.com/v0"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # Get top + best stories
                top_resp = await client.get(f"{self.BASE_URL}/topstories.json")
                top_resp.raise_for_status()
                story_ids = top_resp.json()[:100]  # top 100

                # Fetch story details in parallel (batch of 30)
                stories = []
                for batch_start in range(0, min(len(story_ids), 60), 15):
                    batch = story_ids[batch_start : batch_start + 15]
                    resps = []
                    for sid in batch:
                        resps.append(client.get(f"{self.BASE_URL}/item/{sid}.json"))
                    results = []
                    for coro in resps:
                        try:
                            r = await coro
                            r.raise_for_status()
                            results.append(r.json())
                        except Exception:
                            continue
                    stories.extend(results)

                # Filter by queries (relaxed keyword matching)
                query_terms = set()
                for q in queries:
                    for word in q.lower().split():
                        if len(word) > 2:
                            query_terms.add(word)

                # If no specific queries, take top stories as-is
                take_all = len(query_terms) == 0

                for story in stories:
                    if not story or story.get("type") != "story":
                        continue
                    if not story.get("url"):
                        continue

                    title = story.get("title", "")
                    title_lower = title.lower()

                    # Check if story matches any query term (or take all if no filters)
                    if not take_all and query_terms and not any(term in title_lower for term in query_terms):
                        continue

                    pub_date = None
                    if story.get("time"):
                        pub_date = datetime.fromtimestamp(story["time"], tz=timezone.utc)

                    items.append(
                        RawContent(
                            source_type=SourceType.HACKERNEWS,
                            source_id=f"hn-{story.get('id', '')}",
                            url=story.get("url", ""),
                            title=title,
                            description=f"HN Score: {story.get('score', 0)} · {story.get('descendants', 0)} comments",
                            thumbnail_url=None,
                            media_type=MediaType.ARTICLE,
                            author=story.get("by", ""),
                            published_at=pub_date,
                            metadata={
                                "score": story.get("score", 0),
                                "comments": story.get("descendants", 0),
                                "hn_url": f"https://news.ycombinator.com/item?id={story.get('id', '')}",
                            },
                        )
                    )
            except Exception as e:
                print(f"HackerNews fetch error: {e}")

        return self._deduplicate(items)[:max_items]
