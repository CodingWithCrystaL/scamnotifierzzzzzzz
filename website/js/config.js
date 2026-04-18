const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:8000" 
    : "/api";
const DISCORD_CLIENT_ID = "1491956010938535978";
const REDIRECT_URI = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5500/auth/callback"
    : `https://${window.location.hostname}/auth/callback`;