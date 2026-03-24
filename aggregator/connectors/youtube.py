import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from aggregator.config import get_settings
from .base import BaseConnector


class YouTubeConnector(BaseConnector):
    """Fetches videos and shorts from YouTube Data API v3."""

    BASE_URL = "https://www.googleapis.com/youtube/v3"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        settings = get_settings()
        if not settings.youtube_api_key:
            return []

        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in queries:
                try:
                    # Search for videos
                    resp = await client.get(
                        f"{self.BASE_URL}/search",
                        params={
                            "part": "snippet",
                            "q": query,
                            "type": "video",
                            "maxResults": per_query,
                            "order": "relevance",
                            "publishedAfter": "2025-01-01T00:00:00Z",
                            "key": settings.youtube_api_key,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    video_ids = [
                        item["id"]["videoId"]
                        for item in data.get("items", [])
                        if "videoId" in item.get("id", {})
                    ]

                    if not video_ids:
                        continue

                    # Get video details (duration, stats)
                    details_resp = await client.get(
                        f"{self.BASE_URL}/videos",
                        params={
                            "part": "contentDetails,statistics",
                            "id": ",".join(video_ids),
                            "key": settings.youtube_api_key,
                        },
                    )
                    details_resp.raise_for_status()
                    details_map = {
                        v["id"]: v for v in details_resp.json().get("items", [])
                    }

                    for item in data.get("items", []):
                        video_id = item["id"].get("videoId")
                        if not video_id:
                            continue

                        snippet = item["snippet"]
                        details = details_map.get(video_id, {})
                        duration = self._parse_duration(
                            details.get("contentDetails", {}).get("duration", "")
                        )

                        # Classify as short if < 90 seconds
                        media_type = MediaType.SHORT if duration and duration < 90 else MediaType.VIDEO

                        thumbnail = (
                            snippet.get("thumbnails", {}).get("high", {}).get("url")
                            or snippet.get("thumbnails", {}).get("medium", {}).get("url")
                            or snippet.get("thumbnails", {}).get("default", {}).get("url", "")
                        )

                        items.append(
                            RawContent(
                                source_type=SourceType.YOUTUBE,
                                source_id=f"yt-{video_id}",
                                url=f"https://youtube.com/watch?v={video_id}",
                                title=snippet.get("title", ""),
                                description=snippet.get("description", "")[:500],
                                thumbnail_url=thumbnail,
                                media_type=media_type,
                                duration=duration,
                                author=snippet.get("channelTitle", ""),
                                published_at=self._parse_date(snippet.get("publishedAt")),
                                metadata={
                                    "channel_id": snippet.get("channelId", ""),
                                    "view_count": details.get("statistics", {}).get("viewCount"),
                                    "like_count": details.get("statistics", {}).get("likeCount"),
                                },
                            )
                        )
                except Exception as e:
                    print(f"YouTube fetch error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]

    @staticmethod
    def _parse_duration(iso_duration: str) -> int | None:
        """Parse ISO 8601 duration (PT1H2M3S) to seconds."""
        if not iso_duration:
            return None
        import re
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso_duration)
        if not match:
            return None
        h, m, s = (int(g) if g else 0 for g in match.groups())
        return h * 3600 + m * 60 + s

    @staticmethod
    def _parse_date(date_str: str | None) -> datetime | None:
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None
