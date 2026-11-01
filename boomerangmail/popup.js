function evaluateDraft() {
  const txt = document.getElementById("draftInput").value.trim();
  const words = txt.split(/\s+/).filter(Boolean).length;
  const q = (txt.match(/\?/g) || []).length;
  let score = 68;
  if (words >= 15 && words <= 150) score += 14;
  if (q >= 1 && q <= 3) score += 10;
  if (/thank|please|would|appreciate/i.test(txt)) score += 6;
  score = Math.min(98, score);

  document.getElementById("likeVal").textContent = `${score}%`;
  document.getElementById("qVal").textContent = `${q} (${q >= 1 && q <= 3 ? "Optimal" : "Adjust"})`;
  document.getElementById("rVal").textContent = `Grade ${Math.max(4, Math.min(11, Math.round(words / 12) + 4))}`;
}

evaluateDraft();
document.getElementById("draftInput").addEventListener("input", evaluateDraft);

document.getElementById("pauseBtn").addEventListener("click", () => {
  document.getElementById("pauseBtn").textContent = "✅ Inbox Focus Mode Activated!";
});
