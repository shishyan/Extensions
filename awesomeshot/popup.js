const msg = document.getElementById("msg");

function sendAction(action, label) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "AWESOMESHOT_ACTION", action }, () => {
      msg.textContent = label;
    });
  });
}

document.getElementById("blurPiiBtn").addEventListener("click", () =>
  sendAction("blur", "✅ Blurred all visible PII (Emails, Phones & Dollar Amounts)!")
);
document.getElementById("calloutBtn").addEventListener("click", () =>
  sendAction("callout", "✅ Added Red Callout Highlight Box!")
);
document.getElementById("clearBtn").addEventListener("click", () =>
  sendAction("clear", "🧹 Cleared all page annotations.")
);
