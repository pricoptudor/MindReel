from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""  # service role key (bypasses RLS)

    # YouTube Data API v3
    youtube_api_key: str = ""

    # Reddit API (OAuth2)
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "MindReel/1.0"

    # OpenAI (for content classification)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Target user (single-user app)
    target_user_id: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
