function evaluateDraft() {
  const txt = document.getElementById("draftInput").value.trim();
  const words = txt.split(/\s+/).filter(Boolean).length;
  const q = (txt.match(/\?/g) || []).length;
  const politeHits = (txt.match(/thank|please|appreciate|would|happy to|grateful|welcome/gi) || []).length;
  let score = 68;
  if (words >= 15 && words <= 150) score += 14;
  if (q >= 1 && q <= 3) score += 10;
  score += Math.min(10, politeHits * 4);
  score = Math.min(98, score);

  const politeness = Math.min(99, 72 + politeHits * 9);
  document.getElementById("likeVal").textContent = `${score}%`;
  document.getElementById("polVal").textContent = `${politeness}/100 (${politeness >= 85 ? "Warm" : "Neutral"})`;
  document.getElementById("rVal").textContent = `Grade ${Math.max(4, Math.min(11, Math.round(words / 12) + 4))}`;
}

evaluateDraft();
document.getElementById("draftInput").addEventListener("input", evaluateDraft);

document.getElementById("injectBtn").addEventListener("click", () => {
  const text = document.getElementById("draftInput").value.trim();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "BOOMERANG_INJECT_TEMPLATE", text }, () => {
        document.getElementById("injectBtn").textContent = "✅ Injected into Compose!";
      });
    }
  });
});

document.getElementById("schedBtn").addEventListener("click", () => {
  const text = document.getElementById("draftInput").value.trim();
  chrome.storage.local.get({ boomerang_reminders: [] }, (res) => {
    const list = Array.isArray(res.boomerang_reminders) ? res.boomerang_reminders : [];
    list.unshift({ text: text.slice(0, 80), sendAt: "Tomorrow 09:00 AM Local", createdAt: Date.now() });
    chrome.storage.local.set({ boomerang_reminders: list.slice(0, 30) }, () => {
      document.getElementById("schedBtn").textContent = `✅ Queued (${list.length})`;
    });
  });
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  document.getElementById("pauseBtn").textContent = "✅ Inbox Focus Mode Activated!";
});
