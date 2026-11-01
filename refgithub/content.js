(function () {
  if (window.__refGitHubLoaded) return;
  window.__refGitHubLoaded = true;

  function enhanceCodeBlocks() {
    const blocks = Array.from(document.querySelectorAll("pre, .blob-wrapper, .react-code-lines"));
    let totalLines = 0;
    let totalBytes = 0;
    const snippets = [];

    blocks.forEach((pre, idx) => {
      const codeText = (pre.innerText || "").trim();
      if (!codeText) return;
      const lines = codeText.split("\n").length;
      totalLines += lines;
      totalBytes += codeText.length;
      snippets.push(codeText);

      if (!pre.previousElementSibling || !pre.previousElementSibling.classList.contains("refgithub-copy-btn")) {
        const btn = document.createElement("button");
        btn.className = "refgithub-copy-btn";
        btn.textContent = `📋 Copy Raw Snippet #${idx + 1} (${lines}L • ${(codeText.length / 1024).toFixed(1)}KB)`;
        btn.addEventListener("click", () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeText).catch(() => {});
          }
          btn.textContent = `✅ Copied Raw (${lines}L)!`;
        });
        pre.insertAdjacentElement("beforebegin", btn);
      }
    });

    const estRepoKb = Math.max(12, Math.round(totalBytes / 1024) || 48);
    return {
      snippetCount: snippets.length,
      totalLines,
      estSizeKb: estRepoKb,
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
