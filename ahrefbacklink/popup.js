let lastAudit = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "AHREF_AUDIT" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        lastAudit = res;
        document.getElementById("drVal").textContent = res.da;
        document.getElementById("extVal").textContent = res.external;
        document.getElementById("dfVal").textContent = res.dofollow;
        document.getElementById("nfVal").textContent = res.nofollow;

        document.getElementById("linkTable").innerHTML = (res.linkRows || [])
          .map((l) => `<div class="item"><span style="max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><strong>${l.anchor}</strong> → ${l.href}</span><span style="color:${l.rel === 'nofollow' ? '#f87171' : '#34d399'};font-size:9.5px;font-weight:700;">${l.type}•${l.rel}</span></div>`)
          .join("") || "No links detected.";
      });
    }
  });
}

document.getElementById("csvBtn").addEventListener("click", () => {
  if (!lastAudit) return;
  const rows = [["Anchor Text", "Target URL", "Link Type", "Rel Attribute"]];
  (lastAudit.linkRows || []).forEach((l) => rows.push([l.anchor, l.href, l.type, l.rel]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `ahrefbacklink-${lastAudit.domain}.csv`;
  a.click();
});

document.getElementById("mdBtn").addEventListener("click", () => {
  if (!lastAudit) return;
  const txt = (lastAudit.linkRows || []).map((l) => `- [${l.anchor}](${l.href}) (${l.type}, ${l.rel})`).join("\n");
  navigator.clipboard.writeText(txt);
  document.getElementById("mdBtn").textContent = "✅ Copied!";
  setTimeout(() => (document.getElementById("mdBtn").textContent = "📋 Copy Anchor Report"), 1200);
});
