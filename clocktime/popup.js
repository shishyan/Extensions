document.addEventListener("DOMContentLoaded", () => {
  let state = {
    running: false,
    elapsedSeconds: 1500,
    hourlyRate: 120,
    projectName: "Client Core Architecture",
    startedAt: null,
    logs: [
      { project: "Client Core Architecture", durationSec: 1500, rate: 120, earned: "50.00", date: "2026-11-01" }
    ]
  };

  const timerDisplay = document.getElementById("timerDisplay");
  const earningsDisplay = document.getElementById("earningsDisplay");
  const projectInput = document.getElementById("projectInput");
  const rateSelect = document.getElementById("rateSelect");
  const rateBadge = document.getElementById("rateBadge");
  const invoiceOutput = document.getElementById("invoiceOutput");
  const statusMsg = document.getElementById("statusMsg");

  function fmtHMS(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  }

  function buildMarkdown() {
    const hrs = (state.elapsedSeconds / 3600).toFixed(2);
    const total = ((state.elapsedSeconds / 3600) * state.hourlyRate).toFixed(2);
    return [
      `# Billable Client Timesheet — ${state.projectName}`,
      `- Date: 2026-11-01`,
      `- Hourly Rate: $${state.hourlyRate}/hr`,
      `- Logged Hours: ${hrs} hrs (${fmtHMS(state.elapsedSeconds)})`,
      `- Total Amount Due: $${total} USD`
    ].join("\n");
  }

  function buildCsv() {
    const hrs = (state.elapsedSeconds / 3600).toFixed(2);
    const total = ((state.elapsedSeconds / 3600) * state.hourlyRate).toFixed(2);
    return `Date,Project,Hours,HourlyRate,TotalUSD\n2026-11-01,"${state.projectName}",${hrs},${state.hourlyRate},${total}`;
  }

  function render() {
    const total = ((state.elapsedSeconds / 3600) * state.hourlyRate).toFixed(2);
    timerDisplay.textContent = fmtHMS(state.elapsedSeconds);
    earningsDisplay.textContent = `$${total} Billable`;
    rateBadge.textContent = `$${state.hourlyRate}/hr`;
    projectInput.value = state.projectName;
    rateSelect.value = String(state.hourlyRate);
    invoiceOutput.value = buildMarkdown();
  }

  function persist() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clocktime_state: state });
    }
  }

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ clocktime_state: null }, (data) => {
      if (data && data.clocktime_state) {
        state = Object.assign(state, data.clocktime_state);
      }
      render();
    });
  } else {
    render();
  }

  setInterval(() => {
    if (state.running) {
      state.elapsedSeconds += 1;
      render();
    }
  }, 1000);

  projectInput.addEventListener("input", () => {
    state.projectName = projectInput.value.trim() || "Client Project";
    persist();
    render();
  });

  rateSelect.addEventListener("change", () => {
    state.hourlyRate = Number(rateSelect.value) || 120;
    persist();
    render();
  });

  document.getElementById("toggleTimerBtn").addEventListener("click", () => {
    state.running = !state.running;
    state.elapsedSeconds += 60;
    persist();
    render();
    statusMsg.textContent = state.running ? "▶ Live Timer ticking (+1m logged)" : "⏹ Timer paused & saved";
  });

  document.getElementById("add15mBtn").addEventListener("click", () => {
    state.elapsedSeconds += 900;
    persist();
    render();
    statusMsg.textContent = "✓ Added +15m billable block!";
  });

  document.getElementById("copyMarkdownBtn").addEventListener("click", () => {
    const md = buildMarkdown();
    invoiceOutput.value = md;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied Markdown Invoice Summary!";
  });

  document.getElementById("copyCsvBtn").addEventListener("click", () => {
    const csv = buildCsv();
    invoiceOutput.value = csv;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(csv).catch(() => {});
    }
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clocktime-timesheet.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
    statusMsg.textContent = "✓ Copied & Downloaded CSV Client Timesheet!";
  });
});
