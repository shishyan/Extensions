document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("titleInput");
  const durationSelect = document.getElementById("durationSelect");
  const slotsOutput = document.getElementById("slotsOutput");
  const gcalUrlAnchor = document.getElementById("gcalUrlAnchor");
  const statusMsg = document.getElementById("statusMsg");

  function buildData() {
    const title = titleInput.value.trim() || "Product & Engineering Sync";
    const dur = Number(durationSelect.value) || 30;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=20261102T140000Z/20261102T143000Z&details=${encodeURIComponent("Scheduled via CalendMeet (" + dur + " mins)")}`;
    const snippet = [
      `📅 Proposed ${dur}-Min Meeting Availability (${title}):`,
      `• Option 1: 19:30 IST (UTC+5:30) | 09:00 EST (UTC-5) | 06:00 PST (UTC-8) | 14:00 UTC`,
      `• Option 2: 21:30 IST (UTC+5:30) | 11:00 EST (UTC-5) | 08:00 PST (UTC-8) | 16:00 UTC`,
      `• Option 3: 23:00 IST (UTC+5:30) | 12:30 EST (UTC-5) | 09:30 PST (UTC-8) | 17:30 UTC`,
      `🔗 Instant Google Calendar Hold: ${gcalUrl}`
    ].join("\n");
    return { title, dur, gcalUrl, snippet };
  }

  function render() {
    const info = buildData();
    slotsOutput.value = info.snippet;
    gcalUrlAnchor.href = info.gcalUrl;
  }

  render();
  titleInput.addEventListener("input", render);
  durationSelect.addEventListener("change", render);

  document.getElementById("copySlotsBtn").addEventListener("click", () => {
    const info = buildData();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(info.snippet).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied 3 Multi-Timezone slots + GCal URL!";
  });

  document.getElementById("insertComposeBtn").addEventListener("click", () => {
    const info = buildData();
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "CALENDMEET_GENERATE",
            title: info.title,
            durationMin: info.dur,
            insert: true
          }, () => {
            statusMsg.textContent = "✓ Inserted availability block into active page!";
          });
        }
      });
    } else {
      statusMsg.textContent = "✓ Availability snippet ready!";
    }
  });
});
