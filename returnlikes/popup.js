let latestData = {
  likes: 12480,
  dislikes: 312,
  views: 148500,
  likeRatio: 97.6,
  lvr: 8.4
};

function render(d) {
  latestData = d || latestData;
  document.getElementById("likesVal").textContent = latestData.likes.toLocaleString();
  document.getElementById("dislikesVal").textContent = latestData.dislikes.toLocaleString();
  document.getElementById("ratioVal").textContent = `${latestData.likeRatio}%`;
  document.getElementById("lvrVal").textContent = `${latestData.lvr}%`;
  document.getElementById("barFill").style.width = `${latestData.likeRatio}%`;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "RETURNLIKES_GET_DATA" }, (res) => {
        if (!chrome.runtime.lastError && res && typeof res.dislikes === "number") {
          render(res);
        } else {
          render(latestData);
        }
      });
    } else {
      render(latestData);
    }
  });
} else {
  render(latestData);
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const report = `ReturnLikes Report — Likes: ${latestData.likes} | Dislikes: ${latestData.dislikes} | Ratio: ${latestData.likeRatio}% | LVR: ${latestData.lvr}%`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(report).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Engagement Report Copied!";
});
