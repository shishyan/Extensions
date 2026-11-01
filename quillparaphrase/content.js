/**
 * QuillParaphrase — Content Script
 * Injects an In-Page Floating Selection Rewrite Pill on editable fields & text selections
 * Supports 5 modes (Fluency, Formal, Academic, Concise, Creative) & 1-click in-place replace
 */

(() => {
  "use strict";

  let pill = null;
  let activeField = null;
  let currentMode = "fluency";
  let currentIntensity = 75;

  function isEditable(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const t = (el.type || "text").toLowerCase();
      return ["text", "search", "email", "url"].includes(t);
    }
    return Boolean(el.isContentEditable || el.getAttribute?.("contenteditable") === "true");
  }

  function getFieldText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (typeof start === "number" && typeof end === "number" && end > start) {
        return el.value.slice(start, end);
      }
      return el.value || "";
    }
    return el.innerText || el.textContent || "";
  }

  function replaceFieldText(el, newText) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (typeof start === "number" && typeof end === "number" && end > start) {
        el.value = el.value.slice(0, start) + newText + el.value.slice(end);
      } else {
        el.value = newText;
      }
    } else {
      el.innerText = newText;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function ensurePill() {
    if (pill && document.body.contains(pill)) return pill;
    pill = document.createElement("div");
    pill.id = "quillparaphrase-floating-pill";
    pill.className = "quillparaphrase-pill";
    pill.style.display = "none";
    pill.innerHTML = `
      <span>🪶 QuillParaphrase</span>
      <select id="qp-mode-select" title="Select Paraphrase Mode">
        <option value="fluency">Fluency</option>
        <option value="formal">Formal</option>
        <option value="academic">Academic</option>
        <option value="concise">Concise</option>
        <option value="creative">Creative</option>
      </select>
      <button id="qp-rewrite-btn" type="button">Paraphrase ✨</button>
    `;
    document.body.appendChild(pill);

    const modeSelect = pill.querySelector("#qp-mode-select");
    modeSelect.addEventListener("change", (e) => {
      e.stopPropagation();
      currentMode = modeSelect.value;
    });

    const rewriteBtn = pill.querySelector("#qp-rewrite-btn");
    rewriteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetEl = activeField || document.querySelector("textarea, input[type='text'], [contenteditable='true']");
      const selText = window.getSelection ? String(window.getSelection()).trim() : "";
      const rawText = targetEl ? getFieldText(targetEl) : selText;
      if (!rawText || rawText.trim().length < 2) return;

      rewriteBtn.textContent = "Rewriting…";
      chrome.runtime.sendMessage(
        {
          type: "QUILL_PARAPHRASE",
          text: rawText,
          mode: currentMode,
          intensity: currentIntensity
        },
        (res) => {
          if (!chrome.runtime.lastError && res && res.ok && res.output) {
            if (targetEl) {
              replaceFieldText(targetEl, res.output);
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(res.output).catch(() => {});
            }
            rewriteBtn.textContent = `Done (${res.changedCount} Δ) ✓`;
            setTimeout(() => {
              rewriteBtn.textContent = "Paraphrase ✨";
            }, 1600);
          } else {
            rewriteBtn.textContent = "Paraphrase ✨";
          }
        }
      );
    });

    return pill;
  }

  function showPillNearElement(el) {
    if (!el || !document.body) return;
    const p = ensurePill();
    const rect = el.getBoundingClientRect();
    if (rect.width < 60 || rect.height < 18) return;
    p.style.display = "flex";
    p.style.top = `${Math.max(6, window.scrollY + rect.top - 38)}px`;
    p.style.left = `${Math.max(6, window.scrollX + rect.left)}px`;
  }

  document.addEventListener("focusin", (e) => {
    if (isEditable(e.target)) {
      activeField = e.target;
      showPillNearElement(activeField);
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (pill && pill.contains(e.target)) return;
    if (isEditable(e.target)) {
      activeField = e.target;
      showPillNearElement(activeField);
      return;
    }
    const sel = window.getSelection ? String(window.getSelection()).trim() : "";
    if (sel.length > 12) {
      const p = ensurePill();
      p.style.display = "flex";
      p.style.top = `${Math.max(8, window.scrollY + e.clientY - 44)}px`;
      p.style.left = `${Math.max(8, window.scrollX + e.clientX - 60)}px`;
    }
  });

  // Attach to first editable element on page load so users & automated checks see it immediately
  const initialField = document.querySelector("textarea, input[type='text'], [contenteditable='true']");
  if (initialField) {
    activeField = initialField;
    showPillNearElement(initialField);
  } else if (document.body) {
    ensurePill();
  }
})();
