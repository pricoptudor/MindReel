import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from aggregator.config import get_settings
from .base import BaseConnector


class RedditConnector(BaseConnector):
    """Fetches posts from Reddit using OAuth2 API."""

    TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
    BASE_URL = "https://oauth.reddit.com"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        settings = get_settings()
        if not settings.reddit_client_id or not settings.reddit_client_secret:
            return []

        token = await self._get_token(settings)
        if not token:
            return []

        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": settings.reddit_user_agent,
        }

        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            for query in queries:
                try:
                    resp = await client.get(
                        f"{self.BASE_URL}/search",
                        params={
                            "q": query,
                            "sort": "relevance",
                            "t": "month",
                            "limit": per_query,
                            "type": "link",
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    for child in data.get("data", {}).get("children", []):
                        post = child.get("data", {})
                        if post.get("over_18"):
                            continue

                        # Determine media type
                        url = post.get("url", "")
                        is_video = post.get("is_video") or "youtube.com" in url or "youtu.be" in url
                        media_type = MediaType.VIDEO if is_video else MediaType.DISCUSSION

                        thumbnail = post.get("thumbnail", "")
                        if thumbnail in ("self", "default", "nsfw", "spoiler", ""):
                            thumbnail = None

                        items.append(
                            RawContent(
                                source_type=SourceType.REDDIT,
                                source_id=f"reddit-{post.get('id', '')}",
                                url=f"https://reddit.com{post.get('permalink', '')}",
                                title=post.get("title", ""),
                                description=(post.get("selftext", "") or "")[:500],
                                thumbnail_url=thumbnail,
                                media_type=media_type,
                                author=f"u/{post.get('author', 'unknown')}",
                                published_at=datetime.fromtimestamp(
                                    post.get("created_utc", 0), tz=timezone.utc
                                ) if post.get("created_utc") else None,
                                metadata={
                                    "subreddit": post.get("subreddit", ""),
                                    "score": post.get("score", 0),
                                    "num_comments": post.get("num_comments", 0),
                                    "upvote_ratio": post.get("upvote_ratio", 0),
                                },
                            )
                        )
                except Exception as e:
                    print(f"Reddit fetch error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]

    @staticmethod
    async def _get_token(settings) -> str | None:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    RedditConnector.TOKEN_URL,
                    data={"grant_type": "client_credentials"},
                    auth=(settings.reddit_client_id, settings.reddit_client_secret),
                    headers={"User-Agent": settings.reddit_user_agent},
                )
                resp.raise_for_status()
                return resp.json().get("access_token")
        except Exception as e:
            print(f"Reddit auth error: {e}")
            return None
