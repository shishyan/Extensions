document.addEventListener("DOMContentLoaded", () => {
  const sumEl = document.getElementById("ss-summary");
  const bibEl = document.getElementById("ss-bibtex");
  let currentReport = {
    title: "Attention Is All You Need",
    doi: "10.48550/arXiv.1706.03762",
    arxiv: "1706.03762",
    oaUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    abstractText: "Sequence transduction model based entirely on attention mechanisms.",
    methodologyText: "Multi-head self-attention replacing recurrent and convolutional layers.",
    findingsText: "Achieves state-of-the-art BLEU scores on WMT 2014 translation tasks.",
    bibtex:
      "@article{vaswani2017attention,\n  title={Attention Is All You Need},\n  doi={10.48550/arXiv.1706.03762},\n  year={2017}\n}"
  };

  function render(r) {
    if (r) currentReport = r;
    sumEl.innerHTML =
      `<strong>DOI:</strong> ${currentReport.doi} | <strong>arXiv:</strong> ${currentReport.arxiv}<br>` +
      `<strong>Abstract:</strong> ${currentReport.abstractText.slice(0, 110)}<br>` +
      `<strong>Methodology:</strong> ${currentReport.methodologyText.slice(0, 110)}<br>` +
      `<strong>Key Findings:</strong> ${currentReport.findingsText.slice(0, 110)}`;
    bibEl.textContent = currentReport.bibtex;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SCISPACE_ANALYZE" }, (res) => {
        if (!chrome.runtime.lastError && res && res.report) render(res.report);
        else render(currentReport);
      });
    } else {
      render(currentReport);
    }
  });

  document.getElementById("ss-copy-bib").addEventListener("click", () => {
    if (navigator.clipboard) navigator.clipboard.writeText(currentReport.bibtex).catch(() => {});
    bibEl.textContent = "% Copied to Clipboard!\n" + currentReport.bibtex;
  });

  document.getElementById("ss-open-oa").addEventListener("click", () => {
    bibEl.textContent = `Open-Access Resolver URL:\n${currentReport.oaUrl}\n\n${currentReport.bibtex}`;
  });
});
