"""
api/main.py  —  Scam Notifier FastAPI backend
Local dev: uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""
import os
import uuid
import aiohttp
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ── Config ─────────────────────────────────────────────────────
SUPABASE_URL          = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")
DISCORD_CLIENT_ID     = os.getenv("DISCORD_CLIENT_ID", "1491956010938535978")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
ADMIN_WEBHOOK_URL     = os.getenv("ADMIN_WEBHOOK_URL", "")
DISCORD_EPOCH         = 1420070400000

# Production redirect URI (hardcoded to prevent stale env-var overrides)
REDIRECT_URI = "https://scamnotifier.vercel.app/auth/callback"

# ── App ────────────────────────────────────────────────────────
app = FastAPI(title="Scam Notifier API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scamnotifier.vercel.app",
        "http://localhost:5500",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "trace": traceback.format_exc()}
    )

# ── Supabase ───────────────────────────────────────────────────
def get_db() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Database environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY) are missing in Vercel.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Helpers ────────────────────────────────────────────────────
def snowflake_to_datetime(snowflake_id: str) -> Optional[str]:
    try:
        sid   = int(snowflake_id.strip())
        ts_ms = (sid >> 22) + DISCORD_EPOCH
        dt    = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
        return dt.strftime("%B %d, %Y at %I:%M %p UTC")
    except Exception:
        return None


async def fetch_discord_metadata(target_id: str, target_type: str, invite_code: str = None) -> dict:
    meta = {"name": None, "avatar_url": None}
    try:
        async with aiohttp.ClientSession() as session:
            if target_type == "server" and invite_code:
                url = f"https://discord.com/api/v10/invites/{invite_code}?with_counts=true"
                async with session.get(url) as r:
                    if r.status == 200:
                        data  = await r.json()
                        guild = data.get("guild", {})
                        meta["name"] = guild.get("name")
                        icon = guild.get("icon")
                        if icon:
                            gid = guild.get("id", "")
                            meta["avatar_url"] = f"https://cdn.discordapp.com/icons/{gid}/{icon}.png"
    except Exception:
        pass
    return meta


async def send_webhook(payload: dict):
    if not ADMIN_WEBHOOK_URL:
        return
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(ADMIN_WEBHOOK_URL, json=payload)
    except Exception:
        pass

# ── Models ─────────────────────────────────────────────────────
class CheckResponse(BaseModel):
    status:        str
    target_id:     str
    target_type:   str
    name:          Optional[str]
    avatar_url:    Optional[str]
    creation_date: Optional[str]
    description:   Optional[str]
    proof_count:   int
    proofs:        List[dict]

# ── Router ─────────────────────────────────────────────────────
main_router = APIRouter()


@main_router.get("/stats")
async def get_stats():
    try:
        db       = get_db()
        scammers = db.table("reports").select("id", count="exact").eq("status", "scammer").execute()
        trusted  = db.table("reports").select("id", count="exact").eq("status", "trusted").execute()
        return {"scammers": scammers.count or 0, "trusted": trusted.count or 0}
    except Exception:
        return {"scammers": 0, "trusted": 0}


@main_router.get("/check")
async def check(target: str, type: str = "server"):
    if type not in ("server", "user"):
        raise HTTPException(400, "type must be 'server' or 'user'")

    db     = get_db()
    target = target.strip()

    # Parse invite vs raw ID
    invite_code = None
    real_id     = target
    for prefix in [
        "https://discord.gg/", "http://discord.gg/", "discord.gg/",
        "https://discord.com/invite/", "discord.com/invite/"
    ]:
        if target.lower().startswith(prefix):
            invite_code = target[len(prefix):].strip("/")
            real_id     = invite_code
            break

    if not invite_code and type == "server" and not real_id.isdigit():
        invite_code = real_id

    # Resolve invite → real server ID
    if invite_code and type == "server":
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"https://discord.com/api/v10/invites/{invite_code}") as r:
                    if r.status == 200:
                        data     = await r.json()
                        guild_id = data.get("guild", {}).get("id")
                        if guild_id:
                            real_id = guild_id
            except Exception:
                pass

    # Layer 1 — DB lookup
    db_record = None
    proofs    = []
    try:
        q = db.table("reports").select("*, proofs(*)").eq("target_type", type)
        if type == "user" and not real_id.isdigit():
            q = q.ilike("name", real_id)
        else:
            q = q.eq("target_id", real_id)
        res = q.limit(1).execute()
        if res.data:
            db_record = res.data[0]
            proofs    = db_record.pop("proofs", []) or []
    except Exception:
        pass

    status        = db_record["status"]       if db_record else "not_reported"
    description   = db_record.get("description") if db_record else None
    name          = db_record.get("name")     if db_record else None
    avatar_url    = db_record.get("avatar_url") if db_record else None

    # Layer 2 — Discord metadata
    if not name and invite_code:
        meta       = await fetch_discord_metadata(real_id, type, invite_code)
        name       = meta.get("name")
        avatar_url = meta.get("avatar_url")

    # Layer 3 — Snowflake fallback
    creation_date = snowflake_to_datetime(real_id)
    if not name:
        name = f"Unknown {'Server' if type == 'server' else 'User'}"

    return CheckResponse(
        status=status, target_id=real_id, target_type=type,
        name=name, avatar_url=avatar_url, creation_date=creation_date,
        description=description, proof_count=len(proofs), proofs=proofs,
    )


# ── OAuth ──────────────────────────────────────────────────────

@main_router.post("/auth/callback")
async def discord_callback(code: str = Form(...)):
    async with aiohttp.ClientSession() as session:
        token_resp = await session.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id":     DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  REDIRECT_URI,
            },
        )
        if token_resp.status != 200:
            err = await token_resp.text()
            raise HTTPException(400, f"OAuth token exchange failed: {err}")

        token_data = await token_resp.json()

        user_resp = await session.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user = await user_resp.json()

        # Auto-join main guild
        main_guild = os.getenv("MAIN_GUILD_ID")
        bot_token  = os.getenv("DISCORD_BOT_TOKEN")
        if main_guild and bot_token:
            try:
                await session.put(
                    f"https://discord.com/api/v10/guilds/{main_guild}/members/{user['id']}",
                    headers={
                        "Authorization": f"Bot {bot_token}",
                        "Content-Type":  "application/json",
                    },
                    json={"access_token": token_data["access_token"]},
                )
            except Exception:
                pass

    return {
        "id":           user["id"],
        "username":     user["username"],
        "avatar":       user.get("avatar"),
        "access_token": token_data["access_token"],
    }


# ── Report Submission ──────────────────────────────────────────

@main_router.post("/submit-report")
async def submit_report(
    target:      str              = Form(...),
    target_type: str              = Form(...),
    description: str              = Form(...),
    user_id:     str              = Form(...),
    user_name:   str              = Form(...),
    proofs:      List[UploadFile] = File(default=[]),
):
    if target_type not in ("server", "user"):
        raise HTTPException(400, "Invalid target_type")
    if not description.strip():
        raise HTTPException(400, "Description is required")
    if not proofs:
        raise HTTPException(400, "At least one proof image is required")

    db = get_db()

    sub_res = db.table("pending_submissions").insert({
        "target_id":      target,
        "target_type":    target_type,
        "description":    description,
        "submitted_by":   user_id,
        "submitted_name": user_name,
    }).execute()

    sub_id = sub_res.data[0]["id"] if sub_res.data else str(uuid.uuid4())

    uploaded_urls = []
    for i, proof_file in enumerate(proofs):
        try:
            content = await proof_file.read()
            ext     = (proof_file.filename or "file").rsplit(".", 1)[-1]
            path    = f"pending/{sub_id}_{i}.{ext}"
            db.storage.from_("proofs").upload(
                path=path, file=content,
                file_options={"content-type": proof_file.content_type or "image/png"},
            )
            pub_url = db.storage.from_("proofs").get_public_url(path)
            uploaded_urls.append(pub_url)
            db.table("pending_proofs").insert(
                {"submission_id": sub_id, "url": pub_url}
            ).execute()
        except Exception:
            pass

    await send_webhook({"embeds": [{
        "title":  "📥 New Report Submission",
        "color":  0xE53935,
        "fields": [
            {"name": "Submitted By", "value": f"{user_name} (`{user_id}`)", "inline": True},
            {"name": "Target",       "value": f"`{target}`",                "inline": True},
            {"name": "Type",         "value": target_type.capitalize(),     "inline": True},
            {"name": "Description",  "value": description[:500],            "inline": False},
            {"name": "Proofs",       "value": str(len(uploaded_urls)),       "inline": True},
            {"name": "Submission ID","value": f"`{sub_id}`",                "inline": True},
        ],
        "image":  {"url": uploaded_urls[0]} if uploaded_urls else None,
        "footer": {"text": "Use /addreport in bot to approve"},
    }]})

    return {"success": True, "submission_id": sub_id, "proof_count": len(uploaded_urls)}


# Vercel strips /api prefix before calling the function, so mount at root.
# /api prefix mount is kept for local uvicorn dev server.
app.include_router(main_router)
app.include_router(main_router, prefix="/api")
