let currentAudit = {
  channelName: "Creator Channel",
  grade: "A",
  monthlyViews: 378600,
  yearlyViews: 4606300,
  rpm: 4.5,
  monthlyRev: 1704,
  yearlyRev: 20728,
  proj30dSubs: 1590,
  proj365dSubs: 19346
};

function renderStats() {
  const rpm = parseFloat(document.getElementById("rpmRange").value) || 4.5;
  document.getElementById("rpmTxt").textContent = `$${rpm.toFixed(2)}`;
  const mRev = Math.round((currentAudit.monthlyViews / 1000) * rpm);
  const yRev = Math.round((currentAudit.yearlyViews / 1000) * rpm);

  document.getElementById("gVal").textContent = currentAudit.grade;
  document.getElementById("vVal").textContent = currentAudit.monthlyViews.toLocaleString();
  document.getElementById("mRev").textContent = `$${mRev.toLocaleString()}`;
  document.getElementById("yRev").textContent = `$${yRev.toLocaleString()}`;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SOCIALSTATS_GET_AUDIT" }, (res) => {
        if (!chrome.runtime.lastError && res && res.grade) {
          currentAudit = res;
        }
        renderStats();
      });
    } else {
      renderStats();
    }
  });
} else {
  renderStats();
}

document.getElementById("rpmRange").addEventListener("input", renderStats);

document.getElementById("csvBtn").addEventListener("click", () => {
  const rpm = parseFloat(document.getElementById("rpmRange").value) || 4.5;
  const csv = [
    "Channel,Grade,MonthlyViews,YearlyViews,RPM,EstMonthlyUSD,EstYearlyUSD,Proj30dSubs,Proj365dSubs",
    `"${currentAudit.channelName}",${currentAudit.grade},${currentAudit.monthlyViews},${currentAudit.yearlyViews},${rpm},${Math.round((currentAudit.monthlyViews / 1000) * rpm)},${Math.round((currentAudit.yearlyViews / 1000) * rpm)},${currentAudit.proj30dSubs},${currentAudit.proj365dSubs}`
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialstats-forecast.csv";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("csvBtn").textContent = "✅ Exported Forecast CSV!";
});
