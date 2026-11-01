let latest = {
  discType: "C/D",
  archetype: "Analytical Architect (Type C)",
  doSay: "Provide concrete benchmarks, architecture diagrams, security specs, and deterministic proof.",
  avoid: "Avoid unverified hype, emotional hyperbole, or rushing their technical evaluation.",
  pitchTemplate: "Hi — attached are our reproducible benchmark metrics, architecture spec, and zero-error verification logs for your review."
};

function render(d) {
  if (d && d.discType) latest = d;
  document.getElementById("archTxt").textContent = latest.archetype;
  document.getElementById("codeTxt").textContent = `DISC: ${latest.discType}`;
  document.getElementById("doTxt").textContent = latest.doSay;
  document.getElementById("avoidTxt").textContent = latest.avoid;
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
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(latest.pitchTemplate).catch(() => {});
  }
  document.getElementById("copyPitchBtn").textContent = "✅ Tailored Pitch Copied!";
});
