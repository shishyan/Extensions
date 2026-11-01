chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    editcookie_saved_presets: [
      { key: "debug_mode", value: "true", type: "cookie" },
      { key: "feature_flag_beta", value: "enabled", type: "localStorage" }
    ]
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EDITCOOKIE_GET_PRESETS") {
    chrome.storage.local.get(["editcookie_saved_presets"], (res) => {
      sendResponse({ ok: true, presets: res.editcookie_saved_presets || [] });
    });
    return true;
  }
});
