from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import backend.config as config
from backend.services.ai_processor import AIProcessor
from backend.services.supabase_service import SupabaseService, db_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdateRequest(BaseModel):
    nvidia_api_key: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None


@router.get("")
async def get_settings():
    """Returns current active settings configuration status (masked keys for security)."""
    has_nvidia = bool(config.NVIDIA_API_KEY and len(config.NVIDIA_API_KEY.strip()) > 10)
    has_supabase = bool(config.SUPABASE_URL and config.SUPABASE_KEY and "supabase.co" in config.SUPABASE_URL)

    masked_nvidia = f"{config.NVIDIA_API_KEY[:8]}...{config.NVIDIA_API_KEY[-4:]}" if has_nvidia else ""
    masked_supabase = f"{config.SUPABASE_URL[:20]}..." if has_supabase else ""

    return {
        "has_nvidia_api_key": has_nvidia,
        "masked_nvidia_api_key": masked_nvidia,
        "nvidia_vision_model": config.NVIDIA_VISION_MODEL,
        "nvidia_text_model": config.NVIDIA_TEXT_MODEL,
        "has_supabase": has_supabase,
        "masked_supabase_url": masked_supabase,
        "mode": "Live Cloud API" if (has_nvidia or has_supabase) else "Local Offline Engine"
    }


@router.post("")
async def update_settings(body: SettingsUpdateRequest):
    """Updates runtime NVIDIA API key and Supabase credentials dynamically."""
    updated = False

    if body.nvidia_api_key is not None:
        config.NVIDIA_API_KEY = body.nvidia_api_key.strip()
        updated = True

    if body.supabase_url is not None and body.supabase_key is not None:
        config.SUPABASE_URL = body.supabase_url.strip()
        config.SUPABASE_KEY = body.supabase_key.strip()
        
        # Re-initialize Supabase connection singleton
        global db_service
        try:
            from supabase import create_client
            if config.SUPABASE_URL and config.SUPABASE_KEY:
                db_service.client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
                db_service.is_connected = True
                print("[Settings] Re-connected to Supabase dynamically.")
        except Exception as e:
            print(f"[Settings] Error connecting Supabase: {e}")

        updated = True

    return {
        "status": "success",
        "message": "Settings updated successfully.",
        "has_nvidia": bool(config.NVIDIA_API_KEY),
        "has_supabase": bool(config.SUPABASE_URL and config.SUPABASE_KEY)
    }
