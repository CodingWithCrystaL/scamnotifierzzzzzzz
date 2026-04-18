// public/js/config.js
const _isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = _isLocal ? "http://localhost:8000" : "/api";

const DISCORD_CLIENT_ID = "1491956010938535978";

const REDIRECT_URI = _isLocal
  ? "http://localhost:5500/auth/callback"
  : "https://scam-notifier.vercel.app/auth/callback";
