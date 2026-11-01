chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    copytables_default_format: "CSV"
  });
});
