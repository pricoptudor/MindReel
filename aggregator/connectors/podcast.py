import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class PodcastConnector(BaseConnector):
    """
    Fetches podcast episodes from the iTunes/Apple Podcasts Search API.
    No auth required — uses the public search endpoint.
    """

    SEARCH_URL = "https://itunes.apple.com/search"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in queries:
                try:
                    resp = await client.get(
                        self.SEARCH_URL,
                        params={
                            "term": query,
                            "media": "podcast",
                            "entity": "podcastEpisode",
                            "limit": per_query,
                            "sort": "recent",
                        },
                    )
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    for result in data.get("results", []):
                        pub_date = None
                        if result.get("releaseDate"):
                            try:
                                pub_date = datetime.fromisoformat(
                                    result["releaseDate"].replace("Z", "+00:00")
                                )
                            except ValueError:
                                pass

                        # Duration in milliseconds → seconds
                        duration_ms = result.get("trackTimeMillis", 0)
                        duration_s = duration_ms // 1000 if duration_ms else None

                        # Prefer episode artwork, fall back to collection
                        thumbnail = (
                            result.get("artworkUrl600")
                            or result.get("artworkUrl160")
                            or result.get("artworkUrl100")
                            or result.get("artworkUrl60", "")
                        )

                        items.append(
                            RawContent(
                                source_type=SourceType.PODCAST,
                                source_id=f"pod-{result.get('trackId', '')}",
                                url=result.get("trackViewUrl") or result.get("collectionViewUrl", ""),
                                title=result.get("trackName", ""),
                                description=(result.get("description") or result.get("shortDescription", ""))[:500],
                                thumbnail_url=thumbnail,
                                media_type=MediaType.PODCAST,
                                duration=duration_s,
                                author=result.get("collectionName", result.get("artistName", "")),
                                published_at=pub_date,
                                metadata={
                                    "collection_name": result.get("collectionName", ""),
                                    "artist_name": result.get("artistName", ""),
                                    "genre": result.get("primaryGenreName", ""),
                                    "episode_url": result.get("episodeUrl", ""),
                                },
                            )
                        )
                except Exception as e:
                    print(f"Podcast fetch error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]
