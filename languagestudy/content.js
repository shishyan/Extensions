/**
 * LanguageStudy — Content Script
 * Injects a Dual Bilingual Subtitle & Word-Click Vocabulary Overlay Bar
 * Clicking any word in the subtitle bar or double-clicking any word on the page
 * shows instant translation + Part-of-Speech + 1-click "+ Save to Flashcards"
 */

(() => {
  "use strict";

  if (!document.body) return;

  let tooltip = null;
  let lastLookedUp = { word: "Enterprise", translation: "empresa / corporación (ES)", pos: "Noun", context: document.title || "" };

  function ensureTooltip() {
    if (tooltip && document.body.contains(tooltip)) return tooltip;
    tooltip = document.createElement("div");
    tooltip.id = "languagestudy-tooltip";
    tooltip.className = "languagestudy-tooltip";
    tooltip.style.display = "none";
    tooltip.innerHTML = `
      <div>
        <strong id="ls-tt-word" style="color:#fda4af;font-size:13px;">Word</strong>
        <span id="ls-tt-pos" style="background:#334155;color:#e2e8f0;font-size:10px;padding:1px 6px;border-radius:999px;margin-left:4px;">Noun</span>
        <div id="ls-tt-trans" style="color:#38bdf8;font-size:12px;margin-top:2px;">Translation</div>
      </div>
      <button id="ls-save-card-btn" type="button" style="background:#f43f5e;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;">+ Save Flashcard</button>
    `;
    document.body.appendChild(tooltip);

    const saveBtn = tooltip.querySelector("#ls-save-card-btn");
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage(
        {
          type: "LANG_SAVE_CARD",
          word: lastLookedUp.word,
          translation: lastLookedUp.translation,
          pos: lastLookedUp.pos,
          context: lastLookedUp.context
        },
        () => {
          saveBtn.textContent = "✓ Saved to Deck!";
          setTimeout(() => {
            saveBtn.textContent = "+ Save Flashcard";
          }, 1400);
        }
      );
    });

    return tooltip;
  }

  function lookupAndShow(word, contextSentence) {
    const clean = (word || "").trim().replace(/[^a-zA-ZÀ-ÿ'-]/g, "");
    if (!clean) return;
    const tt = ensureTooltip();
    tt.style.display = "flex";
    tt.querySelector("#ls-tt-word").textContent = clean;
    tt.querySelector("#ls-tt-trans").textContent = "Translating…";

    chrome.runtime.sendMessage({ type: "LANG_LOOKUP_WORD", word: clean, targetLang: "es" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        lastLookedUp = {
          word: res.word || clean,
          translation: res.translation,
          pos: res.pos || "Noun",
          context: contextSentence || document.title
        };
        tt.querySelector("#ls-tt-word").textContent = lastLookedUp.word;
        tt.querySelector("#ls-tt-pos").textContent = lastLookedUp.pos;
        tt.querySelector("#ls-tt-trans").textContent = lastLookedUp.translation;
      }
    });
  }

  // Extract first meaningful sentence from page or video caption to display in Dual Bilingual Bar
  const firstPara = document.querySelector("article p, main p, p, h1");
  const sampleSentence = ((firstPara && (firstPara.innerText || firstPara.textContent)) || document.title || "Enterprise AI benchmark improves productivity.")
    .trim()
    .split(/[.!?]+/)[0]
    .slice(0, 95);

  const words = sampleSentence.split(/\s+/).filter(Boolean);

  let bar = document.getElementById("languagestudy-bilingual-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "languagestudy-bilingual-bar";
    bar.className = "languagestudy-bar";
    const spansHtml = words
      .map((w) => `<span class="languagestudy-word" data-word="${w.replace(/"/g, "")}">${w}</span>`)
      .join(" ");

    bar.innerHTML = `
      <span style="color:#f43f5e;font-weight:800;">🌐 LanguageStudy</span>
      <div id="ls-sub-line" style="display:flex;flex-wrap:wrap;gap:2px;">${spansHtml}</div>
    `;
    document.body.appendChild(bar);

    bar.querySelectorAll(".languagestudy-word").forEach((sp) => {
      sp.addEventListener("click", (e) => {
        e.stopPropagation();
        lookupAndShow(sp.getAttribute("data-word") || sp.textContent, sampleSentence);
      });
    });
  }

  document.addEventListener("dblclick", () => {
    const sel = String(window.getSelection ? window.getSelection() : "").trim();
    if (sel && sel.length >= 2 && sel.length <= 32) {
      lookupAndShow(sel, sampleSentence);
    }
  });
})();
