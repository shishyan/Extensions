chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    todoisttask_items: [
      { title: "Review Q4 AI engineering architecture", priority: "P1", due: "Today", url: "https://example.com" }
    ]
  });
});
