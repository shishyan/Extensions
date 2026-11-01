(function () {
  if (window.__refGitHubLoaded) return;
  window.__refGitHubLoaded = true;

  function enhanceCodeBlocks() {
    const blocks = Array.from(document.querySelectorAll("pre"));
    let totalLines = 0;
    const snippets = [];

    blocks.forEach((pre, idx) => {
      const codeText = (pre.innerText || "").trim();
      if (!codeText) return;
      const lines = codeText.split("\n").length;
      totalLines += lines;
      snippets.push(codeText);

      if (!pre.previousElementSibling || !pre.previousElementSibling.classList.contains("refgithub-copy-btn")) {
        const btn = document.createElement("button");
        btn.className = "refgithub-copy-btn";
        btn.textContent = `📋 Copy Snippet #${idx + 1} (${lines}L)`;
        btn.addEventListener("click", () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeText).catch(() => {});
          }
          btn.textContent = `✅ Copied (${lines}L)!`;
        });
        pre.insertAdjacentElement("beforebegin", btn);
      }
    });

    return {
      snippetCount: snippets.length,
      totalLines,
      snippets
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "REFGITHUB_SCAN_SNIPPETS") {
      sendResponse(enhanceCodeBlocks());
      return true;
    }
  });

  enhanceCodeBlocks();
})();
