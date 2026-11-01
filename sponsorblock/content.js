(function () {
  if (window.__sponsorBlockLoaded) return;
  window.__sponsorBlockLoaded = true;

  let currentVideoId = null;
  let segments = [];
  let lastSkippedEnd = -1;

  function getVideoId() {
    try {
      const u = new URL(location.href);
      return u.searchParams.get("v") || "";
    } catch (_) {
      return "";
    }
  }

  function showToast(text) {
    let t = document.getElementById("sponsorblock-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "sponsorblock-toast";
      t.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#0f172a;color:#4ade80;border:1px solid #22c55e;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;font-family:system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.45);";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.display = "block";
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.display = "none"; }, 3000);
  }

  function attachVideoListener() {
    const video = document.querySelector("video");
    if (!video || video.dataset.sbAttached) return;
    video.dataset.sbAttached = "1";

    video.addEventListener("timeupdate", () => {
      const now = video.currentTime;
      for (const seg of segments) {
        if (now >= seg.start && now < seg.end - 0.3 && Math.abs(lastSkippedEnd - seg.end) > 1) {
          const saved = Math.max(1, Math.round(seg.end - now));
          lastSkippedEnd = seg.end;
          video.currentTime = seg.end;
          showToast(`⏭️ SponsorBlock skipped ${seg.category} (${saved}s saved)`);
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(["sponsorblock_saved_sec", "sponsorblock_skipped_count"], (res) => {
              chrome.storage.local.set({
                sponsorblock_saved_sec: (res.sponsorblock_saved_sec || 0) + saved,
                sponsorblock_skipped_count: (res.sponsorblock_skipped_count || 0) + 1
              });
            });
          }
          break;
        }
      }
    });
  }

  function loadSegmentsForCurrentVideo() {
    const vid = getVideoId();
    if (!vid || vid === currentVideoId) return;
    currentVideoId = vid;
    lastSkippedEnd = -1;
    chrome.runtime.sendMessage({ type: "SPONSORBLOCK_FETCH_SEGMENTS", videoId: vid }, (res) => {
      if (!chrome.runtime.lastError && res && Array.isArray(res.segments)) {
        segments = res.segments;
      } else {
        segments = [];
      }
      attachVideoListener();
    });
  }

  setInterval(() => {
    if (location.hostname.includes("youtube.com")) {
      loadSegmentsForCurrentVideo();
      attachVideoListener();
    }
  }, 1500);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SPONSORBLOCK_STATUS") {
      sendResponse({ videoId: currentVideoId || getVideoId(), segments });
      return true;
    }
    if (msg && msg.type === "SPONSORBLOCK_SKIP_NOW") {
      const v = document.querySelector("video");
      if (v) v.currentTime += Number(msg.seconds || 30);
      sendResponse({ ok: true });
      return true;
    }
  });
})();
