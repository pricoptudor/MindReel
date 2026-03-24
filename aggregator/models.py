from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class MediaType(str, Enum):
    VIDEO = "video"
    ARTICLE = "article"
    PAPER = "paper"
    DISCUSSION = "discussion"
    PODCAST = "podcast"
    SHORT = "short"


class ContentLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    RESEARCH = "research"


class ContentFocus(str, Enum):
    APPLIED = "applied"
    THEORETICAL = "theoretical"
    TUTORIAL = "tutorial"
    NEWS = "news"
    ENTERTAINMENT = "entertainment"


class SourceType(str, Enum):
    YOUTUBE = "youtube"
    REDDIT = "reddit"
    ARXIV = "arxiv"
    RSS = "rss"
    HACKERNEWS = "hackernews"
    PODCAST = "podcast"
    DEVTO = "devto"
    WIKIPEDIA = "wikipedia"


class RawContent(BaseModel):
    """Content item as fetched from a source, before classification."""
    source_type: SourceType
    source_id: str
    url: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    media_type: MediaType
    duration: Optional[int] = None  # seconds
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    metadata: dict = {}


class ClassifiedContent(BaseModel):
    """Content after classification with interest tags."""
    content: RawContent
    interest_ids: list[str] = []
    level: ContentLevel = ContentLevel.INTERMEDIATE
    focus: ContentFocus = ContentFocus.NEWS
    confidence: float = 0.8


class AggregationRequest(BaseModel):
    """Request to trigger content aggregation."""
    source_types: list[SourceType] | None = None  # None = all sources
    interest_ids: list[str] | None = None  # None = all interests
    max_items_per_source: int = 20


class AggregationResult(BaseModel):
    """Result of an aggregation run."""
    source_type: str
    fetched: int = 0
    classified: int = 0
    stored: int = 0
    errors: list[str] = []
