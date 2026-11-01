(function () {
  if (window.__blazeSnippetLoaded) return;
  window.__blazeSnippetLoaded = true;

  const DEFAULT_TEMPLATES = [
    {
      cmd: "/support",
      category: "Customer Support",
      body: "Hi {form:Customer=Valued Customer}, thank you for contacting support! Your ticket is scheduled for resolution by {+2d}. Let us know if you need urgent priority."
    },
    {
      cmd: "/sales",
      category: "Sales Outreach",
      body: "Hi {form:Prospect=Team}, great speaking today ({today})! I have sent the proposal and will follow up with you on {next monday}."
    },
    {
      cmd: "/bug",
      category: "Engineering",
      body: "### Bug Triage Report ({today})\n- **Environment**: Production\n- **Target SLA Fix Date**: {+3d}\n- **Status**: Investigating root cause."
    },
    {
      cmd: "/standup",
      category: "Engineering",
      body: "**Daily Standup ({today})**\n- Yesterday: Completed core sprint tasks\n- Today: Shipping verification tests\n- Next Milestone: {+7d}"
    },
    {
      cmd: "/rx",
      category: "Medical / Technical",
      body: "Clinical Follow-Up Note ({today}): Patient advised to continue current regimen and return for follow-up evaluation on {+14d}."
    },
    {
      cmd: "/invoice",
      category: "Operations",
      body: "Friendly reminder: Invoice generated on {today} is due on {+14d}. Thank you for your prompt partnership!"
    }
  ];

  let templates = DEFAULT_TEMPLATES.slice();
  let lastFocusedEl = null;

  function loadTemplates() {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(["blazesnippet_templates"], (res) => {
      if (Array.isArray(res.blazesnippet_templates) && res.blazesnippet_templates.length > 0) {
        templates = res.blazesnippet_templates;
      }
    });
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.blazesnippet_templates && Array.isArray(changes.blazesnippet_templates.newValue)) {
        templates = changes.blazesnippet_templates.newValue;
      }
    });
  }

  function formatDateISO(d) {
    return d.toISOString().slice(0, 10);
  }

  function evaluateBlazeMath(body, customValues = {}) {
    const now = new Date();
    let out = String(body || "");

    out = out.replace(/\{today\}/gi, formatDateISO(now));

    // Date offset math like {+3d}, {-2d}, {+2w}
    out = out.replace(/\{([+-]\d+)([dw])\}/gi, (_, numStr, unit) => {
      const offset = parseInt(numStr, 10) || 0;
      const d = new Date(now.getTime());
      const days = unit.toLowerCase() === "w" ? offset * 7 : offset;
      d.setDate(d.getDate() + days);
      return formatDateISO(d);
    });

    // {next monday}, {next friday}, etc.
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    out = out.replace(/\{next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\}/gi, (_, dayStr) => {
      const targetDay = dayNames.indexOf(dayStr.toLowerCase());
      const d = new Date(now.getTime());
      const currentDay = d.getDay();
      const diff = ((targetDay + 7 - currentDay) % 7) || 7;
      d.setDate(d.getDate() + diff);
      return formatDateISO(d);
    });

    // Dynamic form placeholders: {form:Name=DefaultValue}
    out = out.replace(/\{form:([^}=]+)(?:=([^}]*))?\}/gi, (_, fieldName, defVal) => {
      const key = fieldName.trim();
      if (customValues && customValues[key]) return customValues[key];
      return defVal !== undefined ? defVal : key;
    });

    return out;
  }

  function ensurePalette() {
    let pal = document.getElementById("blazesnippet-palette");
    if (!pal) {
      pal = document.createElement("div");
      pal.id = "blazesnippet-palette";
      pal.innerHTML = `
        <div class="bs-head">
          <span>🔥 BlazeSnippet Command Bar (Alt+B)</span>
          <button id="bs-close-btn" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;">✕</button>
        </div>
        <input class="bs-search" id="bs-search-input" placeholder="Search /cmd or category (e.g. /support, /bug, /sales)..." />
        <div class="bs-list" id="bs-list-container"></div>
      `;
      document.body.appendChild(pal);

      pal.querySelector("#bs-close-btn").addEventListener("click", () => {
        pal.style.display = "none";
      });

      pal.querySelector("#bs-search-input").addEventListener("input", (e) => {
        renderPaletteList(e.target.value);
      });
    }
    return pal;
  }

  function insertTextIntoActive(text) {
    const el = lastFocusedEl || document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      el.value = (el.value ? el.value + " " : "") + text;
    } else if (el && el.isContentEditable) {
      el.innerText = (el.innerText ? el.innerText + " " : "") + text;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  function renderPaletteList(filterText = "") {
    const pal = ensurePalette();
    const container = pal.querySelector("#bs-list-container");
    const q = filterText.trim().toLowerCase();
    const filtered = templates.filter(
      (t) => !q || t.cmd.toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
    );

    container.innerHTML = filtered
      .map(
        (t, idx) => `
        <div class="bs-item" data-idx="${idx}">
          <div>
            <span class="bs-cmd">${t.cmd}</span>
            <span class="bs-cat">${t.category || "General"}</span>
          </div>
          <div class="bs-preview">${evaluateBlazeMath(t.body).slice(0, 110)}</div>
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".bs-item").forEach((itemEl) => {
      itemEl.addEventListener("click", () => {
        const idx = parseInt(itemEl.getAttribute("data-idx") || "0", 10);
        const tpl = filtered[idx];
        if (tpl) {
          const evaluated = evaluateBlazeMath(tpl.body);
          insertTextIntoActive(evaluated);
          pal.style.display = "none";
        }
      });
    });
  }

  document.addEventListener("focusin", (e) => {
    const pal = document.getElementById("blazesnippet-palette");
    if (pal && pal.contains(e.target)) return;
    lastFocusedEl = e.target;
  });

  document.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!el) return;
      const val = el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el.value : el.isContentEditable ? el.innerText : "";
      if (!val || !val.includes("/")) return;

      for (const tpl of templates) {
        if (val.includes(tpl.cmd)) {
          const evaluated = evaluateBlazeMath(tpl.body);
          const nextVal = val.split(tpl.cmd).join(evaluated);
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            el.value = nextVal;
          } else if (el.isContentEditable) {
            el.innerText = nextVal;
          }
          break;
        }
      }
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      const pal = ensurePalette();
      const isHidden = pal.style.display !== "block";
      pal.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        renderPaletteList("");
        const inp = pal.querySelector("#bs-search-input");
        if (inp) inp.focus();
      }
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "BLAZE_OPEN_PALETTE") {
      const pal = ensurePalette();
      pal.style.display = "block";
      renderPaletteList("");
      sendResponse({ ok: true, count: templates.length });
      return true;
    }
    if (msg && msg.type === "BLAZE_EVAL_TEMPLATE") {
      const tpl = templates.find((t) => t.cmd === msg.cmd) || { body: msg.body || "Target: {+3d}" };
      const evaluated = evaluateBlazeMath(tpl.body, msg.values || {});
      sendResponse({ ok: true, evaluated });
      return true;
    }
  });

  loadTemplates();
})();
