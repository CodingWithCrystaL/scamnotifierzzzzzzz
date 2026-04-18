# 🛡 Scam Notifier — Full Setup Guide

## Project Structure

```
scam-notifier/
├── bot/                        # Discord bot (Python)
│   ├── main.py                 # Entry point
│   ├── config.py               # Env vars & constants
│   ├── database.py             # Supabase DB calls
│   ├── utils.py                # Snowflake decoder, embeds, Discord fetchers
│   ├── views.py                # Discord UI buttons & proof paginator
│   ├── requirements.txt
│   └── cogs/
│       ├── check.py            # +check / /check (public)
│       ├── admin.py            # /addreport /setstatus /addproof /delete
│       └── dm_warning.py       # Auto-DM warning on joining scam server
│
├── api/                        # FastAPI backend
│   ├── main.py                 # All routes: /check /auth /submit-report
│   ├── stats.py                # /stats endpoint
│   ├── requirements.txt
│   └── Procfile                # Railway/Render deployment
│
├── website/                    # Static frontend (Vercel)
│   ├── index.html              # Hero + check UI
│   ├── vercel.json
│   ├── css/
│   │   └── main.css            # Full dark red/black theme
│   ├── js/
│   │   ├── config.js           # API_BASE url
│   │   ├── auth.js             # Discord OAuth
│   │   ├── check.js            # Check form + result rendering
│   │   ├── main.js             # Stats, navbar scroll
│   │   └── report.js           # Report submission form
│   ├── pages/
│   │   └── report.html         # Report submission page
│   └── auth/
│       └── callback.html       # OAuth callback handler
│
├── supabase/
│   └── schema.sql              # Full DB schema + indexes + RLS
│
└── .env.example                # All env vars documented
```

---

## STEP 1 — Supabase Setup

1. Go to https://supabase.com → Create a new project
2. In your project → **SQL Editor** → paste and run `supabase/schema.sql`
3. Go to **Storage** → Create a bucket named `proofs` → set it to **Public**
4. Copy your **Project URL** and **service_role key** (Settings → API)

---

## STEP 2 — Discord Application Setup

1. Go to https://discord.com/developers/applications
2. Click **New Application** → Name it "Scam Notifier"
3. Go to **Bot** tab → Click **Add Bot** → Copy the **Token**
4. Under **Privileged Gateway Intents**, enable:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Go to **OAuth2** tab → Copy **Client ID** and **Client Secret**
6. Under **OAuth2 → Redirects**, add:
   `https://your-website.vercel.app/auth/callback.html`
7. Generate invite URL:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`
   - Invite the bot to your server

---

## STEP 3 — Admin Role Setup

1. In your Discord server, create a role named `Scam Notifier Admin`
2. Copy the Role ID (Enable Developer Mode → right-click role → Copy ID)
3. Paste into `.env` as `ADMIN_ROLE_ID`

---

## STEP 4 — Admin Webhook Setup

1. In your private admin Discord channel → Edit Channel → Integrations → Webhooks
2. Create a webhook → Copy the URL
3. Paste into `.env` as `ADMIN_WEBHOOK_URL`

---

## STEP 5 — Environment Variables

Copy `.env.example` to `.env` in both `/bot` and `/api` folders:

```bash
cp .env.example bot/.env
cp .env.example api/.env
```

Fill in all values in both files.

---

## STEP 6 — Run the Bot (Local)

```bash
cd bot
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## STEP 7 — Run the API (Local)

```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000
Docs at: http://localhost:8000/docs

---

## STEP 8 — Deploy the Website (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. From the `website/` directory:
```bash
cd website
vercel deploy --prod
```
3. In Vercel project settings → Environment Variables:
   - `_API_BASE` → `https://your-api-domain.com`
   - `_DISCORD_CLIENT_ID` → your Discord Client ID
   - `_REDIRECT_URI` → `https://your-website.vercel.app/auth/callback.html`

4. Update `website/js/config.js` with your actual values for local testing.

---

## STEP 9 — Deploy the API (Railway)

1. Push the `api/` folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add all environment variables from `.env`
4. Railway will auto-detect the `Procfile` and deploy

---

## Bot Commands Reference

### Public (anyone)
| Command | Description |
|---------|-------------|
| `+check discord.gg/code` | Check a server by invite |
| `+check 123456789 server` | Check a server by ID |
| `+check 123456789 user` | Check a user by ID |
| `/check target:discord.gg/code` | Slash command version |

### Admin Only (requires ADMIN_ROLE_ID)
| Command | Description |
|---------|-------------|
| `/addreport` | Add a scammer or trusted report |
| `/setstatus` | Change status of existing report |
| `/addproof` | Add a proof image to a report |
| `/delete` | Remove a report entirely |

---

## How Data Syncs (Bot ↔ Website ↔ DB)

```
Discord Bot ──/addreport──► Supabase DB ◄── Website Check
                                 │
                    Website Submit Report
                                 │
                         pending_submissions
                                 │
                    Admin reviews via webhook
                                 │
                         /addreport in bot
                                 │
                          Supabase DB (live)
```

Both the bot and the website hit the **same Supabase database**.
Whatever the admin adds via bot commands is instantly visible on the website.
Whatever a user submits via the website is sent to the admin webhook in Discord for review.

---

## Security Notes

- Use `SUPABASE_SERVICE_KEY` only in the API/bot (server-side) — never expose it to the browser
- The website uses `SUPABASE_ANON_KEY` for public reads only (RLS enforced)
- Admin commands are role-gated in the bot — no one without `ADMIN_ROLE_ID` can modify the DB via bot
- All write operations go through the API or bot, never directly from the browser
