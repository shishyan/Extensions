/**
 * TubeMetrix v100.0.0 — Full-Page Studio Command Center Controller (options.js)
 */

let dashKwRows = [];

function fmt(n) {
  const num = Number(n) || 0;
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

document.querySelectorAll(".side-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".side-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`sec-${btn.dataset.sec}`).classList.add("active");
    if (btn.dataset.sec === "swipe") renderSwipeGrid();
    if (btn.dataset.sec === "comp") renderCompetitors();
    if (btn.dataset.sec === "ab") evaluateAbVariants();
  });
});

// 1. Keywords
function runDashKw() {
  const q = document.getElementById("d-kw-in").value.trim() || "youtube growth";
  const tbody = document.getElementById("d-kw-tbody");
  tbody.innerHTML = `<tr><td colspan="6" style="color:#94a3b8;">⏳ Scraping live YouTube SERP & multi-intent autocomplete for "${q}"...</td></tr>`;

  chrome.runtime.sendMessage({ type: "TM_KEYWORD_RESEARCH", query: q }, (resp) => {
    if (!resp || !resp.ok || !resp.data) return;
    const d = resp.data;
    document.getElementById("d-opp").textContent = `${d.overallScore}/100`;
    document.getElementById("d-dem").textContent = `${d.avgDemand}/100`;
    document.getElementById("d-cmp").textContent = `${d.avgCompetition}/100`;
    document.getElementById("d-med").textContent = fmt(d.serpStats?.medianViews || 0);

    dashKwRows = [...(d.hiddenGems || []), ...(d.suggestions || []), ...(d.questions || []), ...(d.comparisons || [])];
    const seen = new Set();
    dashKwRows = dashKwRows.filter((r) => {
      if (seen.has(r.keyword)) return false;
      seen.add(r.keyword);
      return true;
    });

    tbody.innerHTML = dashKwRows
      .map(
        (r) => `
      <tr style="cursor:pointer;" data-kw="${r.keyword.replace(/"/g, "&quot;")}">
        <td style="font-weight:700;">${r.keyword}</td>
        <td><span style="background:#1e293b;padding:3px 8px;border-radius:6px;font-size:11px;">${r.category}</span></td>
        <td style="color:#38bdf8;">${fmt(r.estMonthlySearches)}</td>
        <td>${r.demand}</td>
        <td style="color:#f59e0b;">${r.competition}</td>
        <td style="color:#10b981;font-weight:900;">${r.opportunity}</td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("tr[data-kw]").forEach((tr) => {
      tr.onclick = () => {
        navigator.clipboard.writeText(tr.dataset.kw).catch(() => {});
        tr.style.background = "rgba(16,185,129,0.2)";
      };
    });
  });
}

document.getElementById("d-kw-btn").onclick = runDashKw;
document.getElementById("d-kw-csv").onclick = () => {
  if (!dashKwRows.length) return;
  const lines = [
    "Keyword,Category,EstMonthlySearches,Demand,Competition,Opportunity",
    ...dashKwRows.map((r) => `"${r.keyword.replace(/"/g, '""')}",${r.category},${r.estMonthlySearches},${r.demand},${r.competition},${r.opportunity}`)
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tubemetrix-keywords.csv";
  a.click();
};

// 2. Daily Ideas
function runDashIdeas() {
  const niche = document.getElementById("d-idea-in").value.trim() || "artificial intelligence";
  const box = document.getElementById("d-ideas-box");
  box.innerHTML = `<div style="color:#94a3b8;">⏳ Generating 10 View-Predicted ideas...</div>`;
  chrome.runtime.sendMessage({ type: "TM_DAILY_IDEAS", niche }, (resp) => {
    if (!resp || !resp.ok || !resp.ideas) return;
    box.innerHTML = `<table><thead><tr><th>Predicted Viral Title</th><th>Format</th><th>Seed Keyword</th><th>Est. Vol</th><th>Prediction</th></tr></thead><tbody>${resp.ideas
      .map(
        (i) => `
      <tr>
        <td style="font-weight:800;color:#f8fafc;">${i.title}</td>
        <td style="color:#38bdf8;">${i.formatBadge}</td>
        <td>${i.seedKeyword}</td>
        <td>${fmt(i.estSearches)}/mo</td>
        <td style="color:#10b981;font-weight:800;">${i.prediction} (${i.opportunityScore})</td>
      </tr>`
      )
      .join("")}</tbody></table>`;
  });
}
document.getElementById("d-idea-btn").onclick = runDashIdeas;

// 3. Competitors
function renderCompetitors() {
  const box = document.getElementById("d-comp-box");
  chrome.storage.local.get({ tmCompetitors: [] }, (res) => {
    const list = res.tmCompetitors || [];
    if (!list.length) {
      box.innerHTML = `<div class="panel" style="color:#94a3b8;">No competitors added yet. Enter a handle like <strong>@fireship</strong> above!</div>`;
      return;
    }
    box.innerHTML = list
      .map((c) => {
        const s = c.snapshot;
        if (!s) return `<div class="panel"><strong>${c.handle}</strong></div>`;
        return `
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <h2 style="font-size:19px;">${s.name}</h2>
              <span style="color:#34d399;font-size:13px;font-weight:700;">${s.subscribersText}</span>
            </div>
            <a href="${s.url}" target="_blank" class="btn">Visit Channel ↗</a>
          </div>
          <div class="grid-4" style="margin-bottom:12px;">
            <div class="stat-card"><div class="stat-val">${fmt(s.medianViews)}</div><div class="stat-lbl">Median Views</div></div>
            <div class="stat-card"><div class="stat-val">${fmt(s.avgViews)}</div><div class="stat-lbl">Average Views</div></div>
            <div class="stat-card"><div class="stat-val" style="color:#10b981">${fmt(s.avgVph)}</div><div class="stat-lbl">Avg VPH</div></div>
            <div class="stat-card"><div class="stat-val" style="color:#34d399">${s.estMonthlyRevLow ? `$${fmt(s.estMonthlyRevLow)}–$${fmt(s.estMonthlyRevHigh)}` : s.uploadsLast30d}</div><div class="stat-lbl">${s.estMonthlyRevLow ? `Est. Monthly Rev (${s.uploadsLast30d} in 30d)` : "Uploads (30d)"}</div></div>
          </div>
          ${
            s.breakoutVideo
              ? `<div style="padding:12px;background:#070b14;border-radius:10px;border:1px solid #1e293b;">
                  🔥 <strong>#1 Breakout Outlier (${s.breakoutVideo.outlierScore}x Median):</strong>
                  <a href="https://www.youtube.com/watch?v=${s.breakoutVideo.videoId}" target="_blank" style="color:#38bdf8;font-weight:700;margin-left:6px;">${s.breakoutVideo.title}</a>
                  — <strong>${fmt(s.breakoutVideo.views)} views</strong> (${fmt(s.breakoutVideo.vph)} VPH)
                </div>`
              : ""
          }
        </div>`;
      })
      .join("");
  });
}

document.getElementById("d-comp-btn").onclick = () => {
  const handle = document.getElementById("d-comp-in").value.trim();
  if (!handle) return;
  document.getElementById("d-comp-box").innerHTML = `<div class="panel">⏳ Fetching live channel metrics for ${handle}...</div>`;
  chrome.runtime.sendMessage({ type: "TM_FETCH_COMPETITOR", channel: handle }, (resp) => {
    if (!resp || !resp.ok || !resp.data) return;
    chrome.storage.local.get({ tmCompetitors: [] }, (res) => {
      const list = res.tmCompetitors || [];
      list.unshift({ handle, name: resp.data.name, snapshot: resp.data, updatedAt: new Date().toISOString() });
      chrome.storage.local.set({ tmCompetitors: list.slice(0, 25) }, renderCompetitors);
    });
  });
};

// 4. A/B Lab
function scoreTitleCtr(t) {
  let s = 45;
  if (t.length >= 42 && t.length <= 68) s += 18;
  if (/\d+/.test(t)) s += 12;
  if (/[|—\-:?!()]/.test(t)) s += 12;
  if (/\b(i |my |why |stop |secret|truth|exact|roadmap|tried|tested)\b/i.test(t)) s += 12;
  return Math.min(99, s);
}

function evaluateAbVariants() {
  const ta = document.getElementById("ab-t-a").value;
  const tb = document.getElementById("ab-t-b").value;
  const ia = document.getElementById("ab-i-a").value;
  const ib = document.getElementById("ab-i-b").value;
  document.getElementById("ab-img-a").src = ia;
  document.getElementById("ab-img-b").src = ib;
  document.getElementById("ab-title-preview-a").textContent = ta;
  document.getElementById("ab-title-preview-b").textContent = tb;
  const sa = scoreTitleCtr(ta);
  const sb = scoreTitleCtr(tb);
  document.getElementById("ab-score-a").textContent = `Predicted CTR Score: ${sa}/100 ${sa >= sb ? "🏆 WINNER" : ""}`;
  document.getElementById("ab-score-b").textContent = `Predicted CTR Score: ${sb}/100 ${sb > sa ? "🏆 WINNER" : ""}`;
}
["ab-t-a", "ab-t-b", "ab-i-a", "ab-i-b"].forEach((id) => {
  document.getElementById(id).addEventListener("input", evaluateAbVariants);
});

// 5. Swipe File
function renderSwipeGrid() {
  const grid = document.getElementById("d-swipe-grid");
  chrome.storage.local.get({ tmSwipeFile: [] }, (res) => {
    const list = res.tmSwipeFile || [];
    if (!list.length) {
      grid.innerHTML = `<div class="panel" style="grid-column:1/-1;color:#94a3b8;">Click the <strong>★</strong> button on any YouTube video thumbnail badge to save outlier hits here!</div>`;
      return;
    }
    grid.innerHTML = list
      .map(
        (it) => `
      <div class="swipe-card">
        <img src="${it.thumb}" />
        <div class="swipe-card-body">
          <a href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" style="color:#fff;font-weight:800;text-decoration:none;font-size:13.5px;">${it.title}</a>
          <div style="color:#34d399;font-size:12px;font-weight:700;margin-top:6px;">🔥 ${it.outlier}x Outlier · ${fmt(it.vph)} VPH · ${fmt(it.views)} views</div>
        </div>
      </div>`
      )
      .join("");
  });
}

runDashKw();
evaluateAbVariants();
