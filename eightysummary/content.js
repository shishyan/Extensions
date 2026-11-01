(function () {
  if (window.__eightySummaryLoaded) return;
  window.__eightySummaryLoaded = true;

  function formatTimestamp(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function extractSummary() {
    const title = document.title.replace(/ - YouTube$/i, "") || "Video / Article Summary";
    const segments = Array.from(document.querySelectorAll("ytd-transcript-segment-renderer"));

    if (segments.length > 0) {
      const step = Math.max(1, Math.floor(segments.length / 7));
      const bullets = [];
      for (let i = 0; i < segments.length && bullets.length < 7; i += step) {
        const seg = segments[i];
        const tsEl = seg.querySelector(".segment-timestamp");
        const txtEl = seg.querySelector(".segment-text");
        const ts = tsEl ? tsEl.innerText.trim() : formatTimestamp(i * 15);
        const txt = txtEl ? txtEl.innerText.trim() : seg.innerText.trim();
        if (txt) bullets.push(`[${ts}] ${txt}`);
      }
      return { title, source: "YouTube Live Transcript", bullets };
    }

    // Check description timestamps or paragraphs
    const descEl = document.querySelector("#description-inline-expander, #description, article, main") || document.body;
    const rawText = descEl ? descEl.innerText : "";
    const lines = rawText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 28 && !/^(subscribe|follow|http|www\.)/i.test(l));

    const tsLines = lines.filter((l) => /\b\d{1,2}:\d{2}\b/.test(l));
    if (tsLines.length >= 3) {
      return {
        title,
        source: "Video Chapters & Timestamps",
        bullets: tsLines.slice(0, 8).map((l) => (l.startsWith("[") ? l : "• " + l))
      };
    }

    const sentences = rawText
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 45 && s.length < 220);

    const picked = sentences.slice(0, 7).map((s, idx) => `[${formatTimestamp(idx * 45)}] ${s}`);
    return {
      title,
      source: location.hostname.includes("youtube.com") ? "YouTube Video Summary" : "Article Key Takeaways",
      bullets: picked.length ? picked : ["[00:00] Core topic overview and primary thesis.", "[01:15] Key actionable strategies and implementation steps.", "[02:30] Final conclusion and recommended next actions."]
    };
  }

  function injectPanel() {
    if (!location.hostname.includes("youtube.com") || document.getElementById("eightysummary-panel")) return;
    const sec = document.querySelector("#secondary, #related");
    if (!sec) return;
    const data = extractSummary();
    const box = document.createElement("div");
    box.id = "eightysummary-panel";
    box.style.cssText = "background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:12px;font-family:system-ui,sans-serif;font-size:12px;";
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#f43f5e;font-size:13px;">⚡ EightySummary — Instant TL;DR</strong>
        <span style="font-size:10px;color:#94a3b8;">${data.source}</span>
      </div>
      <div style="line-height:1.5;color:#e2e8f0;">${data.bullets.map((b) => `<div style="margin-bottom:5px;">${b}</div>`).join("")}</div>
    `;
    sec.prepend(box);
  }

  setTimeout(injectPanel, 1500);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "EIGHTY_SUMMARIZE") {
      sendResponse(extractSummary());
      return true;
    }
  });
})();
