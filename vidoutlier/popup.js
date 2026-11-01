document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("kw-input");
  const searchBtn = document.getElementById("search-btn");
  const tbody = document.getElementById("kw-tbody");
  const overallEl = document.getElementById("overall-score");
  const demandEl = document.getElementById("demand-score");
  const compEl = document.getElementById("comp-score");
  const copyAllBtn = document.getElementById("copy-all-btn");
  const statusMsg = document.getElementById("status-msg");

  let latestKeywords = [];

  function runSearch() {
    const query = input.value.trim();
    if (!query) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Analyzing live YouTube autocomplete...</td></tr>`;

    chrome.runtime.sendMessage({ type: "TUBEIQ_KEYWORD_RESEARCH", query }, (resp) => {
      if (!resp || !resp.ok || !resp.data) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;">Failed to load suggestions.</td></tr>`;
        return;
      }
      const { overallScore, avgDemand, avgCompetition, suggestions } = resp.data;
      latestKeywords = suggestions.map((s) => s.keyword);

      overallEl.textContent = `${overallScore}/100`;
      demandEl.textContent = `${avgDemand}/100`;
      compEl.textContent = `${avgCompetition}/100`;

      if (!suggestions.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">No suggestions found.</td></tr>`;
        return;
      }

      tbody.innerHTML = suggestions
        .map(
          (s) => `
        <tr class="kw-row" data-kw="${s.keyword.replace(/"/g, "&quot;")}">
          <td>${s.keyword}</td>
          <td style="color:#38bdf8;font-weight:700;">${s.demand}</td>
          <td style="color:#f59e0b;">${s.competition}</td>
          <td style="color:#10b981;font-weight:700;">${s.opportunity}</td>
        </tr>
      `
        )
        .join("");

      tbody.querySelectorAll(".kw-row").forEach((row) => {
        row.addEventListener("click", () => {
          const kw = row.getAttribute("data-kw");
          navigator.clipboard.writeText(kw);
          statusMsg.textContent = `Copied: "${kw}"`;
        });
      });
    });
  }

  searchBtn.addEventListener("click", runSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });

  copyAllBtn.addEventListener("click", () => {
    if (!latestKeywords.length) return;
    navigator.clipboard.writeText(latestKeywords.slice(0, 15).join(", "));
    copyAllBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyAllBtn.textContent = "Copy Top 15 Tags"), 1800);
  });

  runSearch();
});
