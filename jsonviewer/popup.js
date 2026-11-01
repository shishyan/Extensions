function toTs(obj) {
  const lines = ["export interface RootObject {"];
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`  ${k}: ${Array.isArray(v) ? "any[]" : typeof v};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function runFormat() {
  try {
    const parsed = JSON.parse(document.getElementById("jsonInp").value);
    document.getElementById("jsonInp").value = JSON.stringify(parsed, null, 2);
    document.getElementById("tsOut").textContent = toTs(parsed);
  } catch (e) {
    document.getElementById("tsOut").textContent = "// Invalid JSON syntax";
  }
}

runFormat();
document.getElementById("fmtBtn").addEventListener("click", runFormat);

document.getElementById("copyTsBtn").addEventListener("click", () => {
  const ts = document.getElementById("tsOut").textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ts).catch(() => {});
  }
  document.getElementById("copyTsBtn").textContent = "✅ TS Interface Copied!";
});
