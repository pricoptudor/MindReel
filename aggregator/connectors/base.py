from abc import ABC, abstractmethod
from aggregator.models import RawContent


class BaseConnector(ABC):
    """Base class for all content source connectors."""

    @abstractmethod
    async def fetch(self, queries: list[str], max_items: int = 20) -> list[RawContent]:
        """
        Fetch content items matching the given search queries.

        Args:
            queries: Search terms derived from user interests/sub-interests.
            max_items: Maximum number of items to return.

        Returns:
            List of raw content items (not yet classified).
        """
        ...

    def _deduplicate(self, items: list[RawContent]) -> list[RawContent]:
        """Remove duplicate items by source_id."""
        seen = set()
        unique = []
        for item in items:
            if item.source_id not in seen:
                seen.add(item.source_id)
                unique.append(item)
        return unique
