let lastAudit = null;

function runAudit() {
  const targets = document.getElementById("targetKws").value || "";
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SURFSEO_AUDIT", targets }, (res) => {
          if (chrome.runtime.lastError || !res) return;
          lastAudit = res;
          document.getElementById("scoreVal").textContent = res.score + "/100";
          document.getElementById("wordsVal").textContent = res.wordCount;
          document.getElementById("headsVal").textContent = `${res.h1}/${res.h2}/${res.h3}`;
          document.getElementById("linksVal").textContent = `${res.internalLinks}/${res.externalLinks}`;

          let targetHtml = "";
          if (res.targetAudit && res.targetAudit.length) {
            targetHtml = "<div style='margin-top:6px;padding-top:6px;border-top:1px solid #334155;'><strong>Target Keyword Gap Check:</strong><br/>" +
              res.targetAudit.map((t) =>
                `<span class="term" style="color:${t.count > 0 ? '#34d399' : '#f87171'};">${t.kw}: ${t.count}x ${t.inTitle ? '(Title✓)' : '(No Title)'} ${t.inH1 ? '(H1✓)' : ''}</span>`
              ).join("") + "</div>";
          }

          document.getElementById("metaBox").innerHTML = `
            <div>Title Length: <strong>${res.titleLen} chars</strong> (Ideal: 30–65)</div>
            <div>Meta Description: <strong>${res.metaLen} chars</strong> (Ideal: 110–165)</div>
            <div>Images Missing Alt: <strong style="color:${res.missingAlt > 0 ? '#f87171' : '#34d399'}">${res.missingAlt} / ${res.imgs}</strong></div>
            ${targetHtml}
          `;

          const termsHtml = [
            "<div><strong>Top NLP Terms:</strong></div>",
            ...res.topTerms.map((t) => `<span class="term">${t.term} (${t.count} • ${t.density})</span>`),
            "<div style='margin-top:4px;'><strong>2-Word & 3-Word Phrases:</strong></div>",
            ...res.topBigrams.map((t) => `<span class="term">${t.term} (${t.count}x)</span>`),
            ...(res.topTrigrams || []).map((t) => `<span class="term tri">${t.term} (${t.count}x)</span>`)
          ].join("");
          document.getElementById("termsBox").innerHTML = termsHtml || "Not enough text on page.";
        });
      }
    });
  }
}

document.getElementById("checkKwBtn").addEventListener("click", runAudit);

document.getElementById("mdBtn").addEventListener("click", () => {
  if (!lastAudit) return;
  const md = [
    `# SurfSEO Audit — ${lastAudit.title}`,
    `- **URL**: ${lastAudit.url}`,
    `- **Content Score**: ${lastAudit.score}/100`,
    `- **Word Count**: ${lastAudit.wordCount}`,
    `- **Headings**: H1: ${lastAudit.h1}, H2: ${lastAudit.h2}, H3: ${lastAudit.h3}`,
    `- **Links**: Internal: ${lastAudit.internalLinks}, External: ${lastAudit.externalLinks}`,
    `- **Top NLP Keywords**: ${lastAudit.topTerms.map((t) => `${t.term} (${t.count})`).join(", ")}`,
    `- **Top 2/3-Word Phrases**: ${[...lastAudit.topBigrams, ...(lastAudit.topTrigrams || [])].map((t) => `${t.term} (${t.count}x)`).join(", ")}`
  ].join("\n");
  navigator.clipboard.writeText(md);
  document.getElementById("mdBtn").textContent = "✅ Markdown Copied!";
  setTimeout(() => (document.getElementById("mdBtn").textContent = "📋 Copy Markdown Report"), 1300);
});

document.getElementById("csvBtn").addEventListener("click", () => {
  if (!lastAudit) return;
  const rows = [["Type", "Phrase", "Count", "Density"]];
  lastAudit.topTerms.forEach((t) => rows.push(["1-Word", t.term, t.count, t.density]));
  lastAudit.topBigrams.forEach((t) => rows.push(["2-Word", t.term, t.count, t.density]));
  (lastAudit.topTrigrams || []).forEach((t) => rows.push(["3-Word", t.term, t.count, t.density]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "surfseo-nlp-audit.csv";
  a.click();
});

runAudit();
