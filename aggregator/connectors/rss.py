import httpx
import feedparser
from datetime import datetime, timezone
from time import mktime
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class RssConnector(BaseConnector):
    """Fetches content from RSS/Atom feeds."""

    # Default RSS feeds for common knowledge topics
    DEFAULT_FEEDS = {
        "quantum": [
            "https://quantumcomputingreport.com/feed/",
        ],
        "ai": [
            "https://blog.google/technology/ai/rss/",
            "https://openai.com/blog/rss.xml",
        ],
        "astronomy": [
            "https://www.nasa.gov/feed/",
            "https://skyandtelescope.org/feed/",
        ],
        "personal growth": [
            "https://jamesclear.com/feed",
        ],
        "piano": [
            "https://www.pianistmagazine.com/feed/",
        ],
    }

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []

        # Gather feed URLs from queries
        feed_urls = set()
        for query in queries:
            q_lower = query.lower()
            for key, urls in self.DEFAULT_FEEDS.items():
                if key in q_lower or q_lower in key:
                    feed_urls.update(urls)

        # If no matching feeds, try Google News RSS as fallback
        if not feed_urls:
            for query in queries[:3]:
                feed_urls.add(
                    f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-US&gl=US&ceid=US:en"
                )

        per_feed = max(1, max_items // max(len(feed_urls), 1))

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for url in feed_urls:
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    feed = feedparser.parse(resp.text)

                    for entry in feed.entries[:per_feed]:
                        # Parse published date
                        pub_date = None
                        if hasattr(entry, "published_parsed") and entry.published_parsed:
                            pub_date = datetime.fromtimestamp(
                                mktime(entry.published_parsed), tz=timezone.utc
                            )
                        elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                            pub_date = datetime.fromtimestamp(
                                mktime(entry.updated_parsed), tz=timezone.utc
                            )

                        # Extract thumbnail
                        thumbnail = None
                        if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                            thumbnail = entry.media_thumbnail[0].get("url")
                        elif hasattr(entry, "media_content") and entry.media_content:
                            for mc in entry.media_content:
                                if "image" in mc.get("type", ""):
                                    thumbnail = mc.get("url")
                                    break

                        link = entry.get("link", "")
                        entry_id = entry.get("id", link)

                        items.append(
                            RawContent(
                                source_type=SourceType.RSS,
                                source_id=f"rss-{hash(entry_id) & 0xFFFFFFFF:08x}",
                                url=link,
                                title=entry.get("title", "").strip(),
                                description=(
                                    entry.get("summary", "") or entry.get("description", "")
                                ).strip()[:500],
                                thumbnail_url=thumbnail,
                                media_type=MediaType.ARTICLE,
                                author=entry.get("author", feed.feed.get("title", "")),
                                published_at=pub_date,
                                metadata={
                                    "feed_title": feed.feed.get("title", ""),
                                    "feed_url": url,
                                },
                            )
                        )
                except Exception as e:
                    print(f"RSS fetch error for '{url}': {e}")

        return self._deduplicate(items)[:max_items]
