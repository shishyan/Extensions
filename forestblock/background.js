chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    forestblock_domains: ["tiktok.com", "instagram.com", "reddit.com"],
    forestblock_trees: 14
  });
});
