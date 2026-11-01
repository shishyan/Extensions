(function () {
  if (document.getElementById("everclipper-bar")) return;

  function buildClip(mode, notebook, tagsStr = "") {
    const title = document.title || "Untitled Page";
    const url = location.href;
    const sel = window.getSelection ? window.getSelection().toString().trim() : "";
    const paragraphs = Array.from(document.querySelectorAll("article p, main p, p"))
      .map((p) => (p.innerText || p.textContent || "").trim())
      .filter((t) => t.length > 25);

    let content = "";
    if (mode === "Selection Quote" && sel) {
      content = `> ${sel}`;
    } else if (mode === "Bookmark Card") {
      const metaDesc = document.querySelector('meta[name="description"]');
      content = metaDesc ? metaDesc.content : paragraphs[0] || title;
    } else if (mode === "Full Page HTML") {
      content = paragraphs.join("\n\n") || (document.body ? document.body.innerText.slice(0, 1200) : title);
    } else {
      content = paragraphs.slice(0, 8).join("\n\n") || (document.body ? document.body.innerText.slice(0, 800) : title);
    }

    const tags = tagsStr
      ? tagsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : ["#research", "#clipped"];

    return {
      id: "clip-" + Date.now(),
      title,
      url,
      notebook: notebook || "Research",
      mode: mode || "Simplified Article",
      tags,
      excerpt: content.slice(0, 600),
      timestamp: new Date().toISOString()
    };
  }

  function toggleReaderOverlay() {
    let ov = document.getElementById("everclipper-reader-overlay");
    if (ov) {
      ov.remove();
      return false;
    }
    const clip = buildClip("Simplified Article", "Research");
    ov = document.createElement("div");
    ov.id = "everclipper-reader-overlay";
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#f8fafc;overflow-y:auto;padding:48px 20%;font-family:Georgia,serif;line-height:1.75;";
    ov.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:20px;font-family:system-ui,sans-serif;">
        <strong style="color:#34d399;font-size:15px;">🐘 EverClipper Clean Reader Mode</strong>
        <div style="display:flex;gap:8px;">
          <button id="ec-tts-btn" style="background:#10b981;color:#022c22;border:none;border-radius:6px;padding:6px 10px;font-weight:700;cursor:pointer;">🔊 Listen (TTS)</button>
          <button id="ec-print-btn" style="background:#334155;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:700;cursor:pointer;">🖨️ Print / PDF</button>
          <button id="ec-close-btn" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-weight:700;cursor:pointer;">✕ Close</button>
        </div>
      </div>
      <h1 style="font-size:26px;margin:0 0 12px;">${clip.title}</h1>
      <div style="white-space:pre-wrap;font-size:17px;color:#e2e8f0;">${clip.excerpt}</div>
    `;
    document.body.appendChild(ov);
    ov.querySelector("#ec-close-btn").addEventListener("click", () => ov.remove());
    ov.querySelector("#ec-print-btn").addEventListener("click", () => {
      try { window.print(); } catch (_) {}
    });
    ov.querySelector("#ec-tts-btn").addEventListener("click", () => {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(clip.title + ". " + clip.excerpt);
          window.speechSynthesis.speak(u);
        }
      } catch (_) {}
    });
    return true;
  }

  const bar = document.createElement("div");
  bar.id = "everclipper-bar";
  bar.innerHTML = `
    <span>🐘 EverClipper</span>
    <select id="everclipper-nb">
      <option value="Research">Research</option>
      <option value="Engineering">Engineering</option>
      <option value="Finance">Finance</option>
      <option value="Ideas">Ideas</option>
    </select>
    <button id="everclipper-btn">Clip Simplified Article</button>
    <button id="everclipper-reader-btn" style="background:#047857;color:#fff;">📖 Reader + TTS</button>
    <span id="everclipper-status" style="color:#6ee7b7;font-size:10px;">Ready</span>
  `;
  document.documentElement.appendChild(bar);

  const btn = bar.querySelector("#everclipper-btn");
  const nbSelect = bar.querySelector("#everclipper-nb");
  const statusEl = bar.querySelector("#everclipper-status");

  btn.addEventListener("click", () => {
    const clip = buildClip("Simplified Article", nbSelect.value);
    chrome.runtime.sendMessage({ type: "EVERCLIPPER_SAVE_CLIP", clip }, (res) => {
      statusEl.textContent = `Saved (${res && res.count ? res.count : 1})`;
    });
  });

  bar.querySelector("#everclipper-reader-btn").addEventListener("click", toggleReaderOverlay);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "EVERCLIPPER_CLIP_NOW") {
      const clip = buildClip(msg.mode || "Simplified Article", msg.notebook || "Research", msg.tags || "");
      chrome.runtime.sendMessage({ type: "EVERCLIPPER_SAVE_CLIP", clip }, (res) => {
        statusEl.textContent = `Saved (${res && res.count ? res.count : 1})`;
        sendResponse({ ok: true, clip, total: res && res.count ? res.count : 1 });
      });
      return true;
    }
    if (msg.type === "EVERCLIPPER_READER_TOGGLE") {
      sendResponse({ ok: true, open: toggleReaderOverlay() });
      return true;
    }
  });
})();
