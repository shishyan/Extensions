document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("ec-list");
  let allClips = [];

  function renderClips(clips) {
    allClips = clips || [];
    const lines = allClips.map(
      (c, idx) =>
        `[${idx + 1}] [${c.notebook} · ${c.mode}] ${c.title}\nURL: ${c.url}\n${c.excerpt}\n`
    );
    listEl.textContent = lines.join("\n---\n") || "No clips saved yet.";
  }

  function loadStorage() {
    chrome.storage.local.get(["everclipper_clips"], (res) => {
      renderClips(res.everclipper_clips || []);
    });
  }

  loadStorage();

  document.getElementById("ec-clip-btn").addEventListener("click", () => {
    const mode = document.getElementById("ec-mode").value;
    const notebook = document.getElementById("ec-notebook").value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "EVERCLIPPER_CLIP_NOW", mode, notebook },
          () => {
            setTimeout(loadStorage, 150);
          }
        );
      }
    });
  });

  document.getElementById("ec-export-md").addEventListener("click", () => {
    const md = allClips
      .map(
        (c) =>
          `## ${c.title}\n- **Notebook**: ${c.notebook}\n- **Mode**: ${c.mode}\n- **URL**: ${c.url}\n\n${c.excerpt}\n`
      )
      .join("\n---\n\n");
    if (navigator.clipboard) navigator.clipboard.writeText(md).catch(() => {});
    listEl.textContent = md;
  });

  document.getElementById("ec-export-html").addEventListener("click", () => {
    const html =
      "<!DOCTYPE html><html><body>" +
      allClips
        .map(
          (c) =>
            `<article><h2>${c.title}</h2><p><em>${c.notebook} | ${c.mode}</em> — <a href="${c.url}">${c.url}</a></p><p>${c.excerpt}</p></article><hr/>`
        )
        .join("") +
      "</body></html>";
    if (navigator.clipboard) navigator.clipboard.writeText(html).catch(() => {});
    listEl.textContent = html;
  });
});
