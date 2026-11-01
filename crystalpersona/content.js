(function () {
  if (window.__crystalPersonaLoaded) return;
  window.__crystalPersonaLoaded = true;

  function analyzeDiscProfile() {
    const text = ((document.body && document.body.innerText) || "").toLowerCase();

    const scores = {
      D: Math.min(98, 42 + (text.match(/scale|revenue|roi|growth|fast|results|executive|target|lead|win/g) || []).length * 6),
      I: Math.min(98, 38 + (text.match(/community|excited|vision|partner|collab|creative|story|inspire/g) || []).length * 6),
      S: Math.min(98, 40 + (text.match(/support|team|reliable|trust|long-term|workflow|steady|care/g) || []).length * 6),
      C: Math.min(98, 46 + (text.match(/architecture|benchmark|data|metrics|security|precision|audit|code|system/g) || []).length * 6)
    };

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0];
    const secondary = sorted[1][0];
    const code = `${primary}/${secondary}`;

    const archetypes = {
      D: {
        title: "Results-Driven Driver (Type D)",
        doSay: "Lead with bottom-line ROI, speed to deployment, and measurable competitive advantage.",
        avoid: "Avoid long small talk, vague timelines, or overly granular implementation caveats.",
        subject: "[ROI Brief] 3 measurable Q4 velocity outcomes in 14 days",
        pitch: "Hi — here are the 3 measurable ROI outcomes we can deliver for your team in Q4, along with our 14-day deployment SLA."
      },
      C: {
        title: "Analytical Architect (Type C)",
        doSay: "Provide concrete benchmarks, architecture diagrams, security specs, and deterministic proof.",
        avoid: "Avoid unverified hype, emotional hyperbole, or rushing their technical evaluation.",
        subject: "[Benchmark Spec] Reproducible latency & security architecture data",
        pitch: "Hi — attached are our reproducible benchmark metrics, architecture spec, and zero-error verification logs for your review."
      },
      I: {
        title: "Visionary Influencer (Type I)",
        doSay: "Highlight big-picture innovation, social proof, and collaborative momentum.",
        avoid: "Avoid dry spreadsheet-only pitches without strategic narrative.",
        subject: "Loved your recent keynote — flagship partnership idea!",
        pitch: "Hi — loved your recent thought leadership! Here is how we can co-create a flagship showcase together this quarter."
      },
      S: {
        title: "Steady Relationship Builder (Type S)",
        doSay: "Emphasize reliability, smooth onboarding, low risk, and dedicated team support.",
        avoid: "Avoid high-pressure urgency tactics or disruptive workflow changes.",
        subject: "Zero-disruption onboarding & dedicated team support plan",
        pitch: "Hi — we designed a zero-disruption onboarding plan with full white-glove support for your team."
      }
    };

    const chosen = archetypes[primary] || archetypes.D;

    return {
      discType: code,
      archetype: chosen.title,
      scores,
      doSay: chosen.doSay,
      avoid: chosen.avoid,
      subjectTemplate: chosen.subject,
      pitchTemplate: chosen.pitch
    };
  }

  function injectBadge() {
    if (document.getElementById("crystalpersona-badge")) return;
    const p = analyzeDiscProfile();
    const badge = document.createElement("div");
    badge.id = "crystalpersona-badge";
    badge.innerHTML = `
      <div>
        🔮 <strong>CrystalPersona DISC Coach</strong> — ${p.archetype} (D:${p.scores.D} I:${p.scores.I} S:${p.scores.S} C:${p.scores.C}) • <em>${p.subjectTemplate}</em>
      </div>
      <span class="cp-type">DISC: ${p.discType}</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CRYSTAL_GET_PERSONA") {
      sendResponse(analyzeDiscProfile());
      return true;
    }
  });

  injectBadge();
})();
