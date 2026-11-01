let rankedItems = [];
const leaderboard = document.getElementById("leaderboard");

function runSort(mode) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "SORTFEED_SORT", mode }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        rankedItems = res.items || [];
        leaderboard.innerHTML = rankedItems
          .map(
            (r) => `
            <div class="row-item">
              <span><strong>#${r.rank}</strong> ${r.title.slice(0, 44)}</span>
              <span style="color:#fb923c;font-weight:700;">${r.score.toLocaleString()}</span>
            </div>`
          )
          .join("");
      } else {
        leaderboard.textContent = "Open any social or video feed to sort posts by Views, Likes, or Viral Outlier score.";
      }
    });
  });
}

document.getElementById("sortViewsBtn").addEventListener("click", () => runSort("views"));
document.getElementById("sortViralBtn").addEventListener("click", () => runSort("viral"));

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const csv = [
    "Rank,Title,Score",
    ...rankedItems.map((r) => `${r.rank},"${(r.title || "").replace(/"/g, '""')}",${r.score}`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ Copied CSV!";
});

runSort("views");
