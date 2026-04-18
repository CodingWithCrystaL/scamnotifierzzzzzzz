"""
api/stats.py — Stats endpoint added as a router
Import this in main.py: app.include_router(stats_router)
"""
from fastapi import APIRouter
from supabase import create_client
import os

stats_router = APIRouter()

def _db():
    return create_client(os.getenv("SUPABASE_URL",""), os.getenv("SUPABASE_SERVICE_KEY",""))

@stats_router.get("/stats")
async def get_stats():
    try:
        db = _db()
        scammers = db.table("reports").select("id", count="exact").eq("status","scammer").execute()
        trusted  = db.table("reports").select("id", count="exact").eq("status","trusted").execute()
        return {
            "scammers": scammers.count or 0,
            "trusted":  trusted.count  or 0,
        }
    except Exception:
        return {"scammers": 0, "trusted": 0}
