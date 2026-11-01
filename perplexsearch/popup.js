const queryInput = document.getElementById("queryInput");
const synthesisBox = document.getElementById("synthesisBox");
const citationsList = document.getElementById("citationsList");

function runSearch() {
  const query = queryInput.value.trim();
  if (!query) return;
  synthesisBox.textContent = "Synthesizing citations from Wikipedia & DuckDuckGo…";

  chrome.runtime.sendMessage({ type: "PERPLEX_RESEARCH", query }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      synthesisBox.textContent = res.synthesis;
      citationsList.innerHTML = (res.citations || [])
        .map(
          (c) => `
          <div class="cite-card">
            <a href="${c.url}" target="_blank" rel="noopener">[${c.num}] ${c.title}</a>
            <div>${c.snippet}</div>
          </div>`
        )
        .join("");
    }
  });
}

document.getElementById("searchBtn").addEventListener("click", runSearch);
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

runSearch();
