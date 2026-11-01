document.addEventListener("DOMContentLoaded", () => {
  let current = {
    title: "Midnight Neural Horizon",
    artist: "Aether & Pulse",
    album: "Synthesized Odyssey LP",
    streamCount: 1,
    streams: [{ index: 1, kind: "AUDIO", resolution: "320kbps Audio", currentTime: "01:12", duration: "03:45" }],
    chapters: ["00:00 Intro Theme", "01:15 Main Acoustic Motif"],
    links: {
      youtube: "https://www.youtube.com/results?search_query=Midnight+Neural+Horizon",
      spotify: "https://open.spotify.com/search/Midnight%20Neural%20Horizon",
      lyrics: "https://genius.com/search?q=Midnight+Neural+Horizon"
    }
  };

  const streamBadge = document.getElementById("streamBadge");
  const trackTitle = document.getElementById("trackTitle");
  const trackArtist = document.getElementById("trackArtist");
  const trackAlbum = document.getElementById("trackAlbum");
  const ytLink = document.getElementById("ytLink");
  const spLink = document.getElementById("spLink");
  const lyLink = document.getElementById("lyLink");
  const jsonOutput = document.getElementById("jsonOutput");
  const statusMsg = document.getElementById("statusMsg");

  function render() {
    streamBadge.textContent = `${current.streamCount} Stream(s)`;
    trackTitle.textContent = current.title;
    trackArtist.textContent = current.artist;
    trackAlbum.textContent = current.album;
    ytLink.href = current.links.youtube;
    spLink.href = current.links.spotify;
    lyLink.href = current.links.lyrics;
    jsonOutput.value = JSON.stringify(current, null, 2);
  }

  render();

  document.getElementById("copyJsonBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonOutput.value).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied JSON media stream report!";
  });

  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SHAZAMTRACK_INSPECT" }, (res) => {
          if (res && res.ok && res.data) {
            current = res.data;
            render();
          }
        });
      }
    });
  }
});
