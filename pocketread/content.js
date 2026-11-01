(function () {
  if (document.getElementById("pocketread-badge")) return;

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
      fullText: (paragraphs.join("\n\n") || bodyText).slice(0, 2500)
    };
  }

  const info = extractArticleInfo();
  const badge = document.createElement("div");
  badge.id = "pocketread-badge";
  badge.innerHTML = `
    <span>📥 PocketRead (~${info.readMinutes} min · ${info.words}w)</span>
    <button id="pocketread-save-btn">+Save Offline</button>
  `;
  document.documentElement.appendChild(badge);

  const btn = badge.querySelector("#pocketread-save-btn");
  btn.addEventListener("click", () => {
    const article = extractArticleInfo();
    chrome.runtime.sendMessage({ type: "POCKETREAD_ADD", article }, (res) => {
      btn.textContent = `Cached (${res && res.count ? res.count : 1})`;
    });
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "POCKETREAD_SAVE_NOW") {
      const article = extractArticleInfo();
      chrome.runtime.sendMessage({ type: "POCKETREAD_ADD", article }, (res) => {
        btn.textContent = `Cached (${res && res.count ? res.count : 1})`;
        sendResponse({ ok: true, article, count: res && res.count ? res.count : 1 });
      });
      return true;
    }
  });
})();
