// js/auth.js
// Handles Discord OAuth login / logout and session persistence

const AUTH_KEY = "sn_user";

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY)) || null;
  } catch { return null; }
}

function setUser(user) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearUser() {
  sessionStorage.removeItem(AUTH_KEY);
}

function loginDiscord() {
  const params = new URLSearchParams({
    client_id:     DISCORD_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "identify guilds guilds.join",
  });
  window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
}

function logoutDiscord() {
  clearUser();
  renderNavAuth();
}

function avatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;
}

function renderNavAuth() {
  const el = document.getElementById("nav-auth");
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `
      <div class="user-pill">
        <img src="${avatarUrl(user)}" alt="${user.username}" onerror="this.style.display='none'"/>
        <span>${user.username}</span>
        <button onclick="logoutDiscord()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:12px;margin-left:4px;">✕</button>
      </div>`;
  } else {
    el.innerHTML = `
      <button class="btn-discord" onclick="loginDiscord()">
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M15.25 1.17A14.9 14.9 0 0 0 11.52 0c-.18.32-.38.75-.52 1.09a13.8 13.8 0 0 0-4 0C6.86.75 6.65.32 6.47 0A14.87 14.87 0 0 0 2.74 1.17 15.75 15.75 0 0 0 0 12.17a14.92 14.92 0 0 0 4.54 2.3c.37-.5.7-1.03.98-1.59a9.7 9.7 0 0 1-1.54-.74l.37-.29a10.65 10.65 0 0 0 9.3 0l.37.29a9.6 9.6 0 0 1-1.54.74c.28.56.61 1.09.97 1.59A14.87 14.87 0 0 0 18 12.17 15.72 15.72 0 0 0 15.25 1.17ZM6 10c-.83 0-1.5-.77-1.5-1.71S5.16 6.57 6 6.57s1.51.78 1.5 1.72S6.84 10 6 10Zm6 0c-.83 0-1.5-.77-1.5-1.71s.66-1.72 1.5-1.72 1.51.78 1.5 1.72S12.84 10 12 10Z" fill="currentColor"/></svg>
        Connect Discord
      </button>`;
  }
}

document.addEventListener("DOMContentLoaded", renderNavAuth);
