function toTs(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "export type RootObject = any;";
  const lines = ["export interface RootObject {"];
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`  ${k}: ${Array.isArray(v) ? "any[]" : typeof v};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function runFormat(minify = false) {
  try {
    const raw = document.getElementById("jsonInp").value;
    const parsed = JSON.parse(raw);
    const q = (document.getElementById("filterInp").value || "").trim().toLowerCase();
    let displayObj = parsed;
    if (q && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      displayObj = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k.toLowerCase().includes(q) || JSON.stringify(v).toLowerCase().includes(q)) {
          displayObj[k] = v;
        }
      }
    }
    document.getElementById("jsonInp").value = minify
      ? JSON.stringify( parsed )
      : JSON.stringify(parsed, null, 2);
    document.getElementById("tsOut").textContent = toTs(displayObj);
  } catch (e) {
    document.getElementById("tsOut").textContent = "// Invalid JSON syntax";
  }
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "JSONVIEWER_ANALYZE" }, (res) => {
        if (!chrome.runtime.lastError && res && res.formatted) {
          document.getElementById("jsonInp").value = res.formatted;
          runFormat(false);
        }
      });
    }
  });
}

runFormat(false);
document.getElementById("fmtBtn").addEventListener("click", () => runFormat(false));
document.getElementById("minBtn").addEventListener("click", () => runFormat(true));
document.getElementById("filterInp").addEventListener("input", () => runFormat(false));

document.getElementById("copyTsBtn").addEventListener("click", () => {
  const ts = document.getElementById("tsOut").textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ts).catch(() => {});
  }
  document.getElementById("copyTsBtn").textContent = "✅ TS!";
});

document.getElementById("dlJsonBtn").addEventListener("click", () => {
  const json = document.getElementById("jsonInp").value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).catch(() => {});
  }
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payload.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (_) {}
  document.getElementById("dlJsonBtn").textContent = "✅ Saved!";
});
