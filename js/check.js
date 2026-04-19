// js/check.js
// Handles the check form, API call, and result rendering

let currentType   = "server";
let currentProofs = [];
let proofModalIdx = 0;

function switchType(type, el) {
  currentType = type;
  document.querySelectorAll(".check-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  const input = document.getElementById("check-input");
  if (input) {
    input.placeholder = type === "server"
      ? "discord.gg/invite, vanity URL, or Server ID..."
      : "Discord User ID or Username...";
  }
}

function quickFill(val) {
  const input = document.getElementById("check-input");
  if (input) { input.value = val; input.focus(); }
}

async function doCheck() {
  const raw = (document.getElementById("check-input")?.value || "").trim();
  if (!raw) return;

  const btn = document.getElementById("scan-btn");
  if (btn) { btn.classList.add("loading"); btn.disabled = true; }

  const resultSection   = document.getElementById("result-section");
  const resultContainer = document.getElementById("result-container");
  if (resultSection)   resultSection.style.display = "block";
  if (resultContainer) resultContainer.innerHTML   = `<div class="spinner"></div>`;

  resultSection?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const params = new URLSearchParams({ target: raw, type: currentType });
    const resp   = await fetch(`${API_BASE}/check?${params}`);
    if (!resp.ok) throw new Error(`API error ${resp.status}`);
    const data = await resp.json();
    currentProofs = data.proofs || [];
    renderResult(data);
  } catch (err) {
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="result-card not-reported" style="max-width:680px;margin:0 auto;">
          <div class="result-banner-placeholder"></div>
          <div class="result-header">
            <div class="result-avatar">⚠</div>
            <div class="result-info">
              <div class="result-name">Connection Error</div>
              <div class="result-id">Could not reach the API</div>
            </div>
          </div>
          <div class="result-body">
            <p style="color:var(--text-2);font-size:13px;">${escHtml(err.message)}</p>
            <p style="color:var(--text-3);font-size:12px;margin-top:6px;">Make sure the API is running at ${API_BASE}</p>
          </div>
        </div>`;
    }
  } finally {
    if (btn) { btn.classList.remove("loading"); btn.disabled = false; }
  }
}

function renderResult(data) {
  const container = document.getElementById("result-container");
  if (!container) return;

  const {
    status, target_id, target_type, name,
    avatar_url, banner_url, creation_date,
    description, proofs,
    member_count, bio, accent_color,
  } = data;

  const ICONS = {
    alert: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    check: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    square: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    info: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
  };

  const statusLabels = {
    scammer:      `${ICONS.alert}SCAMMER`,
    trusted:      `${ICONS.check}TRUSTED`,
    not_reported: `${ICONS.square}NOT REPORTED`,
  };

  const statusFooters = {
    scammer:      `${ICONS.alert}This server/user has been reported to Scam Notifier.`,
    trusted:      `${ICONS.check}Verified and trusted by Scam Notifier staff.`,
    not_reported: `${ICONS.info}Not in our database - does not mean they're safe.`,
  };

  const label   = statusLabels[status]  || "⬜ NOT REPORTED";
  const footer  = statusFooters[status] || statusFooters.not_reported;
  const cssClass = status === "not_reported" ? "not-reported" : status;
  const isServer = target_type === "server";

  // Banner
  let bannerHtml = "";
  if (banner_url) {
    bannerHtml = `<div class="result-banner"><img src="${escHtml(banner_url)}" alt="Banner" /></div>`;
  } else {
    bannerHtml = `<div class="result-banner"><div class="result-banner-placeholder ${cssClass}"></div></div>`;
  }

  // Avatar
  const avatarClass = isServer ? "result-avatar server-type" : "result-avatar";
  const avatarHtml = avatar_url
    ? `<div class="${avatarClass}"><img src="${escHtml(avatar_url)}" alt="${escHtml(name)}" onerror="this.parentElement.innerHTML='${(name||'?')[0].toUpperCase()}'" /></div>`
    : `<div class="${avatarClass}">${(name || "?")[0].toUpperCase()}</div>`;

  // Meta items
  let metaItems = `
    <div class="meta-item">
      <label>Type</label>
      <value>${isServer ? `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg> Server` : `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> User`}</value>
    </div>
    <div class="meta-item">
      <label>ID</label>
      <value>${escHtml(target_id)}</value>
    </div>`;

  if (creation_date) {
    metaItems += `
      <div class="meta-item">
        <label>Created</label>
        <value>${escHtml(creation_date)}</value>
      </div>`;
  }

  if (member_count) {
    metaItems += `
      <div class="meta-item">
        <label>Members</label>
        <value>${Number(member_count).toLocaleString()}</value>
      </div>`;
  }

  if (!isServer) {
    if (username) {
      metaItems += `
        <div class="meta-item">
          <label>Username</label>
          <value>@${escHtml(username)}</value>
        </div>`;
    }
    if (display_name) {
      metaItems += `
        <div class="meta-item">
          <label>Display Name</label>
          <value>${escHtml(display_name)}</value>
        </div>`;
    }
  } else {
    if (owner_name) {
      metaItems += `
        <div class="meta-item">
          <label>Owner</label>
          <value>${escHtml(owner_name)}</value>
        </div>`;
    }
    if (owner_id) {
      metaItems += `
        <div class="meta-item">
          <label>Owner ID</label>
          <value>${escHtml(owner_id)}</value>
        </div>`;
    }
  }

  // Bio/description
  let bioHtml = "";
  if (bio) {
    bioHtml = `
      <div class="result-description">
        <strong>${isServer ? "Description" : "Bio"}</strong>
        ${escHtml(bio)}
      </div>`;
  }

  // Report reason
  let descHtml = "";
  if (description && status !== "not_reported") {
    descHtml = `
      <div class="result-description">
        <strong>Report Reason</strong>
        ${escHtml(description)}
      </div>`;
  }

  // Proof strip
  let proofHtml = "";
  if (proofs && proofs.length > 0) {
    const visible = proofs.slice(0, 5);
    const more    = proofs.length - 5;
    proofHtml = `
      <div style="margin:14px 0 4px;">
        <div style="font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;">
          Proof Images (${proofs.length})
        </div>
        <div class="result-proof-strip">
          ${visible.map((p, i) => `<img class="proof-thumb" src="${escHtml(p.url)}" data-idx="${i}" onclick="openProofModal(${i})" title="${escHtml(p.label||'Proof #'+(i+1))}" />`).join("")}
          ${more > 0 ? `<div class="proof-more" onclick="openProofModal(5)">+${more}</div>` : ""}
        </div>
      </div>`;
  }

  // Resolution layers
  const dbLayer  = status !== "not_reported" ? "ok" : "miss";
  const apiLayer = name && !name.startsWith("Unknown") ? "ok" : "warn";
  const fbLayer  = creation_date ? "ok" : "warn";

  container.innerHTML = `
    <div class="result-card ${cssClass}">
      ${bannerHtml}
      <div class="result-header">
        ${avatarHtml}
        <div class="result-info">
          <div class="result-name">${escHtml(name || "Unknown")}</div>
          <div class="result-id">${isServer ? "Server" : "User"} · ${escHtml(target_id)}</div>
        </div>
        <span class="result-badge ${cssClass}">${label}</span>
      </div>
      <div class="result-body">
        <div class="layers">
          <div class="layer-pill"><div class="layer-dot ${dbLayer}"></div>Database</div>
          <div class="layer-pill"><div class="layer-dot ${apiLayer}"></div>Discord API</div>
          <div class="layer-pill"><div class="layer-dot ${fbLayer}"></div>Snowflake</div>
        </div>
        <div class="result-meta">
          ${metaItems}
        </div>
        ${bioHtml}
        ${descHtml}
        ${proofHtml}
        <div class="result-footer">${footer}</div>
        <div class="result-actions">
          <button class="btn-sm" onclick="copyToClipboard('${escHtml(target_id)}', this)"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy ID</button>
          ${proofs && proofs.length > 0 ? `<button class="btn-sm" onclick="openProofModal(0)"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2v0Z"/></svg> Proofs (${proofs.length})</button>` : ""}
          <a class="btn-sm" href="pages/report.html?target=${encodeURIComponent(target_id)}&type=${target_type}" style="text-decoration:none"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg> Report This</a>
          <button class="btn-sm" onclick="doCheck()" style="margin-left:auto"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Recheck</button>
        </div>
      </div>
    </div>`;
}

function copyToClipboard(text, btn) {
  navigator.clipboard?.writeText(text).catch(() => {});
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = "✓ Copied!";
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }
}

// ── Proof Modal ─────────────────────────────────────

function openProofModal(startIdx) {
  if (!currentProofs || currentProofs.length === 0) return;
  proofModalIdx = Math.min(startIdx, currentProofs.length - 1);
  renderProofModal();
}

function renderProofModal() {
  document.getElementById("proof-modal")?.remove();

  const proof = currentProofs[proofModalIdx];
  const total = currentProofs.length;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id        = "proof-modal";
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

  // keyboard nav
  overlay._keyHandler = (e) => {
    if (e.key === "ArrowLeft")  navProof(-1);
    if (e.key === "ArrowRight") navProof(1);
    if (e.key === "Escape")     overlay.remove();
  };
  document.addEventListener("keydown", overlay._keyHandler);

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span style="font-family:var(--mono);font-size:12px;">
          Proof #${proofModalIdx + 1}${proof.label ? " - " + escHtml(proof.label) : ""}
        </span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-img-wrap">
        <img src="${escHtml(proof.url)}" alt="Proof ${proofModalIdx + 1}" />
      </div>
      <div class="modal-nav">
        <button class="btn-sm" ${proofModalIdx === 0 ? "disabled" : ""} onclick="navProof(-1)">← Previous</button>
        <span class="modal-counter">${proofModalIdx + 1} / ${total}</span>
        <button class="btn-sm" ${proofModalIdx === total - 1 ? "disabled" : ""} onclick="navProof(1)">Next →</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

function closeModal() {
  const modal = document.getElementById("proof-modal");
  if (modal) {
    document.removeEventListener("keydown", modal._keyHandler);
    modal.remove();
  }
}

function navProof(dir) {
  proofModalIdx = Math.max(0, Math.min(currentProofs.length - 1, proofModalIdx + dir));
  renderProofModal();
}

// ── Utility ─────────────────────────────────────────

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Handle ?id= and ?type= query params on page load
document.addEventListener("DOMContentLoaded", () => {
  const sp = new URLSearchParams(window.location.search);
  const id   = sp.get("id");
  const type = sp.get("type");
  if (id) {
    const input = document.getElementById("check-input");
    if (input) input.value = id;
    if (type) {
      const tab = document.querySelector(`.check-tab[data-type="${type}"]`);
      if (tab) switchType(type, tab);
    }
    doCheck();
  }
});
