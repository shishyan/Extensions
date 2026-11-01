/**
 * SnovFinder — Background Service Worker
 * Generates 3-Step B2B Cold Drip Campaigns (Day 1 Intro -> Day 3 Value -> Day 7 Breakup)
 */

function generateDripSequence(domain, topic) {
  const dom = domain || "enterprise-ai.io";
  const top = (topic || "cloud automation & velocity").slice(0, 60);
  return [
    {
      step: "Step 1 — Day 1 (Executive Intro)",
      subject: `Quick question re: ${dom}'s ${top}`,
      body: `Hi {{FirstName}},\n\nNoticed ${dom} is scaling ${top}. We helped similar engineering teams reduce pipeline overhead by 42% in 14 days.\n\nOpen to a 5-min benchmark walkthrough this week?`
    },
    {
      step: "Step 2 — Day 3 (Case Study & Value Add)",
      subject: `Re: ${dom} benchmark + architecture brief`,
      body: `Hi {{FirstName}},\n\nSharing the 1-page architecture breakdown showing how teams automate ${top} without adding headcount.\n\nHappy to send the custom ROI model for ${dom} if useful.`
    },
    {
      step: "Step 3 — Day 7 (Polite Breakup)",
      subject: `Should I close the loop on this, {{FirstName}}?`,
      body: `Hi {{FirstName}},\n\nI know Q4 roadmap priorities are packed at ${dom}. If ${top} isn't a focus right now, I'll step back — otherwise let me know if next Tuesday works.`
    }
  ];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "SNOV_BUILD_DRIP") {
    sendResponse({ ok: true, sequence: generateDripSequence(msg.domain, msg.topic) });
    return false;
  }
});
