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

let templates = DEFAULT_TEMPLATES.slice();

function renderTemplates() {
  const listEl = document.getElementById("tplList");
  listEl.innerHTML = templates
    .map(
      (t) => `
      <div class="tpl-card">
        <div>
          <span class="cmd-pill">${t.cmd}</span>
          <span class="cat-pill">${t.category || "General"}</span>
        </div>
        <div style="color:#cbd5e1;margin-top:4px;line-height:1.35;">${t.body.slice(0, 105)}</div>
      </div>
    `
    )
    .join("");
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["blazesnippet_templates"], (res) => {
    if (Array.isArray(res.blazesnippet_templates) && res.blazesnippet_templates.length > 0) {
      templates = res.blazesnippet_templates;
    }
    renderTemplates();
  });
} else {
  renderTemplates();
}

document.getElementById("saveTplBtn").addEventListener("click", () => {
  let cmd = document.getElementById("cmdInput").value.trim();
  const category = document.getElementById("catInput").value.trim() || "Custom";
  const body = document.getElementById("bodyInput").value.trim();
  if (!cmd || !body) return;
  if (!cmd.startsWith("/")) cmd = "/" + cmd;

  templates.unshift({ cmd, category, body });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ blazesnippet_templates: templates });
  }
  document.getElementById("cmdInput").value = "";
  document.getElementById("catInput").value = "";
  document.getElementById("bodyInput").value = "";
  renderTemplates();
});

document.getElementById("openBarBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "BLAZE_OPEN_PALETTE" }, () => {});
      }
    });
  }
});
