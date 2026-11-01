document.addEventListener("DOMContentLoaded", () => {
  const sumEl = document.getElementById("ss-summary");
  const bibEl = document.getElementById("ss-bibtex");
  const styleSel = document.getElementById("ss-style-sel");
  let savedPapers = [];

  let currentReport = {
    title: "Attention Is All You Need",
    author: "Vaswani, A. et al.",
    year: "2017",
    doi: "10.48550/arXiv.1706.03762",
    arxiv: "1706.03762",
    oaUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    abstractText: "Sequence transduction model based entirely on attention mechanisms.",
    methodologyText: "Multi-head self-attention replacing recurrent and convolutional layers.",
    findingsText: "Achieves state-of-the-art BLEU scores on WMT 2014 translation tasks.",
    styles: {
      APA: "Vaswani, A. et al. (2017). Attention Is All You Need. NeurIPS. https://doi.org/10.48550/arXiv.1706.03762",
      MLA: "Vaswani, A. et al. \"Attention Is All You Need.\" NeurIPS, 2017.",
      Chicago: "Vaswani, A. et al. \"Attention Is All You Need.\" NeurIPS (2017).",
      Harvard: "Vaswani, A. et al. (2017) 'Attention Is All You Need', NeurIPS."
    },
    bibtex:
      "@article{vaswani2017attention,\n  title={Attention Is All You Need},\n  author={Vaswani, A. et al.},\n  doi={10.48550/arXiv.1706.03762},\n  year={2017}\n}"
  };

  function getActiveCitation() {
    const st = styleSel.value;
    if (st === "BibTeX") return currentReport.bibtex;
    return (currentReport.styles && currentReport.styles[st]) || currentReport.bibtex;
  }

  function render(r) {
    if (r) currentReport = Object.assign(currentReport, r);
    sumEl.innerHTML =
      `<strong>DOI:</strong> ${currentReport.doi} | <strong>arXiv:</strong> ${currentReport.arxiv}<br>` +
      `<strong>Abstract:</strong> ${currentReport.abstractText.slice(0, 100)}<br>` +
      `<strong>Methodology:</strong> ${currentReport.methodologyText.slice(0, 100)}<br>` +
      `<strong>Key Findings:</strong> ${currentReport.findingsText.slice(0, 100)}`;
    bibEl.textContent = getActiveCitation();
  }

  chrome.storage.local.get({ scispace_papers: [] }, (res) => {
    savedPapers = Array.isArray(res.scispace_papers) ? res.scispace_papers : [];
  });

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

  styleSel.addEventListener("change", () => {
    bibEl.textContent = getActiveCitation();
  });

  document.getElementById("ss-copy-bib").addEventListener("click", () => {
    const txt = getActiveCitation();
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    bibEl.textContent = "% Copied to Clipboard!\n" + txt;
  });

  document.getElementById("ss-save-lib").addEventListener("click", () => {
    savedPapers.unshift(currentReport);
    chrome.storage.local.set({ scispace_papers: savedPapers.slice(0, 40) }, () => {
      bibEl.textContent = `Saved to Library (${savedPapers.length} papers):\n` + savedPapers.map((p, i) => `${i + 1}. ${p.title} (${p.doi})`).join("\n");
    });
  });

  document.getElementById("ss-open-oa").addEventListener("click", () => {
    bibEl.textContent = `Open-Access Resolver URL:\n${currentReport.oaUrl}\n\n${getActiveCitation()}`;
  });
});
