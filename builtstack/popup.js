let lastStack = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "BUILTSTACK_SCAN" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        lastStack = res;
        document.getElementById("techCount").textContent = res.detected.length;
        document.getElementById("scriptCount").textContent = res.scriptCount;
        document.getElementById("cssCount").textContent = res.stylesheetCount;
        document.getElementById("stackList").innerHTML = res.detected
          .map((t) => `<div class="item"><strong>${t.name}</strong><span class="cat">${t.cat}</span></div>`)
          .join("");
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  if (!lastStack) return;
  navigator.clipboard.writeText(JSON.stringify(lastStack, null, 2));
  document.getElementById("copyBtn").textContent = "✅ JSON Copied!";
  setTimeout(() => (document.getElementById("copyBtn").textContent = "📋 Copy JSON Stack"), 1300);
});

document.getElementById("csvBtn").addEventListener("click", () => {
  if (!lastStack) return;
  const rows = [["Domain", "Technology", "Category"]];
  lastStack.detected.forEach((t) => rows.push([lastStack.domain, t.name, t.cat]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `builtstack-${lastStack.domain}.csv`;
  a.click();
});
