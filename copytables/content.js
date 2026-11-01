(() => {
  if (document.getElementById("copytables-bar")) return;

  function parseTableMatrix(tableEl) {
    const rows = Array.from(tableEl.querySelectorAll("tr, [role='row']"));
    return rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("th, td, [role='columnheader'], [role='cell'], [role='gridcell']"));
      return cells.map((c) => (c.textContent || "").trim().replace(/\s+/g, " "));
    }).filter(r => r.length > 0);
  }

  function toCsv(matrix, sep = ",") {
    return matrix.map((row) =>
      row.map((val) => {
        if (val.includes(sep) || val.includes('"') || val.includes("\n")) {
          return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(sep)
    ).join("\n");
  }

  function toMarkdown(matrix) {
    if (!matrix.length) return "";
    const head = matrix[0];
    const divider = head.map(() => "---");
    const body = matrix.slice(1);
    const fmtRow = (r) => "| " + r.join(" | ") + " |";
    return [fmtRow(head), fmtRow(divider), ...body.map(fmtRow)].join("\n");
  }

  function toJson(matrix) {
    if (matrix.length < 2) return JSON.stringify(matrix, null, 2);
    const headers = matrix[0];
    const items = matrix.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h || `col_${i + 1}`] = row[i] !== undefined ? row[i] : "";
      });
      return obj;
    });
    return JSON.stringify(items, null, 2);
  }

  function scanAllTables() {
    const tables = Array.from(document.querySelectorAll("table, [role='table'], [role='grid']"));
    return tables.map((el, idx) => {
      const matrix = parseTableMatrix(el);
      const rows = matrix.length;
      const cols = rows ? Math.max(...matrix.map(r => r.length)) : 0;
      return {
        index: idx + 1,
        rows,
        cols,
        csv: toCsv(matrix, ","),
        tsv: toCsv(matrix, "\t"),
        markdown: toMarkdown(matrix),
        json: toJson(matrix)
      };
    });
  }

  const all = scanAllTables();
  const bar = document.createElement("div");
  bar.id = "copytables-bar";
  bar.innerHTML = `
    <span class="ctb-title">📊 Copy Table: CSV • TSV • Markdown • JSON (${all.length} Found)</span>
    <button type="button" data-fmt="csv">CSV</button>
    <button type="button" data-fmt="tsv">TSV</button>
    <button type="button" data-fmt="markdown">Markdown</button>
    <button type="button" data-fmt="json">JSON</button>
  `;
  document.body.appendChild(bar);

  bar.querySelectorAll("button[data-fmt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.getAttribute("data-fmt");
      const fresh = scanAllTables();
      if (fresh.length) {
        const out = fresh[0][fmt] || fresh[0].csv;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(out).catch(() => {});
        }
      }
      const orig = btn.textContent;
      btn.textContent = "✓ Copied";
      setTimeout(() => {
        btn.textContent = orig;
      }, 1400);
    });
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "COPYTABLES_LIST") {
      const list = scanAllTables();
      sendResponse({ ok: true, count: list.length, tables: list });
      return true;
    }
  });
})();
