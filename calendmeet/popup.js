document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("titleInput");
  const durationSelect = document.getElementById("durationSelect");
  const slotsOutput = document.getElementById("slotsOutput");
  const gcalUrlAnchor = document.getElementById("gcalUrlAnchor");
  const statusMsg = document.getElementById("statusMsg");

  function fmtZone(date, tz, label) {
    try {
      const t = date.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
      return `${t} ${label}`;
    } catch (_) {
      return `${date.toISOString().slice(11, 16)} UTC`;
    }
  }

  function refresh() {
    const title = titleInput.value.trim() || "Product & Engineering Sync";
    const dur = Number(durationSelect.value) || 30;
    const base = new Date();
    base.setMinutes(0, 0, 0);

    const offsets = [24, 27, 48];
    const lines = offsets.map((h, i) => {
      const start = new Date(base.getTime() + h * 3600000);
      const day = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return `Option ${i + 1} (${day}, ${dur}m):\n  • ${fmtZone(start, "America/New_York", "EST")} | ${fmtZone(start, "America/Los_Angeles", "PST")} | ${fmtZone(start, "Europe/Paris", "CET")} | ${fmtZone(start, "Asia/Kolkata", "IST")}`;
    });

    const firstStart = new Date(base.getTime() + 24 * 3600000);
    const firstEnd = new Date(firstStart.getTime() + dur * 60000);
    const fmtGcal = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmtGcal(firstStart)}/${fmtGcal(firstEnd)}&details=${encodeURIComponent("Scheduled via CalendMeet Multi-TZ Availability Builder")}`;

    slotsOutput.value = `Hi! Here are 3 proposed times for "${title}" (${dur} min):\n\n${lines.join("\n\n")}\n\n1-Click Google Calendar Invite:\n${gcalUrl}`;
    gcalUrlAnchor.href = gcalUrl;
  }

  titleInput.addEventListener("input", refresh);
  durationSelect.addEventListener("change", refresh);
  refresh();

  document.getElementById("copySlotsBtn").addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(slotsOutput.value).catch(() => {});
    }
    statusMsg.textContent = "✓ Copied 3 multi-TZ availability slots to clipboard!";
  });

  document.getElementById("exportIcsBtn").addEventListener("click", () => {
    const title = titleInput.value.trim() || "Product & Engineering Sync";
    const dur = Number(durationSelect.value) || 30;
    const base = new Date();
    base.setMinutes(0, 0, 0);
    const start = new Date(base.getTime() + 24 * 3600000);
    const end = new Date(start.getTime() + dur * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CalendMeet//Multi-TZ Availability//EN",
      "BEGIN:VEVENT",
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(end),
      "SUMMARY:" + title,
      "DESCRIPTION:Scheduled via CalendMeet Multi-TZ Builder",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    slotsOutput.value = ics;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ics).catch(() => {});
    }
    statusMsg.textContent = "✓ Generated & copied iCalendar (.ICS) invite!";
  });

  document.getElementById("insertComposeBtn").addEventListener("click", () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "CALENDMEET_GENERATE",
            title: titleInput.value.trim(),
            durationMin: Number(durationSelect.value) || 30,
            insertIntoPage: true
          }, () => {
            statusMsg.textContent = "✓ Inserted availability block into active page!";
          });
        }
      });
    }
  });
});