import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class DevtoConnector(BaseConnector):
    """Fetches articles from Dev.to (Forem) API. No auth required."""

    BASE_URL = "https://dev.to/api"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in queries:
                try:
                    resp = await client.get(
                        f"{self.BASE_URL}/articles",
                        params={
                            "tag": query.lower().replace(" ", "").replace("&", ""),
                            "per_page": per_query,
                            "state": "rising",
                        },
                    )
                    # If tag search returns nothing, try search endpoint
                    if resp.status_code != 200 or not resp.json():
                        resp = await client.get(
                            f"{self.BASE_URL}/articles",
                            params={
                                "per_page": per_query,
                                "tag": query.split()[0].lower() if query.split() else query,
                            },
                        )

                    if resp.status_code != 200:
                        continue

                    for article in resp.json()[:per_query]:
                        pub_date = None
                        if article.get("published_at"):
                            try:
                                pub_date = datetime.fromisoformat(
                                    article["published_at"].replace("Z", "+00:00")
                                )
                            except ValueError:
                                pass

                        items.append(
                            RawContent(
                                source_type=SourceType.DEVTO,
                                source_id=f"devto-{article.get('id', '')}",
                                url=article.get("url", ""),
                                title=article.get("title", ""),
                                description=article.get("description", "")[:500],
                                thumbnail_url=article.get("cover_image") or article.get("social_image"),
                                media_type=MediaType.ARTICLE,
                                author=article.get("user", {}).get("name", ""),
                                published_at=pub_date,
                                metadata={
                                    "tags": article.get("tag_list", []),
                                    "reactions": article.get("positive_reactions_count", 0),
                                    "comments": article.get("comments_count", 0),
                                    "reading_time": article.get("reading_time_minutes", 0),
                                },
                            )
                        )
                except Exception as e:
                    print(f"Dev.to fetch error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]
