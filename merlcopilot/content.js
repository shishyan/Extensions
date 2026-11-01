/**
 * MerlCopilot — Free AI Sidebar, Page Summarizer & Research Assistant
 * Replaces Merlin AI, MaxAI.me & Monica: Floating ⚡ TL;DR button, Slide-out Drawer, Key Takeaways, Reading Time & Markdown Exporter
 */

(() => {
  "use strict";

  function extractSummary() {
    const rawParas = Array.from(document.querySelectorAll("article p, main p, p, li"))
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter((t) => t.length > 45);

    const uniqueParas = [];
    const seen = new Set();
    for (const p of rawParas) {
      const key = p.slice(0, 80).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueParas.push(p);
      }
    }

    const title = document.title || "Untitled Page";
    const titleWords = new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const scored = uniqueParas.map((p, idx) => {
      let score = idx === 0 ? 4 : idx < 3 ? 2 : 1;
      titleWords.forEach((w) => {
        if (p.toLowerCase().includes(w)) score += 2;
      });
      if (/\d+%?|\$\d+|key|important|conclusion|summary|result|proven|growth|strategy/i.test(p)) {
        score += 3;
      }
      return { p, score, idx };
    });

    scored.sort((a, b) => b.score - a.score);
    const topBullets = scored
      .slice(0, 6)
      .sort((a, b) => a.idx - b.idx)
      .map((x) => x.p);

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => (h.innerText || h.textContent || "").trim())
      .filter((t) => t.length > 3)
      .slice(0, 8);

    const bodyText = (document.body && (document.body.innerText || document.body.textContent)) || "";
    const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 220));

    return {
      title,
      url: location.href,
      wordCount,
      readMinutes,
      headings,
      bullets: topBullets.length
        ? topBullets
        : [
            `Page Title: ${title}`,
            ...(headings.length ? headings.map((h) => `Section: ${h}`) : ["Quick page overview extracted cleanly."])
          ]
    };
  }

  function toMarkdown(data) {
    const lines = [
      `# ⚡ TL;DR Summary: ${data.title}`,
      `- **URL:** ${data.url}`,
      `- **Reading Time:** ~${data.readMinutes} min (${data.wordCount.toLocaleString()} words)`,
      ``,
      `## Key Takeaways`,
      ...data.bullets.map((b) => `- ${b}`)
    ];
    if (data.headings && data.headings.length) {
      lines.push("", "## Page Structure", ...data.headings.map((h) => `- ${h}`));
    }
    return lines.join("\n");
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MERL_SUMMARIZE") {
      sendResponse(extractSummary());
    }
  });

  if (!document.body) return;

  // Floating quick-trigger pill on bottom-right
  let fab = document.getElementById("merlcopilot-fab");
  if (!fab) {
    fab = document.createElement("div");
    fab.id = "merlcopilot-fab";
    fab.className = "merlcopilot-fab";
    fab.title = "MerlCopilot: Click for Instant Page TL;DR & Research Drawer";
    fab.innerHTML = "⚡ TL;DR";
    document.body.appendChild(fab);
  }

  let drawer = null;
  fab.addEventListener("click", () => {
    if (drawer && document.body.contains(drawer)) {
      drawer.style.display = drawer.style.display === "none" ? "block" : "none";
      return;
    }
    const data = extractSummary();
    drawer = document.createElement("div");
    drawer.id = "merlcopilot-drawer";
    drawer.className = "merlcopilot-drawer";
    const bulletsHtml = data.bullets
      .map((b) => `<li>${b.slice(0, 240)}${b.length > 240 ? "…" : ""}</li>`)
      .join("");

    drawer.innerHTML = `
      <div class="mc-hdr">
        <strong>⚡ MerlCopilot AI Summary</strong>
        <span class="mc-close" style="cursor:pointer;font-weight:700;padding:0 4px;">✕</span>
      </div>
      <div class="mc-meta">📖 <strong>${data.wordCount.toLocaleString()}</strong> words • ⏱️ <strong>~${data.readMinutes} min</strong> read</div>
      <div style="font-size:11px;font-weight:700;color:#cbd5e1;margin-bottom:5px;">🔥 Key Takeaways:</div>
      <ul class="mc-list">${bulletsHtml}</ul>
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button id="mc-copy-md" style="flex:1;background:#6366f1;color:#fff;border:none;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">📋 Copy Markdown</button>
        <button id="mc-dl-md" style="flex:1;background:#334155;color:#fff;border:none;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">⬇️ Save .MD</button>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector(".mc-close").onclick = () => {
      drawer.style.display = "none";
    };

    const copyBtn = drawer.querySelector("#mc-copy-md");
    copyBtn.onclick = () => {
      const md = toMarkdown(data);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md).catch(() => {});
      }
      copyBtn.textContent = "✅ Copied!";
      setTimeout(() => (copyBtn.textContent = "📋 Copy Markdown"), 1800);
    };

    const dlBtn = drawer.querySelector("#mc-dl-md");
    dlBtn.onclick = () => {
      const md = toMarkdown(data);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(data.title || "summary").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-tldr.md`;
      a.click();
      URL.revokeObjectURL(url);
      dlBtn.textContent = "✅ Saved!";
    };
  });
})();
