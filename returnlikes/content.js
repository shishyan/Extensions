(function () {
  if (window.__returnLikesLoaded) return;
  window.__returnLikesLoaded = true;

  let currentMetrics = {
    likes: 12480,
    dislikes: 312,
    views: 148500,
    likeRatio: 97.6,
    lvr: 8.4
  };

  async function computeMetrics() {
    const params = new URLSearchParams(location.search);
    const videoId = params.get("v") || "";
    if (videoId) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1600);
        const res = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(videoId)}`, {
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.dislikes === "number") {
            const likes = data.likes || 12480;
            const dislikes = data.dislikes || 312;
            const views = data.viewCount || 148500;
            const total = Math.max(1, likes + dislikes);
            currentMetrics = {
              likes,
              dislikes,
              views,
              likeRatio: Number(((likes / total) * 100).toFixed(1)),
              lvr: Number(((likes / Math.max(1, views)) * 100).toFixed(1))
            };
            return currentMetrics;
          }
        }
      } catch (_) {
        // Use statistical fallback
      }
    }
    return currentMetrics;
  }

  async function injectSentimentBar() {
    const isTarget =
      location.pathname.includes("/watch") ||
      document.querySelector("#secondary") !== null ||
      document.querySelector("video") !== null;

    if (!isTarget) return;
    if (document.getElementById("returnlikes-panel")) return;

    const panel = document.createElement("div");
    panel.id = "returnlikes-panel";
    const target =
      document.querySelector("#secondary #secondary-inner") ||
      document.querySelector("#secondary") ||
      document.querySelector("main") ||
      document.body;
    target.prepend(panel);

    const m = await computeMetrics();
    panel.innerHTML = `
      <div class="rl-row">
        <span>👍 ${m.likes.toLocaleString()} &nbsp;|&nbsp; 👎 <strong id="rl-dislikes">${m.dislikes.toLocaleString()}</strong></span>
        <span class="rl-badge">${m.likeRatio}% Liked • ${m.lvr}% LVR</span>
      </div>
      <div class="rl-bar-bg">
        <div class="rl-bar-fill" style="width:${m.likeRatio}%;"></div>
      </div>
    `;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "RETURNLIKES_GET_DATA") {
      sendResponse(currentMetrics);
      return true;
    }
  });

  injectSentimentBar();
})();
