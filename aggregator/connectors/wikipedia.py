import httpx
from datetime import datetime, timezone
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class WikipediaConnector(BaseConnector):
    """
    Fetches featured/trending articles from Wikipedia.
    Uses the REST API for featured content and search.
    No auth required.
    """

    REST_URL = "https://en.wikipedia.org/api/rest_v1"
    ACTION_URL = "https://en.wikipedia.org/w/api.php"

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # First get today's featured article
            try:
                today = datetime.now(timezone.utc)
                date_path = f"{today.year}/{today.month:02d}/{today.day:02d}"
                resp = await client.get(
                    f"{self.REST_URL}/feed/featured/{date_path}",
                    headers={"User-Agent": "MindReel/1.0 (knowledge-app)"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Today's featured article
                    tfa = data.get("tfa")
                    if tfa:
                        items.append(self._parse_featured(tfa, "Featured Article"))
                    # Most read articles
                    for article in data.get("mostread", {}).get("articles", [])[:5]:
                        items.append(self._parse_featured(article, "Trending"))
            except Exception as e:
                print(f"Wikipedia featured fetch error: {e}")

            # Then search for each query
            for query in queries:
                try:
                    resp = await client.get(
                        self.ACTION_URL,
                        params={
                            "action": "query",
                            "list": "search",
                            "srsearch": query,
                            "srnamespace": "0",
                            "srlimit": per_query,
                            "srprop": "snippet|titlesnippet",
                            "format": "json",
                        },
                        headers={"User-Agent": "MindReel/1.0 (knowledge-app)"},
                    )
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    for result in data.get("query", {}).get("search", []):
                        title = result.get("title", "")
                        snippet = result.get("snippet", "")
                        # Strip HTML from snippet
                        import re
                        clean_snippet = re.sub(r"<[^>]+>", "", snippet)

                        page_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

                        # Get thumbnail via separate request
                        thumb_url = await self._get_thumbnail(client, title)

                        items.append(
                            RawContent(
                                source_type=SourceType.WIKIPEDIA,
                                source_id=f"wiki-{result.get('pageid', '')}",
                                url=page_url,
                                title=title,
                                description=clean_snippet[:500],
                                thumbnail_url=thumb_url,
                                media_type=MediaType.ARTICLE,
                                author="Wikipedia",
                                published_at=None,
                                metadata={
                                    "pageid": result.get("pageid"),
                                    "wordcount": result.get("wordcount", 0),
                                },
                            )
                        )
                except Exception as e:
                    print(f"Wikipedia search error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]

    def _parse_featured(self, article: dict, label: str) -> RawContent:
        title = article.get("title", article.get("normalizedtitle", ""))
        thumbnail = article.get("thumbnail", {}).get("source", "")
        if thumbnail:
            # Get higher-res version
            thumbnail = thumbnail.replace("/60px-", "/400px-").replace("/40px-", "/400px-")
        return RawContent(
            source_type=SourceType.WIKIPEDIA,
            source_id=f"wiki-{article.get('pageid', title)}",
            url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
            title=title,
            description=article.get("extract", "")[:500],
            thumbnail_url=thumbnail or None,
            media_type=MediaType.ARTICLE,
            author=f"Wikipedia · {label}",
            published_at=datetime.now(timezone.utc),
            metadata={"label": label, "views": article.get("views", 0)},
        )

    @staticmethod
    async def _get_thumbnail(client: httpx.AsyncClient, title: str) -> str | None:
        try:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "pageimages",
                    "pithumbsize": 400,
                    "format": "json",
                },
                headers={"User-Agent": "MindReel/1.0 (knowledge-app)"},
            )
            if resp.status_code == 200:
                pages = resp.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    thumb = page.get("thumbnail", {}).get("source")
                    if thumb:
                        return thumb
        except Exception:
            pass
        return None
