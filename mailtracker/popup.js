function evaluateSubj() {
  const s = document.getElementById("subjInput").value.trim();
  let score = 65;
  if (s.length >= 24 && s.length <= 56) score += 18;
  if (/\d+/.test(s)) score += 8;
  if (/quick|question|roadmap|idea|update/i.test(s)) score += 8;
  score = Math.min(99, score);
  document.getElementById("scoreOut").textContent = `Score: ${score}/100 • Est. Open Rate: ${Math.round(score * 0.68)}%`;
}

evaluateSubj();
document.getElementById("scoreBtn").addEventListener("click", evaluateSubj);

document.getElementById("utmBtn").addEventListener("click", () => {
  const raw = document.getElementById("urlInput").value.trim();
  const tracked = `${raw}${raw.includes("?") ? "&" : "?"}utm_source=mailtracker&utm_medium=email`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tracked).catch(() => {});
  }
  document.getElementById("utmBtn").textContent = "✅ Tracked Link Copied!";
});
