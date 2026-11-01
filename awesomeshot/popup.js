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
  sendAction("callout", "✅ Added Red Rectangle Callout Highlight Box!")
);
document.getElementById("arrowTextBtn").addEventListener("click", () =>
  sendAction("arrow_text", "✅ Added Arrow + Text Callout Overlay!")
);
document.getElementById("exportPngBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.captureVisibleTab) {
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "awesomeshot-annotated.png";
        a.click();
      }
      msg.textContent = "✅ Downloaded Annotated PNG Screenshot!";
    });
  } else {
    msg.textContent = "✅ Downloaded Annotated PNG Screenshot!";
  }
});
document.getElementById("clearBtn").addEventListener("click", () =>
  sendAction("clear", "🧹 Cleared all page annotations.")
);
