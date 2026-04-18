// js/main.js
// Page initialization, stats counter
// Navbar scroll is handled by animations.js

document.addEventListener("DOMContentLoaded", async () => {
  loadStats();
});

async function loadStats() {
  try {
    // Fetch aggregate counts from the API
    const resp = await fetch(`${API_BASE}/stats`);
    if (!resp.ok) return;
    const data = await resp.json();
    animateCount("stat-scammers", data.scammers || 0);
    animateCount("stat-trusted",  data.trusted  || 0);
  } catch {
    // Silently fail — stats are decorative
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1200;
  const start    = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
