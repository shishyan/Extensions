let rules = [
  { action: "strip_params", match: "*?utm_*", target: "Clean URL", enabled: true },
  { action: "block", match: "/api/v1/telemetry", target: "Blocked", enabled: true }
];

function renderRules() {
  document.getElementById("rulesList").innerHTML = rules
    .map((r, i) => `<div style="padding:3px 0;border-bottom:1px solid #334155;"><strong>${i + 1}. [${r.action.toUpperCase()}]</strong> ${r.match} ➔ <span style="color:#4ade80">${r.target}</span></div>`)
    .join("");
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ requestrule_rules: rules }, (res) => {
    if (Array.isArray(res.requestrule_rules) && res.requestrule_rules.length) {
      rules = res.requestrule_rules;
    }
    renderRules();
  });
} else {
  renderRules();
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "REQUESTRULE_GET_NETWORK" }, (res) => {
        if (!chrome.runtime.lastError && res) {
          document.getElementById("reqCount").textContent = `🌐 Requests: ${res.totalRequests}`;
          document.getElementById("latVal").textContent = `⏱️ Avg Latency: ${res.avgLatencyMs}ms`;
        }
      });
    }
  });
}

document.getElementById("saveRuleBtn").addEventListener("click", () => {
  const action = document.getElementById("actionSel").value;
  const match = document.getElementById("matchInp").value.trim() || "*";
  const target = document.getElementById("mockInp").value.trim() || "Applied";
  rules.unshift({ action, match, target, enabled: true });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ requestrule_rules: rules.slice(0, 30), requestrule_last: { match, mock: target } });
  }
  renderRules();
  document.getElementById("saveRuleBtn").textContent = "✅ Rule Saved!";
});

document.getElementById("stripNowBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "REQUESTRULE_STRIP_NOW" }, (res) => {
        const c = (res && res.stripped) || 0;
        document.getElementById("stripNowBtn").textContent = `✅ Cleaned (${c})`;
      });
    }
  });
});
