/**
 * GrammFix Pro — Real-Time In-Page Grammar, Style, Passive Voice & Tone Assistant
 * Replaces Grammarly Pro, Wordtune & QuillBot on <textarea>, <input>, and contenteditable
 */

(() => {
  "use strict";

  let badge = null;
  let activeEl = null;

  const WORDY_MAP = {
    "in order to": "to",
    "due to the fact that": "because",
    "at this point in time": "now",
    "for the purpose of": "for",
    "in the event that": "if",
    "has the ability to": "can",
    "make a decision": "decide",
    "in the near future": "soon",
    "a large number of": "many",
    "with regard to": "regarding",
    "take into consideration": "consider",
    "on a daily basis": "daily"
  };

  const PASSIVE_TO_ACTIVE_HINTS = {
    "was written by": "wrote",
    "was created by": "created",
    "was built by": "built",
    "is managed by": "manages",
    "was approved by": "approved"
  };

  function analyzeLocalStyle(text) {
    const issues = [];
    const passiveRegex = /\b(am|are|is|was|were|be|been|being)\s+(\w+ed|written|taken|made|done|given|shown|known|seen|built|sent|paid)\b/gi;
    let m;
    while ((m = passiveRegex.exec(text)) !== null) {
      issues.push({
        message: `Passive voice detected ("${m[0]}"). Consider active voice for stronger clarity.`,
        orig: m[0],
        replacement: null,
        type: "passive"
      });
    }

    for (const [phrase, rep] of Object.entries(PASSIVE_TO_ACTIVE_HINTS)) {
      if (text.toLowerCase().includes(phrase)) {
        issues.push({
          message: `Passive construction "${phrase}"`,
          orig: phrase,
          replacement: rep,
          type: "passive-fix"
        });
      }
    }

    for (const [phrase, rep] of Object.entries(WORDY_MAP)) {
      if (text.toLowerCase().includes(phrase)) {
        issues.push({
          message: `Wordy phrase "${phrase}". Replace with "${rep}".`,
          orig: phrase,
          replacement: rep,
          type: "conciseness"
        });
      }
    }
    return issues;
  }

  function ensureBadge() {
    if (badge && document.body.contains(badge)) return badge;
    badge = document.createElement("div");
    badge.id = "grammfix-floating-badge";
    badge.className = "grammfix-floating-badge";
    badge.innerHTML = '<span class="gf-dot"></span><span class="gf-count">GrammFix Ready</span>';
    badge.style.display = "none";
    document.body.appendChild(badge);
    return badge;
  }

  function positionBadge(el) {
    if (!el) return;
    const b = ensureBadge();
    const rect = el.getBoundingClientRect();
    if (rect.width > 80 && rect.height > 20) {
      b.style.display = "flex";
      b.style.top = `${Math.max(4, window.scrollY + rect.bottom - 30)}px`;
      b.style.left = `${Math.max(4, window.scrollX + rect.right - 150)}px`;
    }
  }

  function isEditableField(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const t = (el.type || "text").toLowerCase();
      return ["text", "search", "email", "url"].includes(t);
    }
    return Boolean(el.isContentEditable || el.getAttribute?.("contenteditable") === "true");
  }

  function getText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    return el.innerText || el.textContent || "";
  }

  function setText(el, val) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = val;
    } else {
      el.innerText = val;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function updateCheck(el) {
    if (!el) return;
    positionBadge(el);
    const text = getText(el).trim();
    const b = ensureBadge();
    if (text.length < 3) {
      b.innerHTML = '<span class="gf-dot ok"></span><span class="gf-count">GrammFix: 0 issues</span>';
      return;
    }

    const localIssues = analyzeLocalStyle(text);
    chrome.runtime.sendMessage({ type: "GRAMMFIX_CHECK", text }, (res) => {
      const apiMatches = !chrome.runtime.lastError && res && res.ok && Array.isArray(res.matches) ? res.matches : [];
      const total = localIssues.length + apiMatches.length;
      const words = text.split(/\s+/).filter(Boolean).length;

      if (total === 0) {
        b.innerHTML = `<span class="gf-dot ok"></span><span class="gf-count">${words}w • Perfect ✨</span>`;
        b.onclick = null;
      } else {
        b.innerHTML = `<span class="gf-dot warn"></span><span class="gf-count">${total} Fix${total > 1 ? "es" : ""} (Click)</span>`;
        b.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          let updated = getText(el);
          const sorted = [...apiMatches].sort((a, b) => b.offset - a.offset);
          sorted.forEach((m) => {
            if (m.replacements && m.replacements.length > 0) {
              const rep = m.replacements[0].value;
              updated = updated.slice(0, m.offset) + rep + updated.slice(m.offset + m.length);
            }
          });
          localIssues.forEach((iss) => {
            if (iss.orig && iss.replacement) {
              updated = updated.replace(new RegExp(iss.orig, "gi"), iss.replacement);
            }
          });
          setText(el, updated);
          b.innerHTML = `<span class="gf-dot ok"></span><span class="gf-count">All Fixed! ✨</span>`;
        };
      }
    });
  }

  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (!isEditableField(el)) return;
    activeEl = el;
    updateCheck(el);
  });

  document.addEventListener("click", (e) => {
    const el = e.target;
    if (isEditableField(el)) {
      activeEl = el;
      updateCheck(el);
    }
  });

  let timer = null;
  document.addEventListener("input", (e) => {
    if (isEditableField(e.target)) {
      activeEl = e.target;
      clearTimeout(timer);
      timer = setTimeout(() => updateCheck(activeEl), 250);
    }
  });

  // Automatically attach to the first visible editable field on load if focused or present
  const firstEditable = document.querySelector("textarea, input[type='text'], [contenteditable='true']");
  if (firstEditable) {
    activeEl = firstEditable;
    updateCheck(firstEditable);
  }
})();
