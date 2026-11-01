chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["deeptranslate_lang"], (res) => {
    if (!res.deeptranslate_lang) {
      chrome.storage.local.set({ deeptranslate_lang: "es" });
    }
  });
});
