import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from aggregator.models import RawContent, MediaType, SourceType
from .base import BaseConnector


class ArxivConnector(BaseConnector):
    """Fetches papers from arXiv API."""

    BASE_URL = "http://export.arxiv.org/api/query"

    # arXiv category mappings for common interests
    CATEGORY_MAP = {
        "quantum": "quant-ph OR cs.QI",
        "quantum computing": "cs.QI OR quant-ph",
        "quantum physics": "quant-ph",
        "ai": "cs.AI OR cs.LG OR cs.CL",
        "machine learning": "cs.LG OR stat.ML",
        "nlp": "cs.CL",
        "semantic web": "cs.AI OR cs.DB",
        "knowledge graphs": "cs.AI OR cs.DB",
        "computer science": "cs.*",
    }

    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        items: list[RawContent] = []
        per_query = max(1, max_items // max(len(queries), 1))

        async with httpx.AsyncClient(timeout=20.0) as client:
            for query in queries:
                try:
                    # Build search query
                    search_q = self._build_query(query)
                    resp = await client.get(
                        self.BASE_URL,
                        params={
                            "search_query": search_q,
                            "start": 0,
                            "max_results": per_query,
                            "sortBy": "submittedDate",
                            "sortOrder": "descending",
                        },
                    )
                    resp.raise_for_status()

                    root = ET.fromstring(resp.text)
                    ns = {"atom": "http://www.w3.org/2005/Atom"}

                    for entry in root.findall("atom:entry", ns):
                        arxiv_id = (entry.findtext("atom:id", "", ns) or "").split("/abs/")[-1]
                        title = (entry.findtext("atom:title", "", ns) or "").strip().replace("\n", " ")
                        summary = (entry.findtext("atom:summary", "", ns) or "").strip()[:500]

                        # Get authors
                        authors = [
                            a.findtext("atom:name", "", ns)
                            for a in entry.findall("atom:author", ns)
                        ]
                        author_str = ", ".join(authors[:3])
                        if len(authors) > 3:
                            author_str += f" et al."

                        # Get published date
                        published = entry.findtext("atom:published", "", ns)
                        pub_date = None
                        if published:
                            try:
                                pub_date = datetime.fromisoformat(published.replace("Z", "+00:00"))
                            except ValueError:
                                pass

                        # Get PDF link
                        pdf_url = ""
                        for link in entry.findall("atom:link", ns):
                            if link.get("title") == "pdf":
                                pdf_url = link.get("href", "")
                                break

                        categories = [
                            c.get("term", "")
                            for c in entry.findall("atom:category", ns)
                        ]

                        items.append(
                            RawContent(
                                source_type=SourceType.ARXIV,
                                source_id=f"arxiv-{arxiv_id}",
                                url=f"https://arxiv.org/abs/{arxiv_id}",
                                title=title,
                                description=summary,
                                thumbnail_url=None,
                                media_type=MediaType.PAPER,
                                author=author_str,
                                published_at=pub_date,
                                metadata={
                                    "pdf_url": pdf_url,
                                    "categories": categories,
                                },
                            )
                        )
                except Exception as e:
                    print(f"arXiv fetch error for '{query}': {e}")

        return self._deduplicate(items)[:max_items]

    def _build_query(self, query: str) -> str:
        q_lower = query.lower()
        # Check if we have a category mapping
        for key, cats in self.CATEGORY_MAP.items():
            if key in q_lower:
                return f"cat:({cats}) AND all:{query}"
        return f"all:{query}"
