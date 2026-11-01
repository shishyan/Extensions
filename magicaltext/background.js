const DEFAULT_SNIPPETS = {
  "//intro": "Hi there! I came across {title} on {domain} and wanted to connect regarding our upcoming collaboration.",
  "//cal": "Feel free to grab a 15-minute slot on my calendar whenever works best for you (checked on {date}).",
  "//followup": "Just following up on my previous note sent on {date} — let me know if you have any questions!",
  "//sig": "Best regards,\nExecutive Operations Team ({domain})",
  "//date": "{date} {time}",
  "//clip": "Reference: {title} ({url}) — captured on {date}"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["magicaltext_snippets", "magicaltext_count"], (res) => {
    if (!res.magicaltext_snippets) {
      chrome.storage.local.set({
        magicaltext_snippets: DEFAULT_SNIPPETS,
        magicaltext_count: 0
      });
    }
  });
});
