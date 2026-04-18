// js/report.js
// Handles the report submission page — auth gate, form, upload, webhook

const MAX_PROOFS    = 8;
let selectedFiles   = [];
let currentTypeRep  = "server";

document.addEventListener("DOMContentLoaded", () => {
  renderPage();
  renderNavAuth();
});

function renderPage() {
  const body = document.getElementById("page-body");
  const user = getUser();

  if (!user) {
    body.innerHTML = `
      <div class="auth-gate">
        <div style="font-size:48px;margin-bottom:16px;">🔒</div>
        <h2>Login Required</h2>
        <p>You must connect your Discord account to submit a report.<br/>This helps us prevent spam and verify submissions.</p>
        <button class="btn-discord" style="display:inline-flex;margin:0 auto" onclick="loginDiscord()">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M15.25 1.17A14.9 14.9 0 0 0 11.52 0c-.18.32-.38.75-.52 1.09a13.8 13.8 0 0 0-4 0C6.86.75 6.65.32 6.47 0A14.87 14.87 0 0 0 2.74 1.17 15.75 15.75 0 0 0 0 12.17a14.92 14.92 0 0 0 4.54 2.3c.37-.5.7-1.03.98-1.59a9.7 9.7 0 0 1-1.54-.74l.37-.29a10.65 10.65 0 0 0 9.3 0l.37.29a9.6 9.6 0 0 1-1.54.74c.28.56.61 1.09.97 1.59A14.87 14.87 0 0 0 18 12.17 15.72 15.72 0 0 0 15.25 1.17ZM6 10c-.83 0-1.5-.77-1.5-1.71S5.16 6.57 6 6.57s1.51.78 1.5 1.72S6.84 10 6 10Zm6 0c-.83 0-1.5-.77-1.5-1.71s.66-1.72 1.5-1.72 1.51.78 1.5 1.72S12.84 10 12 10Z" fill="currentColor"/></svg>
          Connect Discord
        </button>
      </div>`;
    return;
  }

  // Pre-fill from query params if navigated from check result
  const sp     = new URLSearchParams(window.location.search);
  const preId  = sp.get("target") || "";
  const preType = sp.get("type") || "server";

  body.innerHTML = `
    <div class="form-card">
      <h1 class="form-title">Submit a Report</h1>
      <p class="form-sub">
        Reporting as <strong style="color:var(--text)">${escHtml(user.username)}</strong>.
        All submissions are reviewed by our admin team before being published.
      </p>

      <div id="form-alert"></div>

      <div class="form-group">
        <label>What are you reporting?</label>
        <div class="check-tabs" style="max-width:100%">
          <button class="check-tab ${preType==='server'?'active':''}" data-type="server" onclick="switchRepType('server',this)"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg> Server</button>
          <button class="check-tab ${preType==='user'?'active':''}" data-type="user"   onclick="switchRepType('user',this)"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> User</button>
        </div>
      </div>

      <div class="form-group">
        <label>Server Invite / Vanity / ID  or  User ID <span style="color:var(--pink)">*</span></label>
        <input type="text" id="rep-target" value="${escHtml(preId)}" placeholder="discord.gg/example or 123456789012345678" />
      </div>

      <div class="form-group">
        <label>Description - What did they do? <span style="color:var(--pink)">*</span></label>
        <textarea id="rep-desc" placeholder="Describe the scam in detail. Include what happened, when, and how much was lost if applicable..."></textarea>
      </div>

      <div class="form-group">
        <label>Proof Images <span style="color:var(--pink)">*</span> (min 1, max ${MAX_PROOFS})</label>
        <div class="proof-drop" id="proof-drop" onclick="document.getElementById('proof-input').click()" 
             ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
          <input type="file" id="proof-input" accept="image/*" multiple onchange="handleFileSelect(this.files)" />
          <div class="proof-drop-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2v0Z"/></svg></div>
          <div class="proof-drop-label">Click or drag images here</div>
          <div class="proof-drop-hint">PNG, JPG, GIF, WEBP - max 8 files</div>
        </div>
        <div class="proof-previews" id="proof-previews"></div>
      </div>

      <button class="btn-submit" id="submit-btn" onclick="submitReport()">
        📨 Submit Report
      </button>
    </div>`;

  currentTypeRep = preType;
}

function switchRepType(type, el) {
  currentTypeRep = type;
  document.querySelectorAll(".check-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

// ── File Handling ─────────────────────────────────────

function handleFileSelect(files) {
  addFiles(Array.from(files));
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("proof-drop")?.classList.add("dragging");
}

function handleDragLeave() {
  document.getElementById("proof-drop")?.classList.remove("dragging");
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("proof-drop")?.classList.remove("dragging");
  addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
}

function addFiles(files) {
  for (const f of files) {
    if (selectedFiles.length >= MAX_PROOFS) break;
    if (!f.type.startsWith("image/")) continue;
    selectedFiles.push(f);
  }
  renderPreviews();
}

function removeFile(idx) {
  selectedFiles.splice(idx, 1);
  renderPreviews();
}

function renderPreviews() {
  const container = document.getElementById("proof-previews");
  if (!container) return;
  container.innerHTML = selectedFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    return `
      <div class="proof-preview-wrap">
        <img src="${url}" alt="Proof ${i+1}" />
        <button class="proof-remove" onclick="removeFile(${i})">✕</button>
      </div>`;
  }).join("");
}

// ── Submit ────────────────────────────────────────────

async function submitReport() {
  const user   = getUser();
  const target = document.getElementById("rep-target")?.value.trim();
  const desc   = document.getElementById("rep-desc")?.value.trim();
  const btn    = document.getElementById("submit-btn");
  const alert  = document.getElementById("form-alert");

  if (!target) { showAlert("error", "Target ID or invite link is required."); return; }
  if (!desc)   { showAlert("error", "Description is required.");             return; }
  if (selectedFiles.length === 0) { showAlert("error", "At least one proof image is required."); return; }

  btn.disabled    = true;
  btn.textContent = "Submitting...";
  showAlert("", "");

  try {
    const fd = new FormData();
    fd.append("target",      target);
    fd.append("target_type", currentTypeRep);
    fd.append("description", desc);
    fd.append("user_id",     user.id);
    fd.append("user_name",   user.username);
    for (const f of selectedFiles) fd.append("proofs", f);

    const resp = await fetch(`${API_BASE}/submit-report`, { method: "POST", body: fd });
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.detail || "Submission failed");

    showAlert("success", `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> Report submitted successfully! Our admins will review it shortly. Submission ID: ${data.submission_id}`);
    document.getElementById("rep-target").value = "";
    document.getElementById("rep-desc").value   = "";
    selectedFiles = [];
    renderPreviews();
  } catch (err) {
    showAlert("error", `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${err.message}`);
  } finally {
    btn.disabled    = false;
    btn.innerHTML   = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px; margin-right: 6px;"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Submit Report`;
  }
}

function showAlert(type, msg) {
  const el = document.getElementById("form-alert");
  if (!el) return;
  if (!type || !msg) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="alert ${type}">${escHtml(msg)}</div>`;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
