/**
 * WordRewrite — Content Script
 * Injects an in-page floating WordRewrite Bar above active inputs/selections
 * Offers 1-click sentence rewrites (Casual, Formal, Shorten, Expand, Punchy)
 */

(() => {
  "use strict";

  let bar = null;
  let activeEl = null;

  function isEditable(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const t = (el.type || "text").toLowerCase();
      return ["text", "search", "email", "url"].includes(t);
    }
    return Boolean(el.isContentEditable || el.getAttribute?.("contenteditable") === "true");
  }

  function getTargetText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      return el.value || "";
    }
    return el.innerText || el.textContent || "";
  }

  function setTargetText(el, val) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = val;
    } else {
      el.innerText = val;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function ensureBar() {
    if (bar && document.body.contains(bar)) return bar;
    bar = document.createElement("div");
    bar.id = "wordrewrite-floating-bar";
    bar.className = "wordrewrite-bar";
    bar.style.display = "none";
    bar.innerHTML = `
      <span class="wr-brand">✨ WordRewrite</span>
      <button type="button" class="wr-chip" data-variant="casual">😊 Casual</button>
      <button type="button" class="wr-chip" data-variant="formal">👔 Formal</button>
      <button type="button" class="wr-chip" data-variant="shorten">✂️ Shorten</button>
      <button type="button" class="wr-chip" data-variant="expand">🔍 Expand</button>
      <button type="button" class="wr-chip" data-variant="punchy">🔥 Punchy</button>
    `;
    document.body.appendChild(bar);

    bar.querySelectorAll(".wr-chip").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = btn.getAttribute("data-variant") || "casual";
        const target = activeEl || document.querySelector("textarea, input[type='text'], [contenteditable='true']");
        const rawText = target ? getTargetText(target) : String(window.getSelection?.() || "").trim();
        if (!rawText || rawText.trim().length < 2) return;

        chrome.runtime.sendMessage({ type: "WORDREWRITE_GENERATE", text: rawText }, (res) => {
          if (!chrome.runtime.lastError && res && res.ok && Array.isArray(res.variants)) {
            const match = res.variants.find((v) => v.id === variantId) || res.variants[0];
            if (match && match.text) {
              if (target) {
                setTargetText(target, match.text);
              } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(match.text).catch(() => {});
              }
              const origLabel = btn.textContent;
              btn.textContent = "✓ Applied";
              setTimeout(() => {
                btn.textContent = origLabel;
              }, 1200);
            }
          }
        });
      });
    });

    return bar;
  }

  function positionBar(el) {
    if (!el || !document.body) return;
    const b = ensureBar();
    const rect = el.getBoundingClientRect();
    if (rect.width < 60 || rect.height < 18) return;
    b.style.display = "flex";
    b.style.top = `${Math.max(6, window.scrollY + rect.bottom + 4)}px`;
    b.style.left = `${Math.max(6, window.scrollX + rect.left)}px`;
  }

  document.addEventListener("focusin", (e) => {
    if (isEditable(e.target)) {
      activeEl = e.target;
      positionBar(activeEl);
    }
  });

  document.addEventListener("click", (e) => {
    if (isEditable(e.target)) {
      activeEl = e.target;
      positionBar(activeEl);
    }
  });

  const firstEditable = document.querySelector("textarea, input[type='text'], [contenteditable='true']");
  if (firstEditable) {
    activeEl = firstEditable;
    positionBar(firstEditable);
  } else if (document.body) {
    ensureBar();
  }
})();
