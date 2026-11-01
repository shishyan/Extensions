let currentData = { headings: [], stats: [], codeBlocks: [], title: "" };
let activeTab = "outline";
const listContainer = document.getElementById("listContainer");
const searchFilter = document.getElementById("searchFilter");
const tabs = Array.from(document.querySelectorAll(".tab"));

function renderView() {
  if (activeTab === "outline") {
    listContainer.textContent = (currentData.headings || [])
      .map((h) => `${h.tag === "H3" ? "    • " : h.tag === "H2" ? "  ▸ " : "📌 "}[${h.tag}] ${h.text}`)
      .join("\n");
  } else if (activeTab === "stats") {
    listContainer.textContent = (currentData.stats || [])
      .map((s, idx) => `${idx + 1}. 📊 ${s}`)
      .join("\n\n");
  } else {
    listContainer.textContent = (currentData.codeBlocks || [])
      .map((c, idx) => `--- Snippet #${idx + 1} ---\n${c}`)
      .join("\n\n");
  }
}

function queryActiveTab() {
  const query = searchFilter.value.trim();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "SIDER_ANALYZE", query }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        currentData = res;
        renderView();
      } else {
        listContainer.textContent = "Ready — Open any article or documentation page to extract its outline, citations & code.";
      }
    });
  });
}

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.getAttribute("data-tab") || "outline";
    renderView();
  });
});

searchFilter.addEventListener("input", queryActiveTab);

document.getElementById("dockSplitBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "SIDER_TOGGLE_SPLIT" }, () => {});
  });
});

document.getElementById("copyOutlineBtn").addEventListener("click", () => {
  const md = [
    `# 📖 SiderChat Deep Reader: ${currentData.title || "Document"}`,
    `## Outline`,
    ...(currentData.headings || []).map((h) => `- **${h.tag}**: ${h.text}`),
    `## Citations & Stats`,
    ...(currentData.stats || []).map((s) => `- ${s}`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  const btn = document.getElementById("copyOutlineBtn");
  btn.textContent = "✅ Copied!";
  setTimeout(() => (btn.textContent = "📋 Copy MD"), 1400);
});

queryActiveTab();
