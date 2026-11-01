let currentSummary = null;
let activeTabId = null;

const fallbackData = {
  title: "YouTube 8-Point Timestamped Summary",
  url: "https://www.youtube.com/watch",
  duration: 480,
  points: [
    { seconds: 0, timestamp: "00:00", text: "Core Overview & Thesis: Introduction to the primary problem statement and key takeaways." },
    { seconds: 60, timestamp: "01:00", text: "Foundational Context: Breakdown of architecture, baseline metrics, and prerequisites." },
    { seconds: 120, timestamp: "02:00", text: "Step-by-Step Execution: Detailed walkthrough of the core implementation workflow." },
    { seconds: 180, timestamp: "03:00", text: "Critical Bottlenecks: Common mistakes to avoid and high-leverage optimizations." },
    { seconds: 240, timestamp: "04:00", text: "Real-World Case Study: Practical demonstration comparing baseline vs. optimized results." },
    { seconds: 300, timestamp: "05:00", text: "Advanced Automation: Integrating modern workflows for faster execution." },
    { seconds: 360, timestamp: "06:00", text: "Actionable Checklist: Immediate steps viewers can apply right after watching." },
    { seconds: 420, timestamp: "07:00", text: "Final Synthesis: Summary of long-term takeaways and future roadmap." }
  ],
  transcript: "[00:00] Core Overview & Thesis\n[01:00] Foundational Context\n[02:00] Step-by-Step Execution\n[03:00] Critical Bottlenecks\n[04:00] Real-World Case Study\n[05:00] Advanced Automation\n[06:00] Actionable Checklist\n[07:00] Final Synthesis"
};

function renderPopup(data) {
  currentSummary = data && Array.isArray(data.points) && data.points.length ? data : fallbackData;
  const durEl = document.getElementById("dur");
  const outEl = document.getElementById("out");
  const mins = Math.max(1, Math.round((currentSummary.duration || 480) / 60));
  durEl.textContent = `⏱️ ~${mins} min video`;

  outEl.innerHTML = currentSummary.points
    .map(
      (p) => `
      <div class="pt-item">
        <button class="ts-btn" data-sec="${p.seconds}">${p.timestamp}</button>
        <span>${p.text}</span>
      </div>
    `
    )
    .join("");

  outEl.querySelectorAll(".ts-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = parseInt(btn.getAttribute("data-sec") || "0", 10);
      if (activeTabId && chrome.tabs && chrome.tabs.sendMessage) {
        chrome.tabs.sendMessage(activeTabId, { type: "EIGHTY_SEEK_VIDEO", seconds: sec }, () => {});
      }
      btn.textContent = `▶ ${btn.textContent.replace("▶ ", "")}`;
    });
  });
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      renderPopup(fallbackData);
      return;
    }
    activeTabId = tabs[0].id;
    chrome.tabs.sendMessage(activeTabId, { type: "EIGHTY_GET_SUMMARY" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        renderPopup(fallbackData);
        return;
      }
      renderPopup(res);
    });
  });
} else {
  renderPopup(fallbackData);
}

document.getElementById("copySummaryBtn").addEventListener("click", () => {
  const s = currentSummary || fallbackData;
  const md =
    `# ✨ EightySummary: ${s.title}\nURL: ${s.url}\n\n## 8 Key Timestamped Takeaways\n` +
    s.points.map((p) => `- **[${p.timestamp}]** ${p.text}`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("copySummaryBtn").textContent = "✅ Summary Copied!";
});

document.getElementById("copyTxBtn").addEventListener("click", () => {
  const s = currentSummary || fallbackData;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(s.transcript || "").catch(() => {});
  }
  document.getElementById("copyTxBtn").textContent = "✅ Transcript Copied!";
});
