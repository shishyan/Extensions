let leadData = {
  domain: "company.com",
  emails: [],
  categorizedEmails: [],
  phones: [],
  socialLinks: [],
  patterns: []
};

const personInput = document.getElementById("personName");
const domainInput = document.getElementById("domainInput");

function generatePermutations(fullName, domain) {
  const cleanDomain = (domain || "company.com").trim().replace(/^@/, "").toLowerCase();
  const parts = (fullName || "alex morgan").trim().toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const first = parts[0] || "first";
  const last = parts[1] || "last";
  const fi = first[0] || "f";
  return [
    `${first}@${cleanDomain}`,
    `${first}.${last}@${cleanDomain}`,
    `${fi}${last}@${cleanDomain}`,
    `${first}_${last}@${cleanDomain}`,
    `${first}${last}@${cleanDomain}`,
    `founders@${cleanDomain}`,
    `contact@${cleanDomain}`
  ];
}

function renderPermutations() {
  const pBox = document.getElementById("patterns");
  const perms = generatePermutations(personInput.value, domainInput.value);
  leadData.patterns = perms;
  pBox.innerHTML =
    `<strong>Corporate Permutations (@${domainInput.value}):</strong><br>` +
    perms.map((p) => `<span class="tag" title="Click to copy">${p}</span>`).join("");

  pBox.querySelectorAll(".tag").forEach((el) => {
    el.addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.textContent).catch(() => {});
      }
      el.style.background = "#10b981";
    });
  });
}

personInput.addEventListener("input", renderPermutations);
domainInput.addEventListener("input", renderPermutations);

function renderScanResult(res) {
  const eBox = document.getElementById("emails");
  const psBox = document.getElementById("phones-socials");
  if (res && res.domain) {
    leadData = res;
    domainInput.value = res.domain;
  }

  if (leadData.emails && leadData.emails.length > 0) {
    eBox.innerHTML =
      `<strong>Found ${leadData.emails.length} Verified Email(s) on ${leadData.domain}:</strong><br>` +
      leadData.emails.map((e) => `<span class="tag" title="Click to copy">${e}</span>`).join("");
  } else {
    eBox.innerHTML = `<strong>No direct emails exposed in DOM on ${leadData.domain}.</strong> Use the Corporate Permutator below:`;
  }

  const phonesHtml = leadData.phones && leadData.phones.length
    ? leadData.phones.map((p) => `<span class="tag">📞 ${p}</span>`).join("")
    : `<span style="color:#94a3b8">No phones detected</span>`;

  const socialHtml = leadData.socialLinks && leadData.socialLinks.length
    ? leadData.socialLinks.map((s) => `<span class="tag">${s.replace(/^https?:\/\/(www\.)?/, "")}</span>`).join("")
    : `<span style="color:#94a3b8">No social links</span>`;

  psBox.innerHTML = `<div><strong>Phones (${(leadData.phones || []).length}):</strong> ${phonesHtml}</div><div style="margin-top:4px;"><strong>Social Profiles (${(leadData.socialLinks || []).length}):</strong> ${socialHtml}</div>`;

  document.querySelectorAll(".tag").forEach((el) => {
    el.addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.textContent.replace(/^📞\s*/, "")).catch(() => {});
      }
    });
  });

  renderPermutations();
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      renderScanResult(null);
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, { type: "HUNTLEAD_SCAN" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        renderScanResult(null);
        return;
      }
      renderScanResult(res);
    });
  });
} else {
  renderScanResult(null);
}

function buildCsv() {
  const rows = [["Domain", "Value", "Category"]];
  (leadData.emails || []).forEach((e) => rows.push([leadData.domain, e, "Extracted_Email"]));
  (leadData.phones || []).forEach((p) => rows.push([leadData.domain, p, "Phone"]));
  (leadData.socialLinks || []).forEach((s) => rows.push([leadData.domain, s, "Social_Profile"]));
  (leadData.patterns || []).forEach((p) => rows.push([domainInput.value, p, "Corporate_Permutation"]));
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const csv = buildCsv();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ CSV Copied!";
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const csv = buildCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `huntlead-${leadData.domain || "leads"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("exportBtn").textContent = "✅ CSV Downloaded!";
});
