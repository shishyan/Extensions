/**
 * TubeMetrix v100.0.0 — Popup Controller (Keywords, Daily Ideas, Competitor Spy, Swipe File)
 */

let latestKwData = null;
let activeKwMode = "suggestions";

function fmtCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

// Navigation tabs
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".pane").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const pane = document.getElementById(`pane-${btn.dataset.pane}`);
    if (pane) pane.classList.add("active");
    if (btn.dataset.pane === "swipe") loadSwipeFile();
    if (btn.dataset.pane === "comp") loadSavedCompetitors();
  });
});

document.getElementById("open-full-dash").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// --- TAB 1: KEYWORDS ---
function renderKwTable() {
  const tbody = document.getElementById("kw-tbody");
  if (!latestKwData) return;
  const list =
    latestKwData[activeKwMode] && latestKwData[activeKwMode].length
      ? latestKwData[activeKwMode]
      : latestKwData.suggestions || [];

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">No items in this category.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(
      (item) => `
    <tr class="click-row" data-kw="${item.keyword.replace(/"/g, "&quot;")}">
      <td style="font-weight:700;color:#f1f5f9;">${item.keyword}</td>
      <td style="color:#38bdf8;">${fmtCompact(item.estMonthlySearches)}</td>
      <td style="color:#f59e0b;">${item.competition}</td>
      <td style="color:#10b981;font-weight:900;">${item.opportunity}</td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll(".click-row").forEach((row) => {
    row.addEventListener("click", () => {
      navigator.clipboard.writeText(row.dataset.kw).catch(() => {});
      document.getElementById("kw-status").textContent = `✅ Copied "${row.dataset.kw}"`;
    });
  });
}

function runKeywordSearch() {
  const q = document.getElementById("kw-input").value.trim() || "youtube growth";
  const status = document.getElementById("kw-status");
  status.textContent = `⏳ Mining live YouTube SERP for "${q}"...`;

  chrome.runtime.sendMessage({ type: "TM_KEYWORD_RESEARCH", query: q }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.ok || !resp.data) {
      status.textContent = "⚠️ Could not reach background worker.";
      return;
    }
    latestKwData = resp.data;
    document.getElementById("kw-opp").textContent = `${resp.data.overallScore}/100`;
    document.getElementById("kw-dem").textContent = `${resp.data.avgDemand}/100`;
    document.getElementById("kw-cmp").textContent = `${resp.data.avgCompetition}/100`;
    status.textContent = `✅ Top Views: ${fmtCompact(resp.data.serpStats?.highestViews || 0)} · Median: ${fmtCompact(
      resp.data.serpStats?.medianViews || 0
    )}`;
    renderKwTable();
  });
}

document.getElementById("kw-btn").addEventListener("click", runKeywordSearch);
document.getElementById("kw-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runKeywordSearch();
});
document.querySelectorAll(".subtab").forEach((st) => {
  st.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((s) => s.classList.remove("active"));
    st.classList.add("active");
    activeKwMode = st.dataset.kmode;
    renderKwTable();
  });
});
document.getElementById("kw-copy-all").addEventListener("click", () => {
  if (!latestKwData) return;
  const list = latestKwData[activeKwMode]?.length ? latestKwData[activeKwMode] : latestKwData.suggestions;
  const tags = list.slice(0, 15).map((x) => x.keyword).join(", ");
  navigator.clipboard.writeText(tags).catch(() => {});
  document.getElementById("kw-status").textContent = "✅ Copied Top 15 Tags to clipboard!";
});

// --- TAB 2: DAILY IDEAS ---
function runDailyIdeas() {
  const niche = document.getElementById("idea-niche").value.trim() || "tech tutorials";
  const box = document.getElementById("ideas-list");
  box.innerHTML = `<div style="padding:16px;text-align:center;color:#94a3b8;">⏳ Generating 10 View-Predicted ideas for "${niche}"...</div>`;

  chrome.runtime.sendMessage({ type: "TM_DAILY_IDEAS", niche }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.ok || !resp.ideas) {
      box.innerHTML = `<div style="padding:16px;color:#ef4444;">Failed to generate ideas.</div>`;
      return;
    }
    chrome.storage.local.get({ tmSavedIdeas: [] }, (st) => {
      box.innerHTML = resp.ideas
        .map(
          (id) => `
        <div class="item-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="pill">${id.prediction} Views · Score ${id.opportunityScore}</span>
            <span style="font-size:10px;color:#38bdf8;">${id.formatBadge}</span>
          </div>
          <div style="font-weight:800;font-size:12.5px;color:#f8fafc;margin-top:2px;">${id.title}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
            <span style="font-size:10.5px;color:#94a3b8;">Seed: "${id.seedKeyword}" (${fmtCompact(id.estSearches)}/mo)</span>
            <button class="dash-btn save-idea-btn" data-title="${id.title.replace(/"/g, "&quot;")}">📋 Copy & Save</button>
          </div>
        </div>`
        )
        .join("");

      box.querySelectorAll(".save-idea-btn").forEach((b) => {
        b.addEventListener("click", () => {
          const t = b.dataset.title;
          navigator.clipboard.writeText(t).catch(() => {});
          chrome.storage.local.get({ tmSavedIdeas: [] }, (r) => {
            const arr = r.tmSavedIdeas || [];
            arr.unshift({ title: t, savedAt: new Date().toISOString() });
            chrome.storage.local.set({ tmSavedIdeas: arr.slice(0, 100) });
          });
          b.textContent = "✅ Saved!";
        });
      });
    });
  });
}
document.getElementById("idea-btn").addEventListener("click", runDailyIdeas);

// --- TAB 3: COMPETITORS ---
function renderCompetitorCard(d) {
  return `
    <div class="item-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:13px;color:#38bdf8;">${d.name}</strong>
        <span class="pill">${d.subscribersText}</span>
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:#cbd5e1;margin-top:3px;">
        <span>📊 Median: <strong>${fmtCompact(d.medianViews)}</strong></span>
        <span>🚀 Avg VPH: <strong style="color:#38bdf8">${fmtCompact(d.avgVph)}</strong></span>
        <span>📅 30d Uploads: <strong>${d.uploadsLast30d}</strong></span>
      </div>
      ${
        d.breakoutVideo
          ? `<div style="margin-top:5px;padding:6px;background:#090d16;border-radius:6px;border:1px solid #1e293b;font-size:11px;">
              🔥 <strong>Breakout (${d.breakoutVideo.outlierScore}x):</strong>
              <a href="https://www.youtube.com/watch?v=${d.breakoutVideo.videoId}" target="_blank" style="color:#34d399;text-decoration:none;">${d.breakoutVideo.title}</a>
              (${fmtCompact(d.breakoutVideo.views)} views)
            </div>`
          : ""
      }
    </div>
  `;
}

function spyChannel(handle) {
  const box = document.getElementById("comp-list");
  box.innerHTML = `<div style="padding:16px;text-align:center;color:#94a3b8;">⏳ Auditing ${handle} live on YouTube...</div>`;
  chrome.runtime.sendMessage({ type: "TM_FETCH_COMPETITOR", channel: handle }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.ok || !resp.data) {
      box.innerHTML = `<div style="padding:16px;color:#ef4444;">Could not fetch channel ${handle}.</div>`;
      return;
    }
    const d = resp.data;
    chrome.storage.local.get({ tmCompetitors: [] }, (res) => {
      const list = res.tmCompetitors || [];
      const existingIdx = list.findIndex((c) => c.handle.toLowerCase() === handle.toLowerCase());
      const entry = { handle, name: d.name, snapshot: d, updatedAt: new Date().toISOString() };
      if (existingIdx >= 0) list[existingIdx] = entry;
      else list.unshift(entry);
      chrome.storage.local.set({ tmCompetitors: list.slice(0, 25) }, loadSavedCompetitors);
    });
  });
}

function loadSavedCompetitors() {
  const box = document.getElementById("comp-list");
  chrome.storage.local.get({ tmCompetitors: [] }, (res) => {
    const list = res.tmCompetitors || [];
    if (!list.length) {
      box.innerHTML = `<div style="padding:16px;text-align:center;color:#94a3b8;">No tracked competitors yet. Enter @fireship or click "➕ Track Competitor" on any YouTube video/channel!</div>`;
      return;
    }
    box.innerHTML = list
      .map((c) =>
        c.snapshot
          ? renderCompetitorCard(c.snapshot)
          : `<div class="item-card" style="flex-direction:row;justify-content:space-between;align-items:center;">
              <span><strong>${c.name || c.handle}</strong></span>
              <button class="dash-btn refresh-comp" data-h="${c.handle}">🔄 Fetch Live Metrics</button>
            </div>`
      )
      .join("");
    box.querySelectorAll(".refresh-comp").forEach((b) => {
      b.onclick = () => spyChannel(b.dataset.h);
    });
  });
}

document.getElementById("comp-add-btn").addEventListener("click", () => {
  const v = document.getElementById("comp-input").value.trim();
  if (v) spyChannel(v);
});

// --- TAB 4: SWIPE FILE ---
function loadSwipeFile() {
  const box = document.getElementById("swipe-list");
  chrome.storage.local.get({ tmSwipeFile: [] }, (res) => {
    const list = res.tmSwipeFile || [];
    if (!list.length) {
      box.innerHTML = `<div style="padding:20px;text-align:center;color:#94a3b8;">Click the <strong>★</strong> button on any YouTube thumbnail badge to save Outlier Thumbnails & Titles into your Swipe File!</div>`;
      return;
    }
    box.innerHTML = list
      .map(
        (item) => `
      <div class="item-card" style="flex-direction:row;gap:10px;align-items:center;">
        <img src="${item.thumb}" style="width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;" />
        <div style="flex:1;">
          <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" style="color:#f8fafc;font-weight:700;text-decoration:none;display:block;">${item.title.slice(0, 65)}</a>
          <div style="font-size:10.5px;color:#34d399;margin-top:3px;">🔥 ${item.outlier}x Outlier · ${fmtCompact(item.vph)} VPH · ${fmtCompact(item.views)} views</div>
        </div>
      </div>`
      )
      .join("");
  });
}

// Initial boot
runKeywordSearch();
