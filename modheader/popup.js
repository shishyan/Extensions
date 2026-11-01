let targetUrl = "https://api.enterprise.io/v1/status";
const codeOut = document.getElementById("codeOut");

function getHeaderPairs() {
  const names = Array.from(document.querySelectorAll(".hn"));
  const vals = Array.from(document.querySelectorAll(".hv"));
  return names
    .map((n, i) => ({ name: n.value.trim(), value: (vals[i]?.value || "").trim() }))
    .filter((x) => x.name);
}

function buildCurl() {
  const pairs = getHeaderPairs();
  const flags = pairs.map((p) => `  -H "${p.name}: ${p.value}"`).join(" \\\n");
  return `curl -X GET "${targetUrl}" \\\n${flags}`;
}

function buildFetch() {
  const pairs = getHeaderPairs();
  const obj = {};
  pairs.forEach((p) => (obj[p.name] = p.value));
  return `await fetch("${targetUrl}", {\n  method: "GET",\n  headers: ${JSON.stringify(obj, null, 4)}\n});`;
}

function refreshSnippet() {
  codeOut.textContent = buildCurl();
}

document.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", refreshSnippet));

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (tab && tab.url && /^https?:/i.test(tab.url)) {
    targetUrl = tab.url;
    refreshSnippet();
  }
});

document.getElementById("copyCurlBtn").addEventListener("click", () => {
  const txt = buildCurl();
  codeOut.textContent = txt;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyCurlBtn").textContent = "✅ Copied cURL!";
});

document.getElementById("copyFetchBtn").addEventListener("click", () => {
  const txt = buildFetch();
  codeOut.textContent = txt;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyFetchBtn").textContent = "✅ Copied fetch()!";
});

refreshSnippet();
