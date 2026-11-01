document.addEventListener("DOMContentLoaded", () => {
  let tables = [
    {
      index: 1,
      rows: 3,
      cols: 3,
      csv: "Metric,Q3,Q4\nRevenue,$120K,$185K\nGrowth,18%,34%",
      tsv: "Metric\tQ3\tQ4\nRevenue\t$120K\t$185K\nGrowth\t18%\t34%",
      markdown: "| Metric | Q3 | Q4 |\n| --- | --- | --- |\n| Revenue | $120K | $185K |\n| Growth | 18% | 34% |",
      json: JSON.stringify([{ Metric: "Revenue", Q3: "$120K", Q4: "$185K" }, { Metric: "Growth", Q3: "18%", Q4: "34%" }], null, 2)
    }
  ];

  let activeFormat = "markdown";
  const tableCountBadge = document.getElementById("tableCountBadge");
  const tableSelect = document.getElementById("tableSelect");
  const tableOutput = document.getElementById("tableOutput");
  const statusMsg = document.getElementById("statusMsg");

  function render() {
    tableCountBadge.textContent = `${tables.length} Table(s)`;
    tableSelect.innerHTML = tables.map((t, i) => `<option value="${i}">Table #${t.index} (${t.rows} rows × ${t.cols} cols)</option>`).join("");
    const idx = Number(tableSelect.value) || 0;
    const current = tables[idx] || tables[0];
    tableOutput.value = current ? current[activeFormat] : "";
  }

  render();
  tableSelect.addEventListener("change", () => {
    const idx = Number(tableSelect.value) || 0;
    const current = tables[idx] || tables[0];
    tableOutput.value = current ? current[activeFormat] : "";
  });

  document.querySelectorAll("button[data-fmt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFormat = btn.getAttribute("data-fmt") || "csv";
      const idx = Number(tableSelect.value) || 0;
      const current = tables[idx] || tables[0];
      if (current) {
        const content = current[activeFormat];
        tableOutput.value = content;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(content).catch(() => {});
        }
        const extMap = { csv: "csv", tsv: "tsv", markdown: "md", json: "json" };
        try {
          const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `table-${current.index}.${extMap[activeFormat] || "txt"}`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (_) {}
        statusMsg.textContent = `✓ Copied & Exported Table #${current.index} as ${activeFormat.toUpperCase()}!`;
      }
    });
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "COPYTABLES_LIST" }, (res) => {
          if (res && res.ok && Array.isArray(res.tables) && res.tables.length) {
            tables = res.tables;
            render();
          }
        });
      }
    });
  }
});
