function scoreTitle(t) {
  const s = String(t || "").trim();
  if (!s) return 0;
  let score = 45;
  if (s.length >= 42 && s.length <= 68) score += 18;
  if (/\d+/.test(s)) score += 14;
  if (/[\[\(\{].+?[\]\)\}]/.test(s)) score += 12;
  if (/ultimate|secret|proven|guide|blueprint|2026|step|fast|free/i.test(s)) score += 10;
  return Math.min(99, score);
}

function runAB() {
  const a = document.getElementById("titleA").value;
  const b = document.getElementById("titleB").value;
  const sa = scoreTitle(a);
  const sb = scoreTitle(b);
  const win = sb >= sa ? "Variant B Wins!" : "Variant A Wins!";
  document.getElementById("abResult").innerHTML = `<span>A: ${sa}/100</span><span>B: ${sb}/100</span><span>🏆 ${win}</span>`;
}

runAB();
document.getElementById("abBtn").addEventListener("click", runAB);

document.getElementById("cleanTagsBtn").addEventListener("click", () => {
  const raw = document.getElementById("tagInput").value;
  const unique = Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();
  const joined = unique.join(", ").slice(0, 500);
  document.getElementById("tagInput").value = joined;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(joined).catch(() => {});
  }
  document.getElementById("cleanTagsBtn").textContent = `✅ Cleaned (${unique.length} unique tags copied!)`;
});
