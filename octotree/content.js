(function () {
  if (window.__octoTreeLoaded) return;
  window.__octoTreeLoaded = true;

  function buildTreeItems() {
    const items = [];
    document.querySelectorAll("a[href*='/blob/'], a[href*='/tree/'], h1, h2, h3").forEach((el) => {
      const label = (el.innerText || "").trim().slice(0, 48);
      if (!label) return;
      const isHeading = /^H[1-3]$/.test(el.tagName);
      items.push({
        label,
        type: isHeading ? "section" : "file",
        href: el.getAttribute("href") || "#"
      });
    });
    return items.slice(0, 20);
  }

  function injectSidebar() {
    if (document.getElementById("octotree-sidebar")) return;
    const list = buildTreeItems();
    const sb = document.createElement("div");
    sb.id = "octotree-sidebar";
    sb.innerHTML = `
      <div class="ot-head">
        <span>🐙 OctoTree Explorer (${list.length})</span>
      </div>
      <div id="ot-tree-list">
        ${list
          .map(
            (it) => `
          <a class="ot-item" href="${it.href}">
            ${it.type === "file" ? "📄" : "📑"} ${it.label}
          </a>
        `
          )
          .join("")}
      </div>
    `;
    document.body.appendChild(sb);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "OCTOTREE_GET_TREE") {
      const items = buildTreeItems();
      sendResponse({ ok: true, count: items.length, items });
      return true;
    }
  });

  injectSidebar();
})();
