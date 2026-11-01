let latest = {
  discType: "C/D",
  archetype: "Analytical Architect (Type C)",
  scores: { D: 72, I: 45, S: 50, C: 88 },
  doSay: "Provide concrete benchmarks, architecture diagrams, security specs, and deterministic proof.",
  avoid: "Avoid unverified hype, emotional hyperbole, or rushing their technical evaluation.",
  subjectTemplate: "[Benchmark] Reproducible latency & architecture spec for your team",
  pitchTemplate: "Hi — attached are our reproducible benchmark metrics, architecture spec, and zero-error verification logs for your review."
};

function render(d) {
  if (d && d.discType) latest = d;
  document.getElementById("archTxt").textContent = latest.archetype;
  document.getElementById("codeTxt").textContent = `DISC: ${latest.discType}`;
  document.getElementById("doTxt").textContent = latest.doSay;
  document.getElementById("avoidTxt").textContent = latest.avoid;
  document.getElementById("subjTxt").textContent = latest.subjectTemplate || "[Executive Brief] 3 measurable Q4 outcomes";
  if (latest.scores) {
    document.getElementById("dScore").textContent = `${Math.min(99, latest.scores.D || 70)}%`;
    document.getElementById("iScore").textContent = `${Math.min(99, latest.scores.I || 45)}%`;
    document.getElementById("sScore").textContent = `${Math.min(99, latest.scores.S || 50)}%`;
    document.getElementById("cScore").textContent = `${Math.min(99, latest.scores.C || 85)}%`;
  }
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "CRYSTAL_GET_PERSONA" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("copyPitchBtn").addEventListener("click", () => {
  const full = `Subject: ${latest.subjectTemplate || "Quick question"}\n\n${latest.pitchTemplate}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(full).catch(() => {});
  }
  document.getElementById("copyPitchBtn").textContent = "✅ Subject + Pitch Copied!";
});
