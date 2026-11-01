(function () {
  if (window.__todoistTaskLoaded) return;
  window.__todoistTaskLoaded = true;

  let tasks = [
    { title: "Review Q4 AI engineering architecture", priority: "P1", due: "Today", url: "https://example.com" }
  ];

  function clipPageToTask(priority = "P1", due = "Today") {
    const sel = window.getSelection ? window.getSelection().toString().trim() : "";
    const item = {
      title: (sel || document.title || location.hostname).slice(0, 75),
      priority,
      due,
      url: location.href
    };
    tasks.unshift(item);
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ todoisttask_items: tasks });
    }
    return { ok: true, task: item, totalTasks: tasks.length };
  }

  function injectPill() {
    if (document.getElementById("todoisttask-pill")) return;
    const pill = document.createElement("div");
    pill.id = "todoisttask-pill";
    pill.textContent = "✅ TodoistTask: + Clip Page as P1 Task";
    document.body.appendChild(pill);

    pill.addEventListener("click", () => {
      const res = clipPageToTask("P1", "Today");
      pill.textContent = `✅ Added P1 Task (${res.totalTasks} Total)!`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "TODOIST_CLIP_TASK") {
      sendResponse(clipPageToTask(msg.priority || "P1", msg.due || "Today"));
      return true;
    }
    if (msg && msg.type === "TODOIST_GET_TASKS") {
      sendResponse({ tasks });
      return true;
    }
  });

  injectPill();
})();
