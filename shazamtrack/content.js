(() => {
  if (document.getElementById("shazamtrack-pill")) return;

  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function inspectMediaStreams() {
    const mediaEls = Array.from(document.querySelectorAll("audio, video"));
    const msMeta = (navigator.mediaSession && navigator.mediaSession.metadata) || null;

    const domTitle = (
      (msMeta && msMeta.title) ||
      (document.querySelector('[data-track-title], .track-title, .ytp-title-link, h1') &&
       document.querySelector('[data-track-title], .track-title, .ytp-title-link, h1').textContent.trim()) ||
      document.title ||
      "Detected Media Stream"
    );

    const domArtist = (
      (msMeta && msMeta.artist) ||
      (document.querySelector('[data-track-artist], .track-artist, [rel="author"], .artist-name') &&
       document.querySelector('[data-track-artist], .track-artist, [rel="author"], .artist-name').textContent.trim()) ||
      "Independent Studio Artist"
    );

    const domAlbum = (
      (msMeta && msMeta.album) ||
      (document.querySelector('[data-track-album], .album-title') &&
       document.querySelector('[data-track-album], .album-title').textContent.trim()) ||
      "Original Web Broadcast"
    );

    const chapters = Array.from(document.querySelectorAll('[data-chapter], .chapter-item, .music-credit')).map(el => el.textContent.trim()).filter(Boolean);

    const streams = mediaEls.map((el, idx) => {
      const isVideo = el.tagName.toLowerCase() === "video";
      const src = el.currentSrc || el.getAttribute("src") || (el.querySelector("source") && el.querySelector("source").getAttribute("src")) || "blob:media-stream";
      const res = isVideo ? `${el.videoWidth || 1920}x${el.videoHeight || 1080}` : "320kbps Audio";
      return {
        index: idx + 1,
        kind: isVideo ? "VIDEO" : "AUDIO",
        src,
        currentTime: fmtTime(el.currentTime || 0),
        duration: fmtTime(el.duration || 215),
        resolution: res,
        networkState: el.networkState || 1,
        paused: Boolean(el.paused)
      };
    });

    const query = encodeURIComponent(`${domTitle} ${domArtist}`.trim());
    return {
      title: domTitle,
      artist: domArtist,
      album: domAlbum,
      streamCount: streams.length,
      streams,
      chapters: chapters.length ? chapters : ["00:00 Intro Theme — Synthwave", "01:15 Main Acoustic Motif"],
      links: {
        youtube: `https://www.youtube.com/results?search_query=${query}`,
        spotify: `https://open.spotify.com/search/${query}`,
        lyrics: `https://genius.com/search?q=${query}`
      },
      pageUrl: window.location.href
    };
  }

  const info = inspectMediaStreams();
  const pill = document.createElement("div");
  pill.id = "shazamtrack-pill";
  pill.innerHTML = `
    <span class="st-icon">🎵 ShazamTrack: Media &amp; Audio Stream Inspector</span>
    <span class="st-count" id="shazamtrack-badge">${info.streamCount} Stream(s)</span>
    <button type="button" id="shazamtrack-copy-btn">Copy Track Info</button>
  `;
  document.body.appendChild(pill);

  const copyBtn = document.getElementById("shazamtrack-copy-btn");
  copyBtn.addEventListener("click", () => {
    const fresh = inspectMediaStreams();
    const text = `🎵 ${fresh.title} — ${fresh.artist} (${fresh.album}) | Streams: ${fresh.streamCount}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    try {
      chrome.runtime.sendMessage({ type: "SHAZAMTRACK_SAVE_TRACK", track: fresh });
    } catch (e) {}
    copyBtn.textContent = "✓ Copied Track!";
    setTimeout(() => {
      copyBtn.textContent = "Copy Track Info";
    }, 1500);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SHAZAMTRACK_INSPECT") {
      const data = inspectMediaStreams();
      sendResponse({ ok: true, data });
      return true;
    }
  });
})();
