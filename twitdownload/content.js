(function () {
  if (window.__twitDownloadLoaded) return;
  window.__twitDownloadLoaded = true;

  function extractThreadAndMedia() {
    const posts = Array.from(document.querySelectorAll("article, [data-testid='tweet'], .Post, p"))
      .map((el) => (el.innerText || "").trim())
      .filter((t) => t.length > 20)
      .slice(0, 15);

    const mediaUrls = [];
    document.querySelectorAll("img[src], video[src], video source[src]").forEach((el) => {
      const src = el.getAttribute("src") || "";
      if (src && !src.startsWith("data:")) {
        let hiRes = src;
        if (hiRes.includes("pbs.twimg.com/media") && !hiRes.includes("name=orig")) {
          hiRes = hiRes.replace(/name=[a-z0-9_]+/i, "name=orig");
        }
        if (!mediaUrls.includes(hiRes)) mediaUrls.push(hiRes);
      }
    });

    const markdown =
      `# 🧵 Unrolled Thread: ${document.title || location.hostname}\nSource: ${location.href}\nExported: ${new Date().toISOString()}\n\n` +
      posts.map((p, i) => `### Post ${i + 1}\n${p}\n`).join("\n") +
      (mediaUrls.length ? `\n## 📥 Harvested Media (${mediaUrls.length})\n` + mediaUrls.map((u) => `- ${u}`).join("\n") : "");

    return {
      title: document.title || "Social Thread",
      url: location.href,
      postCount: posts.length,
      posts,
      mediaUrls,
      markdown
    };
  }

  function injectPostControls() {
    const targets = document.querySelectorAll("article, [data-testid='tweet']");
    targets.forEach((art) => {
      if (art.querySelector(".twitdownload-action-bar")) return;
      const bar = document.createElement("div");
      bar.className = "twitdownload-action-bar";
      bar.innerHTML = `
        <button class="td-btn td-unroll-btn">🧵 Unroll Thread / Save MD</button>
        <button class="td-btn sec td-media-btn">📥 Save Media</button>
      `;
      art.appendChild(bar);

      bar.querySelector(".td-unroll-btn").addEventListener("click", (e) => {
        e.preventDefault();
        const data = extractThreadAndMedia();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(data.markdown).catch(() => {});
        }
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ twitdownload_last: data });
        }
        bar.querySelector(".td-unroll-btn").textContent = `✅ Unrolled (${data.postCount} posts)!`;
      });

      bar.querySelector(".td-media-btn").addEventListener("click", (e) => {
        e.preventDefault();
        const data = extractThreadAndMedia();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(data.mediaUrls.join("\n") || data.url).catch(() => {});
        }
        bar.querySelector(".td-media-btn").textContent = `✅ Media Copied (${data.mediaUrls.length})!`;
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "TWIT_EXTRACT_THREAD") {
      injectPostControls();
      const data = extractThreadAndMedia();
      sendResponse(data);
      return true;
    }
  });

  injectPostControls();
})();
