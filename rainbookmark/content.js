(function () {
  if (document.getElementById("rainbookmark-pill")) return;

  const STOP = new Set([
    "the", "and", "for", "with", "from", "that", "this", "into", "your", "page", "test", "suite"
  ]);

  function generateAutoTags() {
    const rawText = [
      document.title || "",
      Array.from(document.querySelectorAll("h1, h2"))
        .map((h) => h.innerText || h.textContent || "")
        .join(" ")
    ]
      .join(" ")
      .toLowerCase();

    const words = (rawText.match(/[a-z]{4,14}/g) || []).filter((w) => !STOP.has(w));
    const unique = [];
    for (const w of words) {
      if (!unique.includes("#" + w)) unique.push("#" + w);
      if (unique.length >= 4) break;
    }
    while (unique.length < 4) {
      const fallbacks = ["#research", "#reference", "#web", "#archive"];
      unique.push(fallbacks[unique.length]);
    }
    return unique;
  }

  const tags = generateAutoTags();
  const pill = document.createElement("div");
  pill.id = "rainbookmark-pill";
  pill.innerHTML = `
    <span>🌧️ RainBookmark: ${tags.slice(0, 3).join(" ")}</span>
    <button id="rainbookmark-save-btn">+Save Bookmark</button>
    <span id="rainbookmark-msg" style="color:#7dd3fc;font-size:10px;"></span>
  `;
  document.documentElement.appendChild(pill);

  function saveCurrentBookmark(cb) {
    const bookmark = {
      title: document.title || "Untitled Page",
      url: location.href,
      tags: generateAutoTags(),
      createdAt: Math.floor(Date.now() / 1000)
    };
    chrome.runtime.sendMessage({ type: "RAINBOOKMARK_SAVE", bookmark }, (res) => {
      const msgEl = pill.querySelector("#rainbookmark-msg");
      if (msgEl) {
        msgEl.textContent = res && res.duplicate ? "Duplicate Flagged!" : "Saved!";
      }
      if (cb) cb(res, bookmark);
    });
  }

  pill.querySelector("#rainbookmark-save-btn").addEventListener("click", () => {
    saveCurrentBookmark();
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "RAINBOOKMARK_SAVE_ACTIVE") {
      saveCurrentBookmark((res, bm) => {
        sendResponse({ ok: true, res, bookmark: bm });
      });
      return true;
    }
  });
})();
