/**
 * MoniAssistant — Content Script
 * Universal Right-Edge Slide-Out AI & Research Sidebar (Alt+M or floating trigger)
 * 4 Tabs: Page Summary & Key Q&A, Selection Explainer/Translator, Email & Comment Reply Drafter, Prompt Library
 */

(() => {
  "use strict";

  function inspectPageData() {
    const title = document.title || "Untitled Page";
    const paras = Array.from(document.querySelectorAll("article p, main p, p, li"))
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter((t) => t.length > 40);

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => (h.innerText || h.textContent || "").trim())
      .filter((t) => t.length > 2)
      .slice(0, 8);

    const bodyText = (document.body && (document.body.innerText || document.body.textContent)) || "";
    const words = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;

    return {
      title,
      url: location.href,
      words,
      readMin: Math.max(1, Math.ceil(words / 220)),
      headings,
      summaryBullets: paras.slice(0, 5).length
        ? paras.slice(0, 5)
        : [`Overview of ${title}`, ...(headings.length ? headings : ["Key page insights extracted cleanly."])]
    };
  }

  function answerPageQuestion(query) {
    const q = (query || "").trim().toLowerCase();
    const paras = Array.from(document.querySelectorAll("p, li, h1, h2, h3"))
      .map((el) => (el.innerText || el.textContent || "").trim())
      .filter((t) => t.length > 20);
    if (!q) return "Enter a keyword or question to search this page's content.";

    const terms = q.split(/\s+/).filter((w) => w.length > 2);
    const ranked = paras
      .map((p) => {
        let hits = 0;
        terms.forEach((t) => {
          if (p.toLowerCase().includes(t)) hits++;
        });
        return { p, hits };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    if (ranked.length === 0) {
      return `No exact paragraph matched "${query}". Page has ${paras.length} indexed blocks across "${document.title}".`;
    }
    return ranked
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.p.slice(0, 220)}`)
      .join("\n\n");
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MONI_PAGE_DATA") {
      sendResponse({ ok: true, ...inspectPageData() });
      return false;
    }
    if (msg && msg.type === "MONI_ASK_PAGE") {
      sendResponse({ ok: true, answer: answerPageQuestion(msg.query || "") });
      return false;
    }
    if (msg && msg.type === "MONI_TOGGLE_SIDEBAR") {
      toggleSidebar();
      sendResponse({ ok: true });
      return false;
    }
  });

  if (!document.body) return;

  let trigger = document.getElementById("moniassistant-trigger");
  if (!trigger) {
    trigger = document.createElement("div");
    trigger.id = "moniassistant-trigger";
    trigger.className = "moniassistant-trigger";
    trigger.title = "Open MoniAssistant AI Sidebar (Alt+M)";
    trigger.innerHTML = "🤖 Moni AI";
    document.body.appendChild(trigger);
  }

  let sidebar = null;

  function buildSidebar() {
    if (sidebar && document.body.contains(sidebar)) return sidebar;
    const data = inspectPageData();
    sidebar = document.createElement("div");
    sidebar.id = "moniassistant-sidebar";
    sidebar.className = "moniassistant-sidebar";
    sidebar.style.display = "none";

    sidebar.innerHTML = `
      <div class="ma-hdr">
        <span>🤖 MoniAssistant Copilot</span>
        <span id="ma-close" style="cursor:pointer;color:#94a3b8;padding:0 4px;">✕</span>
      </div>
      <div class="ma-tabs">
        <button class="ma-tab active" data-tab="summary">📄 Page Q&A</button>
        <button class="ma-tab" data-tab="explain">🌐 Translate</button>
        <button class="ma-tab" data-tab="reply">✉️ Reply</button>
        <button class="ma-tab" data-tab="prompts">📚 Prompts</button>
      </div>
      <div id="ma-pane-summary" class="ma-pane" style="overflow-y:auto;flex:1;font-size:11.5px;line-height:1.45;">
        <div style="color:#94a3b8;margin-bottom:6px;">📖 <strong>${data.words.toLocaleString()}</strong> words • ~${data.readMin}m read</div>
        <input id="ma-qa-input" type="text" placeholder="Ask anything about this page..." />
        <button id="ma-qa-btn" class="ma-btn" style="width:100%;margin-bottom:8px;">🔍 Ask Page Copilot</button>
        <div id="ma-qa-result" style="background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;white-space:pre-wrap;">${data.summaryBullets.map((b) => "• " + b.slice(0, 180)).join("\n\n")}</div>
      </div>
      <div id="ma-pane-explain" class="ma-pane" style="display:none;overflow-y:auto;flex:1;font-size:11.5px;">
        <textarea id="ma-sel-text" rows="4" placeholder="Highlight text on page or paste here...">Artificial intelligence copilots streamline deep document synthesis and cross-language communication.</textarea>
        <select id="ma-lang">
          <option value="es">Spanish (ES)</option>
          <option value="fr">French (FR)</option>
          <option value="de">German (DE)</option>
          <option value="hi">Hindi (HI)</option>
          <option value="ja">Japanese (JA)</option>
        </select>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <button id="ma-explain-btn" class="ma-btn" style="flex:1;">💡 Explain</button>
          <button id="ma-trans-btn" class="ma-btn" style="flex:1;background:#6366f1;">🌐 Translate</button>
        </div>
        <div id="ma-explain-out" style="background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;white-space:pre-wrap;"></div>
      </div>
      <div id="ma-pane-reply" class="ma-pane" style="display:none;overflow-y:auto;flex:1;font-size:11.5px;">
        <textarea id="ma-reply-ctx" rows="3" placeholder="Paste email or comment to reply to...">Can we review the Q4 launch milestones and confirm engineering sign-off by Thursday?</textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
          <button class="ma-btn ma-tone-btn" data-tone="positive">✅ Positive</button>
          <button class="ma-btn ma-tone-btn" data-tone="analytical" style="background:#4f46e5;">📊 Analytical</button>
          <button class="ma-btn ma-tone-btn" data-tone="decline" style="background:#475569;">🙏 Polite Decline</button>
          <button class="ma-btn ma-tone-btn" data-tone="action" style="background:#059669;">⚡ Action Plan</button>
        </div>
        <textarea id="ma-reply-out" rows="6" readonly placeholder="Generated reply will appear here..."></textarea>
      </div>
      <div id="ma-pane-prompts" class="ma-pane" style="display:none;overflow-y:auto;flex:1;font-size:11.5px;">
        <div style="background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;margin-bottom:6px;">
          <strong style="color:#60a5fa;">1. Executive 5-Bullet Brief</strong><br>
          Summarize this article into 5 executive takeaways with metrics and risks.
        </div>
        <div style="background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;margin-bottom:6px;">
          <strong style="color:#60a5fa;">2. Counter-Argument Finder</strong><br>
          Identify unstated assumptions, edge cases, and empirical counter-evidence.
        </div>
        <div style="background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;">
          <strong style="color:#60a5fa;">3. Cold Outreach Personalizer</strong><br>
          Draft a concise 3-sentence value hook tailored to this company's page.
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);

    sidebar.querySelector("#ma-close").addEventListener("click", () => {
      sidebar.style.display = "none";
    });

    const tabs = sidebar.querySelectorAll(".ma-tab");
    const panes = {
      summary: sidebar.querySelector("#ma-pane-summary"),
      explain: sidebar.querySelector("#ma-pane-explain"),
      reply: sidebar.querySelector("#ma-pane-reply"),
      prompts: sidebar.querySelector("#ma-pane-prompts")
    };

    tabs.forEach((t) => {
      t.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        t.classList.add("active");
        const target = t.getAttribute("data-tab");
        Object.keys(panes).forEach((k) => {
          panes[k].style.display = k === target ? "block" : "none";
        });
      });
    });

    sidebar.querySelector("#ma-qa-btn").addEventListener("click", () => {
      const q = sidebar.querySelector("#ma-qa-input").value;
      sidebar.querySelector("#ma-qa-result").textContent = answerPageQuestion(q);
    });

    sidebar.querySelector("#ma-explain-btn").addEventListener("click", () => {
      const text = sidebar.querySelector("#ma-sel-text").value;
      chrome.runtime.sendMessage({ type: "MONI_EXPLAIN", text }, (res) => {
        if (!chrome.runtime.lastError && res && res.ok) {
          sidebar.querySelector("#ma-explain-out").textContent = res.explanation;
        }
      });
    });

    sidebar.querySelector("#ma-trans-btn").addEventListener("click", () => {
      const text = sidebar.querySelector("#ma-sel-text").value;
      const targetLang = sidebar.querySelector("#ma-lang").value;
      chrome.runtime.sendMessage({ type: "MONI_TRANSLATE", text, targetLang }, (res) => {
        if (!chrome.runtime.lastError && res && res.ok) {
          sidebar.querySelector("#ma-explain-out").textContent = res.translated;
        }
      });
    });

    sidebar.querySelectorAll(".ma-tone-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tone = btn.getAttribute("data-tone");
        const context = sidebar.querySelector("#ma-reply-ctx").value;
        chrome.runtime.sendMessage({ type: "MONI_DRAFT_REPLY", tone, context }, (res) => {
          if (!chrome.runtime.lastError && res && res.ok) {
            sidebar.querySelector("#ma-reply-out").value = res.reply;
          }
        });
      });
    });

    return sidebar;
  }

  function toggleSidebar() {
    const sb = buildSidebar();
    sb.style.display = sb.style.display === "none" ? "flex" : "none";
  }

  trigger.addEventListener("click", toggleSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      toggleSidebar();
    }
  });
})();
