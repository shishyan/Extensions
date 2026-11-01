/**
 * HarpaAutomate — Background Service Worker
 * Manages watched DOM elements / price monitors in chrome.storage.local
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["harpaMonitors"], (res) => {
    if (!Array.isArray(res.harpaMonitors)) {
      chrome.storage.local.set({ harpaMonitors: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "HARPA_ADD_MONITOR") {
    chrome.storage.local.get(["harpaMonitors"], (res) => {
      const list = Array.isArray(res.harpaMonitors) ? res.harpaMonitors : [];
      const item = {
        id: "mon_" + Date.now(),
        url: msg.url || "",
        title: msg.title || "Monitored Element",
        selector: msg.selector || "body",
        lastValue: msg.value || "",
        updatedAt: new Date().toISOString()
      };
      list.unshift(item);
      const trimmed = list.slice(0, 30);
      chrome.storage.local.set({ harpaMonitors: trimmed }, () => {
        sendResponse({ ok: true, item, monitors: trimmed });
      });
    });
    return true;
  }

  if (msg && msg.type === "HARPA_GET_MONITORS") {
    chrome.storage.local.get(["harpaMonitors"], (res) => {
      sendResponse({ ok: true, monitors: Array.isArray(res.harpaMonitors) ? res.harpaMonitors : [] });
    });
    return true;
  }

  if (msg && msg.type === "HARPA_CLEAR_MONITORS") {
    chrome.storage.local.set({ harpaMonitors: [] }, () => {
      sendResponse({ ok: true, monitors: [] });
    });
    return true;
  }
});
