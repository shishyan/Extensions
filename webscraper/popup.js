document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("ws-output");
  let extractedRows = [
    { index: 1, type: "table-row", values: ["Product A", "$29.00"] },
    { index: 2, type: "table-row", values: ["Product B", "$49.00"] }
  ];

  function downloadFile(content, filename, mime) {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
  }

  function toCSV(rows) {
    const header = "index,type,col1,col2";
    const lines = rows.map((r) => {
      const c1 = (r.values[0] || "").replace(/"/g, '""');
      const c2 = (r.values[1] || "").replace(/"/g, '""');
      return `${r.index},"${r.type}","${c1}","${c2}"`;
    });
    return [header, ...lines].join("\n");
  }

  function toMarkdown(rows) {
    const head = "| # | Type | Column 1 | Column 2 |\n|---|---|---|---|";
    const body = rows.map(
      (r) => `| ${r.index} | ${r.type} | ${r.values[0] || ""} | ${r.values[1] || ""} |`
    );
    return [head, ...body].join("\n");
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "WEBSCRAPER_EXTRACT" }, (res) => {
        if (!chrome.runtime.lastError && res && res.rows && res.rows.length) {
          extractedRows = res.rows;
        }
        out.textContent = JSON.stringify(extractedRows, null, 2);
      });
    } else {
      out.textContent = JSON.stringify(extractedRows, null, 2);
    }
  });

  document.getElementById("ws-csv").addEventListener("click", () => {
    const csv = toCSV(extractedRows);
    if (navigator.clipboard) navigator.clipboard.writeText(csv).catch(() => {});
    downloadFile(csv, "webscraper-data.csv", "text/csv;charset=utf-8");
    out.textContent = csv;
  });

  document.getElementById("ws-json").addEventListener("click", () => {
    const json = JSON.stringify(extractedRows, null, 2);
    if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
    downloadFile(json, "webscraper-data.json", "application/json");
    out.textContent = json;
  });

  document.getElementById("ws-md").addEventListener("click", () => {
    const md = toMarkdown(extractedRows);
    if (navigator.clipboard) navigator.clipboard.writeText(md).catch(() => {});
    out.textContent = md;
  });
});
