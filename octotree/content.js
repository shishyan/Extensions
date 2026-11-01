(function () {
  if (window.__octoTreeLoaded) return;
  window.__octoTreeLoaded = true;

  function buildTreeItems(filterQuery = "") {
    const items = [];
    const seen = new Set();
    const selectors = ".react-directory-row a, .js-navigation-open, a[href*='/blob/'], a[href*='/tree/'], h1, h2, h3";
    document.querySelectorAll(selectors).forEach((el) => {
      const label = (el.innerText || el.textContent || "").trim().slice(0, 64);
      if (!label || seen.has(label)) return;
      if (filterQuery && !label.toLowerCase().includes(filterQuery.toLowerCase())) return;
      seen.add(label);
      const isHeading = /^H[1-3]$/.test(el.tagName);
      const href = el.getAttribute("href") || "#";
      const isFolder = href.includes("/tree/");
      items.push({
        label,
        type: isHeading ? "section" : isFolder ? "folder" : "file",
        href
      });
    });
    return items.slice(0, 45);
  }

  function renderTreeRows(items) {
    return items
      .map(
        (it) => `
        <a class="ot-item" href="${it.href}" style="display:block;padding:4px 6px;color:#e2e8f0;text-decoration:none;font-size:11.5px;border-bottom:1px solid rgba(255,255,255,0.05);">
          ${it.type === "folder" ? "📁" : it.type === "file" ? "📄" : "📑"} ${it.label}
        </a>
      `
      )
      .join("");
  }

  function injectSidebar() {
    if (document.getElementById("octotree-sidebar")) return;
    const list = buildTreeItems();
    const sb = document.createElement("div");
    sb.id = "octotree-sidebar";
    sb.innerHTML = `
      <div class="ot-head" style="display:flex;justify-content:space-between;align-items:center;">
        <span>🐙 OctoTree (<span id="ot-count">${list.length}</span>)</span>
        <button id="ot-collapse-btn" style="background:transparent;border:1px solid #475569;color:#93c5fd;border-radius:4px;padding:1px 6px;font-size:10px;cursor:pointer;">◀ Toggle</button>
      </div>
      <div id="ot-body-wrap">
        <input id="ot-filter-inp" placeholder="🔍 Filter files/headings..." style="width:100%;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:4px;padding:4px 6px;font-size:11px;margin:6px 0;" />
        <div id="ot-tree-list">${renderTreeRows(list)}</div>
      </div>
    `;
    document.body.appendChild(sb);

    const bodyWrap = sb.querySelector("#ot-body-wrap");
    sb.querySelector("#ot-collapse-btn").addEventListener("click", () => {
      const hidden = bodyWrap.style.display === "none";
      bodyWrap.style.display = hidden ? "block" : "none";
    });

    sb.querySelector("#ot-filter-inp").addEventListener("input", (e) => {
      const q = e.target.value || "";
      const filtered = buildTreeItems(q);
      sb.querySelector("#ot-count").textContent = String(filtered.length);
      sb.querySelector("#ot-tree-list").innerHTML = renderTreeRows(filtered);
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "OCTOTREE_GET_TREE") {
      const items = buildTreeItems(msg.query || "");
      sendResponse({ ok: true, count: items.length, items });
      return true;
    }
  });

  injectSidebar();
})();
