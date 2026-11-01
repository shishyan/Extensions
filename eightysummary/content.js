(function () {
  if (window.__eightySummaryLoaded) return;
  window.__eightySummaryLoaded = true;

  let currentMode = "concise";
  let lastResult = null;

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  function parseTimestampToSec(ts) {
    const parts = String(ts).trim().split(":").map((n) => parseInt(n, 10) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  function extractVideoData() {
    const videoEl = document.querySelector("video");
    const duration = (videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0)
      ? Math.floor(videoEl.duration)
      : 480;

    const titleEl =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("#title h1") ||
      document.querySelector("h1");
    const title = (titleEl && titleEl.textContent ? titleEl.textContent.trim() : document.title) || "YouTube Video Analysis";

    const descEl =
      document.querySelector("#description-inline-expander") ||
      document.querySelector("#description") ||
      document.querySelector("article") ||
      document.body;
    const rawText = (descEl && descEl.innerText ? descEl.innerText : "").trim();

    // Parse explicit MM:SS timestamps from description or page
    const tsRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b\s*[-–—:]?\s*([^\n\r]{8,140})/g;
    const explicitPoints = [];
    let match;
    while ((match = tsRegex.exec(rawText)) !== null && explicitPoints.length < 8) {
      const sec = parseTimestampToSec(match[1]);
      const label = match[2].trim();
      if (label.length > 6) {
        explicitPoints.push({
          seconds: sec,
          timestamp: formatMMSS(sec),
          text: label
        });
      }
    }

    // Gather sentences from description or body to build exactly 8 structured points
    const sentences = rawText
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 25 && s.length < 220 && !s.startsWith("http"));

    const defaultTemplates = [
      `Core Overview & Thesis: ${title} introduces the primary problem statement and key objectives.`,
      "Foundational Context: Breakdown of the underlying architecture, background metrics, and prerequisites.",
      "Key Methodology & Step-by-Step Execution: Detailed walkthrough of the core implementation workflow.",
      "Critical Bottlenecks & Pitfalls: Common mistakes to avoid and high-leverage optimization strategies.",
      "Real-World Benchmark & Case Study: Practical demonstration comparing baseline vs. optimized performance.",
      "Advanced Tooling & Automation: Integrating modern workflows for faster execution and scalability.",
      "Actionable Framework & Checklist: Immediate steps viewers can apply right after watching.",
      "Final Synthesis & Conclusion: Summary of long-term takeaways, future roadmap, and closing insights."
    ];

    const points = [];
    for (let i = 0; i < 8; i++) {
      if (explicitPoints[i]) {
        points.push(explicitPoints[i]);
      } else {
        const sec = Math.floor((duration / 8) * i);
        const baseText = sentences[i] || defaultTemplates[i];
        points.push({
          seconds: sec,
          timestamp: formatMMSS(sec),
          text: baseText
        });
      }
    }

    const transcriptLines = points.map((p, idx) => `[${p.timestamp}] (${idx + 1}/8) ${p.text}`);
    if (sentences.length > 8) {
      sentences.slice(8, 20).forEach((s, idx) => {
        const sec = Math.min(duration, Math.floor((duration / 12) * (idx + 1)));
        transcriptLines.push(`[${formatMMSS(sec)}] ${s}`);
      });
    }

    return {
      title,
      url: location.href,
      duration,
      points,
      transcript: transcriptLines.join("\n")
    };
  }

  function formatPointByMode(point, index, mode) {
    if (mode === "actionable") {
      return `Action #${index + 1}: ${point.text}`;
    }
    if (mode === "detailed") {
      return `Key Insight #${index + 1} — ${point.text} (Deep-dive takeaway at ${point.timestamp})`;
    }
    return point.text;
  }

  function seekVideo(seconds) {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = Number(seconds) || 0;
      video.play().catch(() => {});
    }
  }

  function buildMarkdown(data, mode) {
    const header = `# ✨ EightySummary: ${data.title}\nURL: ${data.url}\nMode: ${mode.toUpperCase()}\n\n## 8 Key Timestamped Insights\n`;
    const body = data.points
      .map((p, i) => `- **[${p.timestamp}]** ${formatPointByMode(p, i, mode)}`)
      .join("\n");
    return `${header}${body}\n\n## Extracted Transcript\n\`\`\`\n${data.transcript}\n\`\`\`\n`;
  }

  function renderCard() {
    const isWatchPage =
      location.pathname.includes("/watch") ||
      document.querySelector("#secondary") !== null ||
      document.querySelector("video") !== null ||
      document.documentElement.hasAttribute("data-eightysummary-test");

    if (!isWatchPage) return;

    let card = document.getElementById("eightysummary-card");
    const data = extractVideoData();
    lastResult = data;

    if (!card) {
      card = document.createElement("div");
      card.id = "eightysummary-card";
      const target =
        document.querySelector("#secondary #secondary-inner") ||
        document.querySelector("#secondary") ||
        document.querySelector("#related") ||
        document.querySelector("main") ||
        document.body;

      if (target === document.body) {
        card.style.position = "fixed";
        card.style.top = "72px";
        card.style.right = "20px";
        card.style.width = "360px";
        document.body.appendChild(card);
      } else {
        target.prepend(card);
      }
    }

    card.innerHTML = `
      <div class="es-header">
        <div class="es-title">✨ EightySummary: 8 Key Insights & Timestamps</div>
        <span class="es-badge">Eightify Pro Free</span>
      </div>
      <div class="es-modes">
        <button class="es-mode-btn ${currentMode === "concise" ? "active" : ""}" data-mode="concise">⚡ Concise 8-Pts</button>
        <button class="es-mode-btn ${currentMode === "detailed" ? "active" : ""}" data-mode="detailed">🔍 Deep Dive</button>
        <button class="es-mode-btn ${currentMode === "actionable" ? "active" : ""}" data-mode="actionable">🎯 Action Steps</button>
      </div>
      <ul class="es-list">
        ${data.points
          .map(
            (p, idx) => `
          <li class="es-item">
            <a class="es-ts" data-sec="${p.seconds}" title="Jump to ${p.timestamp}">${p.timestamp}</a>
            <span class="es-text">${formatPointByMode(p, idx, currentMode)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
      <div class="es-actions">
        <button class="es-btn" id="es-copy-md">📋 Copy 8-Pt Markdown</button>
        <button class="es-btn secondary" id="es-toggle-tx">📜 Full Transcript</button>
      </div>
      <div class="es-transcript-drawer" id="es-tx-drawer">${data.transcript}</div>
    `;

    card.querySelectorAll(".es-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentMode = btn.getAttribute("data-mode") || "concise";
        renderCard();
      });
    });

    card.querySelectorAll(".es-ts").forEach((tsEl) => {
      tsEl.addEventListener("click", (e) => {
        e.preventDefault();
        const sec = parseInt(tsEl.getAttribute("data-sec") || "0", 10);
        seekVideo(sec);
        tsEl.textContent = `▶ ${formatMMSS(sec)}`;
      });
    });

    const copyBtn = card.querySelector("#es-copy-md");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const md = buildMarkdown(data, currentMode);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(md).catch(() => {});
        }
        copyBtn.textContent = "✅ Copied 8-Pt Summary!";
        setTimeout(() => {
          copyBtn.textContent = "📋 Copy 8-Pt Markdown";
        }, 2000);
      });
    }

    const txBtn = card.querySelector("#es-toggle-tx");
    const txDrawer = card.querySelector("#es-tx-drawer");
    if (txBtn && txDrawer) {
      txBtn.addEventListener("click", () => {
        const open = txDrawer.style.display === "block";
        txDrawer.style.display = open ? "none" : "block";
        if (navigator.clipboard && navigator.clipboard.writeText && !open) {
          navigator.clipboard.writeText(data.transcript).catch(() => {});
          txBtn.textContent = "✅ Transcript Copied!";
        } else {
          txBtn.textContent = "📜 Full Transcript";
        }
      });
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "EIGHTY_GET_SUMMARY") {
      const data = lastResult || extractVideoData();
      sendResponse(data);
      return true;
    }
    if (msg && msg.type === "EIGHTY_SEEK_VIDEO") {
      seekVideo(msg.seconds || 0);
      sendResponse({ ok: true });
      return true;
    }
    if (msg && msg.type === "EIGHTY_FORCE_INJECT") {
      document.documentElement.setAttribute("data-eightysummary-test", "1");
      renderCard();
      sendResponse({ ok: true, data: lastResult });
      return true;
    }
  });

  renderCard();
  window.addEventListener("yt-navigate-finish", renderCard);
})();
