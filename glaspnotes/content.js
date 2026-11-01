(function () {
  if (window.__glaspNotesLoaded) return;
  window.__glaspNotesLoaded = true;

  function highlightSelection(color) {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (!text) return null;
    try {
      const range = sel.getRangeAt(0);
      const mark = document.createElement("mark");
      mark.style.backgroundColor = color || "#fde047";
      mark.style.color = "#0f172a";
      mark.style.padding = "1px 3px";
      mark.style.borderRadius = "3px";
      range.surroundContents(mark);
      sel.removeAllRanges();
    } catch (_) {}

    const item = {
      text,
      url: location.href,
      title: document.title || location.hostname,
      createdAt: new Date().toISOString()
    };
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["glasp_highlights"], (res) => {
        const list = Array.isArray(res.glasp_highlights) ? res.glasp_highlights : [];
        list.unshift(item);
        chrome.storage.local.set({ glasp_highlights: list.slice(0, 300) });
      });
    }
    return item;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "GLASP_HIGHLIGHT_SELECTION") {
      const item = highlightSelection(msg.color || "#fde047");
      sendResponse({ item });
      return true;
    }
  });
})();
