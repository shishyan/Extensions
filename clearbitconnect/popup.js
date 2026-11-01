let latest = {
  companyName: "Enterprise AI Corp",
  domain: "example.com",
  industry: "B2B SaaS & Cloud Software",
  employees: "51–250 Employees",
  estArr: "$10M–$25M ARR",
  emailProvider: "Google Workspace"
};

function render(d) {
  if (d && d.companyName) latest = d;
  document.getElementById("coVal").textContent = latest.companyName;
  document.getElementById("domVal").textContent = latest.domain;
  document.getElementById("indVal").textContent = latest.industry;
  document.getElementById("empVal").textContent = latest.employees;
  document.getElementById("arrVal").textContent = latest.estArr;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "CLEARBIT_GET_FIRMOGRAPHICS" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const txt = `Company: ${latest.companyName} (${latest.domain}) | Industry: ${latest.industry} | Size: ${latest.employees} | Est. ARR: ${latest.estArr}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Firmographics Copied!";
});
