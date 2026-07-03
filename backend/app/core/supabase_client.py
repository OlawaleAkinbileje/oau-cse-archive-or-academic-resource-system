from supabase import Client, create_client

from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY configuration")
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase_client
