document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("rb-output");
  const searchInput = document.getElementById("rb-search");
  let bookmarks = [];

  function render(filterText) {
    const q = (filterText || "").toLowerCase();
    const list = bookmarks.filter(
      (b) =>
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.tags || []).join(" ").toLowerCase().includes(q)
    );
    out.textContent =
      list
        .map((b, i) => `${i + 1}. ${b.title}\n   ${b.url}\n   Tags: ${(b.tags || []).join(" ")}`)
        .join("\n\n") || "No matching bookmarks.";
  }

  function load() {
    chrome.storage.local.get(["rainbookmark_items"], (res) => {
      bookmarks = res.rainbookmark_items || [];
      render(searchInput.value);
    });
  }

  load();

  searchInput.addEventListener("input", () => render(searchInput.value));

  document.getElementById("rb-add").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RAINBOOKMARK_SAVE_ACTIVE" }, () => {
          setTimeout(load, 150);
        });
      }
    });
  });

  document.getElementById("rb-html").addEventListener("click", () => {
    const lines = [
      "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
      "<TITLE>Bookmarks</TITLE>",
      "<H1>RainBookmark Export</H1>",
      "<DL><p>",
      ...bookmarks.map(
        (b) =>
          `    <DT><A HREF="${b.url}" ADD_DATE="${b.createdAt || 1700000000}" TAGS="${(b.tags || []).join(",")}">${b.title}</A>`
      ),
      "</DL><p>"
    ];
    const html = lines.join("\n");
    if (navigator.clipboard) navigator.clipboard.writeText(html).catch(() => {});
    out.textContent = html;
  });

  document.getElementById("rb-json").addEventListener("click", () => {
    const json = JSON.stringify(bookmarks, null, 2);
    if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
    out.textContent = json;
  });
});
