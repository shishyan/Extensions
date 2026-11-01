let allHighlights = [];

function renderList(items) {
  allHighlights = Array.isArray(items) ? items : [];
  const countSpan = document.getElementById("countSpan");
  const notesSpan = document.getElementById("notesSpan");
  const listEl = document.getElementById("list");

  const noteCount = allHighlights.filter((i) => i.note && i.note.trim().length > 0).length;
  countSpan.textContent = `📌 Highlights: ${allHighlights.length}`;
  notesSpan.textContent = `📝 Notes: ${noteCount}`;

  if (allHighlights.length === 0) {
    listEl.innerHTML = `<div style="color:#94a3b8;padding:8px;">No highlights saved yet. Select text on any webpage to use the 4-color floating highlighter palette!</div>`;
    return;
  }

  listEl.innerHTML = allHighlights
    .map(
      (it) => `
      <div class="hl-card" data-color="${it.color || "yellow"}">
        <div class="hl-quote">"${it.text}"</div>
        ${it.note ? `<div class="hl-note">💡 Note: ${it.note}</div>` : ""}
        <div class="hl-meta">
          <span>${(it.title || "Web Article").slice(0, 34)}</span>
          <span>${(it.color || "yellow").toUpperCase()}</span>
        </div>
      </div>
    `
    )
    .join("");
}

function buildMarkdownDigest() {
  if (!allHighlights.length) {
    return "# 🖍️ GlaspNotes Knowledge Digest\n\nNo highlights recorded yet.";
  }
  const lines = ["# 🖍️ GlaspNotes Knowledge Digest", `Exported: ${new Date().toISOString()}`, ""];
  allHighlights.forEach((it, idx) => {
    lines.push(`### ${idx + 1}. ${it.title || "Web Highlight"} (${(it.color || "yellow").toUpperCase()})`);
    lines.push(`- **Source**: ${it.url || ""}`);
    lines.push(`> "${it.text}"`);
    if (it.note) {
      lines.push(`- **Margin Note**: ${it.note}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["glaspnotes_items"], (res) => {
    renderList(res.glaspnotes_items || []);
  });
} else {
  renderList([]);
}

document.getElementById("copyMdBtn").addEventListener("click", () => {
  const md = buildMarkdownDigest();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("copyMdBtn").textContent = "✅ Digest Copied!";
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const md = buildMarkdownDigest();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "glaspnotes-digest.md";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("exportMdBtn").textContent = "✅ Exported!";
});
