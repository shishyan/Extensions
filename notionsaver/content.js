(function () {
  if (window.__notionSaverLoaded) return;
  window.__notionSaverLoaded = true;

  function convertPageToNotionMarkdown() {
    const title = (document.title || "Web Article").replace(/"/g, "'");
    const url = location.href;
    const dateStr = new Date().toISOString().slice(0, 10);

    const yaml = [
      "---",
      `title: "${title}"`,
      `source: "${url}"`,
      `clipped_at: "${dateStr}"`,
      `tags: ["notion-clip", "knowledge-base"]`,
      "---",
      "",
      `> 💡 **Notion Callout**: Clipped from [${location.hostname || "web"}](${url}) on ${dateStr}`,
      ""
    ];

    const nodes = Array.from(document.querySelectorAll("h1, h2, h3, p, blockquote, pre"));
    nodes.slice(0, 25).forEach((el) => {
      const txt = (el.innerText || "").trim();
      if (!txt) return;
      if (el.tagName === "H1") yaml.push(`# ${txt}\n`);
      else if (el.tagName === "H2") yaml.push(`## ${txt}\n`);
      else if (el.tagName === "H3") yaml.push(`### ${txt}\n`);
      else if (el.tagName === "BLOCKQUOTE") yaml.push(`> ${txt}\n`);
      else if (el.tagName === "PRE") yaml.push("```\n" + txt + "\n```\n");
      else yaml.push(`${txt}\n`);
    });

    const markdown = yaml.join("\n");
    return {
      title,
      url,
      blockCount: nodes.length,
      hasYamlFrontmatter: markdown.startsWith("---"),
      markdown
    };
  }

  function injectBar() {
    if (document.getElementById("notionsaver-bar")) return;
    const clip = convertPageToNotionMarkdown();
    const bar = document.createElement("div");
    bar.id = "notionsaver-bar";
    bar.innerHTML = `
      <span>📓 <strong>NotionSaver Pro</strong> — Ready to clip ${clip.blockCount} blocks with YAML Frontmatter</span>
      <button class="ns-btn" id="ns-clip-btn">📋 Copy Notion Markdown</button>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(bar);

    bar.querySelector("#ns-clip-btn").addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clip.markdown).catch(() => {});
      }
      bar.querySelector("#ns-clip-btn").textContent = "✅ Clipped to Notion MD!";
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "NOTION_CLIP_PAGE") {
      sendResponse(convertPageToNotionMarkdown());
      return true;
    }
  });

  injectBar();
})();
