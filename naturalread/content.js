(function () {
  if (window.__naturalreadLoaded) return;
  window.__naturalreadLoaded = true;

  let activeBlock = null;

  function clearHighlight() {
    if (activeBlock) {
      activeBlock.style.outline = "";
      activeBlock.style.backgroundColor = "";
      activeBlock = null;
    }
  }

  function readPageParagraphs(rate, pitch) {
    window.speechSynthesis.cancel();
    clearHighlight();
    const sel = window.getSelection().toString().trim();
    if (sel) {
      const u = new SpeechSynthesisUtterance(sel);
      u.rate = rate || 1.25;
      u.pitch = pitch || 1.0;
      window.speechSynthesis.speak(u);
      return sel.slice(0, 400);
    }

    const blocks = Array.from(document.querySelectorAll("article p, main p, p")).filter(
      (p) => p.innerText && p.innerText.trim().length > 40
    ).slice(0, 25);

    let idx = 0;
    function speakNext() {
      clearHighlight();
      if (idx >= blocks.length) return;
      const el = blocks[idx++];
      activeBlock = el;
      el.style.outline = "2px solid #38bdf8";
      el.style.backgroundColor = "rgba(56, 189, 248, 0.12)";
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const u = new SpeechSynthesisUtterance(el.innerText.trim());
      u.rate = rate || 1.25;
      u.pitch = pitch || 1.0;
      u.onend = speakNext;
      window.speechSynthesis.speak(u);
    }
    speakNext();
    return blocks[0] ? blocks[0].innerText.trim().slice(0, 400) : "";
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "NATURALREAD_READ_PAGE") {
      const excerpt = readPageParagraphs(msg.rate, msg.pitch);
      sendResponse({ ok: true, excerpt });
      return true;
    }
    if (msg && msg.type === "NATURALREAD_STOP") {
      window.speechSynthesis.cancel();
      clearHighlight();
      sendResponse({ ok: true });
      return true;
    }
  });
})();
