"""Store classified content items into Supabase."""

from supabase import create_client
from aggregator.models import ClassifiedContent
from aggregator.config import get_settings


def get_supabase():
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def store_content(items: list[ClassifiedContent], user_id: str) -> int:
    """
    Upsert classified content items into Supabase.
    Returns the number of successfully stored items.
    """
    if not items:
        return 0

    sb = get_supabase()
    stored = 0

    for classified in items:
        item = classified.content
        if not classified.interest_ids:
            continue  # Skip items that don't match any interest

        try:
            # Upsert content_items
            content_row = {
                "user_id": user_id,
                "source_type": item.source_type.value,
                "source_id": item.source_id,
                "url": item.url,
                "title": item.title,
                "description": item.description,
                "thumbnail_url": item.thumbnail_url,
                "media_type": item.media_type.value,
                "duration": item.duration,
                "author": item.author,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "metadata": item.metadata,
            }

            result = (
                sb.table("content_items")
                .upsert(content_row, on_conflict="user_id,source_type,source_id")
                .execute()
            )

            if not result.data:
                continue

            content_id = result.data[0]["id"]

            # Delete existing tags for this content and re-insert
            sb.table("content_tags").delete().eq("content_id", content_id).execute()

            # Insert a tag for each matched interest
            tags = []
            for interest_id in classified.interest_ids:
                tags.append({
                    "content_id": content_id,
                    "interest_id": interest_id,
                    "level": classified.level.value,
                    "focus": classified.focus.value,
                    "confidence": classified.confidence,
                })

            if tags:
                sb.table("content_tags").insert(tags).execute()

            stored += 1

        except Exception as e:
            print(f"Store error for '{item.title[:50]}': {e}")

    return stored


async def fetch_user_interests(user_id: str) -> dict[str, str]:
    """Fetch user's interests as {id: name} map."""
    sb = get_supabase()
    result = sb.table("interests").select("id, name").eq("user_id", user_id).execute()
    return {row["id"]: row["name"] for row in (result.data or [])}


async def fetch_user_sub_interests(user_id: str) -> list[dict]:
    """Fetch user's sub-interests."""
    sb = get_supabase()
    result = (
        sb.table("sub_interests")
        .select("id, interest_id, name")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data or []
