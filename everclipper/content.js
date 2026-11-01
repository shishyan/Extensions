(function () {
  if (document.getElementById("everclipper-bar")) return;

  function buildClip(mode, notebook) {
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

    return {
      id: "clip-" + Date.now(),
      title,
      url,
      notebook: notebook || "Research",
      mode: mode || "Simplified Article",
      excerpt: content.slice(0, 600),
      timestamp: new Date().toISOString()
    };
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

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "EVERCLIPPER_CLIP_NOW") {
      const clip = buildClip(msg.mode || "Simplified Article", msg.notebook || "Research");
      chrome.runtime.sendMessage({ type: "EVERCLIPPER_SAVE_CLIP", clip }, (res) => {
        statusEl.textContent = `Saved (${res && res.count ? res.count : 1})`;
        sendResponse({ ok: true, clip, total: res && res.count ? res.count : 1 });
      });
      return true;
    }
  });
})();
