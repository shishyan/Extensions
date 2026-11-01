let currentContact = { name: "Executive Contact", phones: ["+14158902310"], emails: ["contact@enterprise-ai.io"] };
const phonesBox = document.getElementById("phonesBox");
const emailsBox = document.getElementById("emailsBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "LUSHA_SCAN" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      currentContact = res;
      phonesBox.textContent = (res.phones || []).join(" • ");
      emailsBox.textContent = (res.emails || []).join(" • ");
    }
  });
});

document.getElementById("dlVcfBtn").addEventListener("click", () => {
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${currentContact.name}`,
    `TEL;TYPE=WORK,VOICE:${(currentContact.phones || [])[0] || ""}`,
    `EMAIL;TYPE=PREF,INTERNET:${(currentContact.emails || [])[0] || ""}`,
    "END:VCARD"
  ].join("\r\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(vcf).catch(() => {});
  }
  document.getElementById("dlVcfBtn").textContent = "✅ vCard (.VCF) Ready!";
});

document.getElementById("copyAllBtn").addEventListener("click", () => {
  const str = `${currentContact.name} | ${(currentContact.phones || []).join(", ")} | ${(currentContact.emails || []).join(", ")}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).catch(() => {});
  }
  document.getElementById("copyAllBtn").textContent = "✅ Copied!";
});
