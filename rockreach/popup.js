let graphData = {};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "ROCKREACH_MAP" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      graphData = res;
      document.getElementById("patternsBox").innerHTML = (res.patterns || [])
        .map((p) => `<div><strong>${p.email}</strong> — <span style="color:#34d399">${p.confidence}</span></div>`)
        .join("");
      document.getElementById("profilesBox").textContent = (res.profiles || []).join("\n");
      document.getElementById("icebreakerBox").textContent = res.icebreaker || "";
    }
  });
});

document.getElementById("copyIcebreakerBtn").addEventListener("click", () => {
  const topEmail = graphData.patterns?.[0]?.email || "alex.rivera@enterprise-ai.io";
  const text = `To: ${topEmail}\n\n${graphData.icebreaker || ""}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  document.getElementById("copyIcebreakerBtn").textContent = "✅ Copied Email + Icebreaker!";
});
