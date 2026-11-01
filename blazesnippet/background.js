const DEFAULT_TEMPLATES = [
  {
    cmd: "/support",
    category: "Customer Support",
    body: "Hi {form:Customer=Valued Customer}, thank you for contacting support! Your ticket is scheduled for resolution by {+2d}. Let us know if you need urgent priority."
  },
  {
    cmd: "/sales",
    category: "Sales Outreach",
    body: "Hi {form:Prospect=Team}, great speaking today ({today})! I have sent the proposal and will follow up with you on {next monday}."
  },
  {
    cmd: "/bug",
    category: "Engineering",
    body: "### Bug Triage Report ({today})\n- **Environment**: Production\n- **Target SLA Fix Date**: {+3d}\n- **Status**: Investigating root cause."
  },
  {
    cmd: "/standup",
    category: "Engineering",
    body: "**Daily Standup ({today})**\n- Yesterday: Completed core sprint tasks\n- Today: Shipping verification tests\n- Next Milestone: {+7d}"
  },
  {
    cmd: "/rx",
    category: "Medical / Technical",
    body: "Clinical Follow-Up Note ({today}): Patient advised to continue current regimen and return for follow-up evaluation on {+14d}."
  },
  {
    cmd: "/invoice",
    category: "Operations",
    body: "Friendly reminder: Invoice generated on {today} is due on {+14d}. Thank you for your prompt partnership!"
  }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["blazesnippet_templates"], (res) => {
    if (!Array.isArray(res.blazesnippet_templates)) {
      chrome.storage.local.set({ blazesnippet_templates: DEFAULT_TEMPLATES });
    }
  });
});
