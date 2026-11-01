let currentTasks = [
  { title: "Review Q4 AI engineering architecture", priority: "P1", due: "Today", done: false }
];

function save() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ todoisttask_items: currentTasks });
  }
}

function render() {
  document.getElementById("taskList").innerHTML = currentTasks
    .map(
      (t, i) => `
      <div class="row" data-idx="${i}">
        <span style="${t.done ? "text-decoration:line-through;color:#64748b;" : ""}">${t.done ? "✅" : "☑️"} <strong>${t.title.slice(0, 36)}</strong></span>
        <span><span class="p-tag">${t.priority}</span> <em style="color:#94a3b8;">${t.due}</em></span>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".row").forEach((r) => {
    r.addEventListener("click", () => {
      const idx = Number(r.getAttribute("data-idx"));
      if (currentTasks[idx]) {
        currentTasks[idx].done = !currentTasks[idx].done;
        save();
        render();
      }
    });
  });
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["todoisttask_items"], (res) => {
    if (Array.isArray(res.todoisttask_items) && res.todoisttask_items.length) {
      currentTasks = res.todoisttask_items;
    }
    render();
  });
} else {
  render();
}

document.getElementById("addBtn").addEventListener("click", () => {
  const title = document.getElementById("taskInp").value.trim() || "Clip active research page";
  const priority = document.getElementById("prioSel").value;
  const due = document.getElementById("dueSel").value;
  currentTasks.unshift({ title, priority, due, done: false });
  save();
  document.getElementById("taskInp").value = "";
  render();
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const md = currentTasks.map((t) => `- [${t.done ? "x" : " "}] (${t.priority} · ${t.due}) ${t.title}`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("exportMdBtn").textContent = "✅ Exported!";
});
