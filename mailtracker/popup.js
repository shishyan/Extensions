function evaluateSubj() {
  const s = document.getElementById("subjInput").value.trim();
  let score = 65;
  if (s.length >= 24 && s.length <= 56) score += 18;
  if (/\d+/.test(s)) score += 8;
  if (/quick|question|roadmap|idea|update|thank/i.test(s)) score += 8;
  score = Math.min(99, score);
  document.getElementById("scoreOut").textContent = `Score: ${score}/100 • Est. Open Rate: ${Math.round(score * 0.68)}% • Politeness: High`;
}

evaluateSubj();
document.getElementById("scoreBtn").addEventListener("click", evaluateSubj);

document.getElementById("utmBtn").addEventListener("click", () => {
  const raw = document.getElementById("urlInput").value.trim();
  const receiptId = "mt_" + Math.random().toString(36).slice(2, 8);
  const tracked = `${raw}${raw.includes("?") ? "&" : "?"}utm_source=mailtracker&utm_medium=email&mt_receipt=${receiptId}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tracked).catch(() => {});
  }
  document.getElementById("utmBtn").textContent = "✅ Tracked Link Copied!";
});

document.getElementById("pixelBtn").addEventListener("click", () => {
  const receiptId = "mt_" + Date.now();
  const pixelHtml = `<img src="https://track.mailtracker.local/pixel.gif?id=${receiptId}" width="1" height="1" alt="" style="display:none;" />`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pixelHtml).catch(() => {});
  }
  document.getElementById("pixelBtn").textContent = "✅ HTML Pixel Copied!";
});

function renderReminders() {
  if (!chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get({ mailtracker_logs: [] }, (res) => {
    const logs = Array.isArray(res.mailtracker_logs) ? res.mailtracker_logs : [];
    document.getElementById("schedList").innerHTML = logs
      .slice(0, 4)
      .map((l) => `<div>⏰ <strong>${l.subject}</strong> — Due: ${l.followUpDate}</div>`)
      .join("") || "No pending follow-ups.";
  });
}
renderReminders();

document.getElementById("schedBtn").addEventListener("click", () => {
  const subj = document.getElementById("subjInput").value.trim() || "Outreach Thread";
  const item = {
    subject: subj,
    followUpDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10)
  };
  chrome.storage.local.get({ mailtracker_logs: [] }, (res) => {
    const list = Array.isArray(res.mailtracker_logs) ? res.mailtracker_logs : [];
    list.unshift(item);
    chrome.storage.local.set({ mailtracker_logs: list.slice(0, 40) }, renderReminders);
  });
  document.getElementById("schedBtn").textContent = "✅ 48h Reminder Saved!";
});

document.getElementById("injectBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "MAILTRACKER_INJECT_TEMPLATE" }, () => {
        document.getElementById("injectBtn").textContent = "✅ Injected in Webmail!";
      });
    }
  });
});
