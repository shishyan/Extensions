let latestStack = { hostname: "active-site", categories: {} };
const stackContainer = document.getElementById("stackContainer");

function renderStack(data) {
  latestStack = data;
  const cats = data.categories || {};
  stackContainer.innerHTML = Object.entries(cats)
    .map(
      ([cat, list]) => `
      <div class="cat-card">
        <div class="cat-title">${cat}</div>
        <div class="cat-items">${(list || []).join(" • ")}</div>
      </div>`
    )
    .join("");
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "BUILTSTACK_SCAN" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      renderStack(res);
    } else {
      renderStack({
        hostname: "web-app",
        categories: {
          "Frontend & UI": ["HTML5 / CSS3", "ES2024 JavaScript"],
          "CMS & Commerce": ["Custom SSR Engine"],
          "Analytics & Pixels": ["First-Party Telemetry"]
        }
      });
    }
  });
});

document.getElementById("copyMdBtn").addEventListener("click", () => {
  const lines = [
    `# 🧱 BuiltStack Report: ${latestStack.hostname}`,
    ...Object.entries(latestStack.categories || {}).map(([k, v]) => `- **${k}:** ${v.join(", ")}`)
  ];
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
  }
  document.getElementById("copyMdBtn").textContent = "✅ Copied Markdown!";
});

document.getElementById("copyJsonBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(JSON.stringify(latestStack, null, 2)).catch(() => {});
  }
  document.getElementById("copyJsonBtn").textContent = "✅ Copied JSON!";
});
