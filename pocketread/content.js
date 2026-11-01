(function () {
  if (document.getElementById("pocketread-badge")) return;

  let speaking = false;

  function extractArticleInfo() {
    const bodyText = (document.body ? document.body.innerText : "").trim();
    const words = bodyText ? bodyText.split(/\s+/).length : 120;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    const paragraphs = Array.from(document.querySelectorAll("article p, main p, p"))
      .map((p) => (p.innerText || p.textContent || "").trim())
      .filter(Boolean);
    return {
      title: document.title || "Untitled Article",
      url: location.href,
      words,
      readMinutes,
      tags: ["#pocket", "#read-later"],
      fullText: (paragraphs.join("\n\n") || bodyText).slice(0, 2500)
    };
  }

  function toggleTts() {
    const info = extractArticleInfo();
    try {
      if (window.speechSynthesis) {
        if (speaking) {
          window.speechSynthesis.cancel();
          speaking = false;
        } else {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(info.title + ". " + info.fullText.slice(0, 600));
          window.speechSynthesis.speak(u);
          speaking = true;
        }
      } else {
        speaking = !speaking;
      }
    } catch (_) {
      speaking = !speaking;
    }
    return speaking;
  }

  function toggleReaderMode() {
    let modal = document.getElementById("pocketread-reader-modal");
    if (modal) {
      modal.remove();
      return false;
    }
    const info = extractArticleInfo();
    modal = document.createElement("div");
    modal.id = "pocketread-reader-modal";
    modal.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#1c1917;color:#f5f5f4;padding:40px 18%;overflow-y:auto;font-family:Georgia,serif;line-height:1.75;";
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #44403c;padding-bottom:10px;margin-bottom:18px;font-family:system-ui,sans-serif;">
        <strong style="color:#f87171;">📥 PocketRead Distraction-Free Reader (~${info.readMinutes} min · ${info.words} words)</strong>
        <div style="display:flex;gap:6px;">
          <button id="pr-modal-tts" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;">🔊 Play/Stop TTS</button>
          <button id="pr-modal-print" style="background:#44403c;color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;">🖨️ Print</button>
          <button id="pr-modal-close" style="background:#292524;color:#fff;border:1px solid #57534e;border-radius:6px;padding:5px 10px;cursor:pointer;">✕</button>
        </div>
      </div>
      <h1 style="font-size:26px;margin:0 0 14px;">${info.title}</h1>
      <div style="white-space:pre-wrap;font-size:17px;">${info.fullText}</div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#pr-modal-close").addEventListener("click", () => modal.remove());
    modal.querySelector("#pr-modal-tts").addEventListener("click", toggleTts);
    modal.querySelector("#pr-modal-print").addEventListener("click", () => {
      try { window.print(); } catch (_) {}
    });
    return true;
  }

  const info = extractArticleInfo();
  const badge = document.createElement("div");
  badge.id = "pocketread-badge";
  badge.innerHTML = `
    <span>📥 PocketRead (~${info.readMinutes} min · ${info.words}w)</span>
    <button id="pocketread-save-btn">+Save Offline</button>
    <button id="pocketread-tts-btn" style="margin-left:4px;">🔊 TTS</button>
  `;
  document.documentElement.appendChild(badge);

  const btn = badge.querySelector("#pocketread-save-btn");
  btn.addEventListener("click", () => {
    const article = extractArticleInfo();
    chrome.runtime.sendMessage({ type: "POCKETREAD_ADD", article }, (res) => {
      btn.textContent = `Cached (${res && res.count ? res.count : 1})`;
    });
  });

  badge.querySelector("#pocketread-tts-btn").addEventListener("click", () => {
    const on = toggleTts();
    badge.querySelector("#pocketread-tts-btn").textContent = on ? "⏹ Stop" : "🔊 TTS";
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "POCKETREAD_SAVE_NOW") {
      const article = extractArticleInfo();
      if (msg.tags) article.tags = msg.tags;
      chrome.runtime.sendMessage({ type: "POCKETREAD_ADD", article }, (res) => {
        btn.textContent = `Cached (${res && res.count ? res.count : 1})`;
        sendResponse({ ok: true, article, count: res && res.count ? res.count : 1 });
      });
      return true;
    }
    if (msg.type === "POCKETREAD_TTS_TOGGLE") {
      sendResponse({ ok: true, speaking: toggleTts() });
      return true;
    }
    if (msg.type === "POCKETREAD_READER_TOGGLE") {
      sendResponse({ ok: true, readerOpen: toggleReaderMode() });
      return true;
    }
  });
})();
