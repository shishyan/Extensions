(() => {
  if (document.getElementById("calendmeet-bar")) return;

  function generateSlots(title = "Product & Engineering Sync", durationMin = 30) {
    const slots = [
      {
        dayLabel: "Slot 1 (Next Business Day)",
        utc: "14:00 UTC",
        ist: "19:30 IST (UTC+5:30)",
        est: "09:00 EST (UTC-5)",
        pst: "06:00 PST (UTC-8)",
        cet: "15:00 CET (UTC+1)",
        isoStart: "20261102T140000Z",
        isoEnd: "20261102T143000Z"
      },
      {
        dayLabel: "Slot 2 (+2 Business Days)",
        utc: "16:00 UTC",
        ist: "21:30 IST (UTC+5:30)",
        est: "11:00 EST (UTC-5)",
        pst: "08:00 PST (UTC-8)",
        cet: "17:00 CET (UTC+1)",
        isoStart: "20261103T160000Z",
        isoEnd: "20261103T163000Z"
      },
      {
        dayLabel: "Slot 3 (+3 Business Days)",
        utc: "17:30 UTC",
        ist: "23:00 IST (UTC+5:30)",
        est: "12:30 EST (UTC-5)",
        pst: "09:30 PST (UTC-8)",
        cet: "18:30 CET (UTC+1)",
        isoStart: "20261104T173000Z",
        isoEnd: "20261104T180000Z"
      }
    ];

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${slots[0].isoStart}/${slots[0].isoEnd}&details=${encodeURIComponent("Scheduled via CalendMeet Multi-Timezone Assistant (" + durationMin + " mins)")}`;

    const snippetLines = [
      `📅 Proposed ${durationMin}-Min Meeting Availability (${title}):`,
      ...slots.map((s, idx) => `• Option ${idx + 1}: ${s.ist} | ${s.est} | ${s.pst} | ${s.utc}`),
      `🔗 Instant Google Calendar Hold: ${gcalUrl}`
    ];

    return {
      title,
      durationMin,
      slots,
      gcalUrl,
      snippet: snippetLines.join("\n")
    };
  }

  function insertIntoEditable(text) {
    const target = document.querySelector("textarea, input[type='text'], [contenteditable='true']");
    if (!target) return false;
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      target.value = (target.value ? target.value + "\n\n" : "") + text;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    if (target.isContentEditable) {
      target.textContent = (target.textContent ? target.textContent + "\n\n" : "") + text;
      return true;
    }
    return false;
  }

  const bar = document.createElement("div");
  bar.id = "calendmeet-bar";
  bar.innerHTML = `
    <span class="cm-label">📅 CalendMeet TZ</span>
    <button type="button" id="calendmeet-copy-btn">📅 Copy 3 Multi-TZ Meeting Slots</button>
    <button type="button" id="calendmeet-insert-btn">✍️ Insert in Compose</button>
  `;
  document.body.appendChild(bar);

  const copyBtn = document.getElementById("calendmeet-copy-btn");
  const insertBtn = document.getElementById("calendmeet-insert-btn");

  copyBtn.addEventListener("click", () => {
    const info = generateSlots();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(info.snippet).catch(() => {});
    }
    copyBtn.textContent = "✓ 3 Multi-TZ Slots Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📅 Copy 3 Multi-TZ Meeting Slots";
    }, 1600);
  });

  insertBtn.addEventListener("click", () => {
    const info = generateSlots();
    const inserted = insertIntoEditable(info.snippet);
    insertBtn.textContent = inserted ? "✓ Inserted!" : "✓ Copied!";
    if (!inserted && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(info.snippet).catch(() => {});
    }
    setTimeout(() => {
      insertBtn.textContent = "✍️ Insert in Compose";
    }, 1600);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CALENDMEET_GENERATE") {
      const info = generateSlots(msg.title || "Product & Engineering Sync", msg.durationMin || 30);
      if (msg.insert) {
        insertIntoEditable(info.snippet);
      }
      sendResponse({ ok: true, data: info });
      return true;
    }
  });
})();
