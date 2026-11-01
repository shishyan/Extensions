document.addEventListener("DOMContentLoaded", () => {
  const fallbackData = {
    author: "Lovelace, Ada",
    title: "Distributed Agentic Systems and Semantic Citation Graphs",
    year: "2026",
    siteName: "Transactions on Computational Knowledge",
    url: "https://gurukuladesam.org/research/semantic-citations",
    styles: {
      "APA 7th": "Lovelace, A. (2026). Distributed Agentic Systems and Semantic Citation Graphs. Transactions on Computational Knowledge. https://gurukuladesam.org/research/semantic-citations",
      "MLA 9th": "Lovelace, Ada. \"Distributed Agentic Systems and Semantic Citation Graphs.\" Transactions on Computational Knowledge, 2026, https://gurukuladesam.org/research/semantic-citations. Accessed November 1, 2026.",
      "Chicago 17th": "Lovelace, Ada. \"Distributed Agentic Systems and Semantic Citation Graphs.\" Transactions on Computational Knowledge. Published 2026. https://gurukuladesam.org/research/semantic-citations.",
      "IEEE": "[1] A. Lovelace, \"Distributed Agentic Systems and Semantic Citation Graphs,\" Transactions on Computational Knowledge, 2026. [Online]. Available: https://gurukuladesam.org/research/semantic-citations.",
      "Harvard": "Lovelace, A. (2026) 'Distributed Agentic Systems and Semantic Citation Graphs', Transactions on Computational Knowledge. Available at: https://gurukuladesam.org/research/semantic-citations (Accessed: 1 November 2026)."
    },
    bibtex: "@misc{lovelace2026,\n  author = {Lovelace, Ada},\n  title = {Distributed Agentic Systems and Semantic Citation Graphs},\n  year = {2026},\n  howpublished = {\\url{https://gurukuladesam.org/research/semantic-citations}}\n}",
    ris: "TY  - ELEC\nAU  - Lovelace, Ada\nTI  - Distributed Agentic Systems and Semantic Citation Graphs\nPY  - 2026\nT2  - Transactions on Computational Knowledge\nUR  - https://gurukuladesam.org/research/semantic-citations\nER  -"
  };

  let currentData = fallbackData;
  let activeStyle = "APA 7th";

  const metaAuthor = document.getElementById("metaAuthor");
  const metaSite = document.getElementById("metaSite");
  const metaTitle = document.getElementById("metaTitle");
  const yearBadge = document.getElementById("yearBadge");
  const citationOutput = document.getElementById("citationOutput");
  const exportOutput = document.getElementById("exportOutput");
  const statusMsg = document.getElementById("statusMsg");

  function render() {
    metaAuthor.textContent = currentData.author;
    metaSite.textContent = currentData.siteName;
    metaTitle.textContent = currentData.title;
    yearBadge.textContent = currentData.year;
    citationOutput.value = currentData.styles[activeStyle] || currentData.styles["APA 7th"];
    exportOutput.value = currentData.bibtex;
  }

  render();

  document.querySelectorAll(".style-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".style-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeStyle = btn.getAttribute("data-style") || "APA 7th";
      render();
    });
  });

  document.getElementById("copyStyleBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(citationOutput.value).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied " + activeStyle + " citation to clipboard!";
  });

  document.getElementById("copyBibtexBtn").addEventListener("click", () => {
    exportOutput.value = currentData.bibtex;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentData.bibtex).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied BibTeX (.bib) entry!";
  });

  document.getElementById("copyRisBtn").addEventListener("click", () => {
    exportOutput.value = currentData.ris;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentData.ris).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied RIS (.ris) citation record!";
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "ZOTEROCITE_EXTRACT" }, (res) => {
          if (res && res.ok && res.data) {
            currentData = res.data;
            render();
          }
        });
      }
    });
  }
});
