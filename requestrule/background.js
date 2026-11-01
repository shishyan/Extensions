chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    requestrule_rules: [
      { match: "/api/v1/config", action: "Mock 200 JSON", status: "ACTIVE" }
    ]
  });
});
