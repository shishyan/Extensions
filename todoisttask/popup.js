let currentTasks = [
  { title: "Review Q4 AI engineering architecture", priority: "P1", due: "Today" }
];

function render() {
  document.getElementById("taskList").innerHTML = currentTasks
    .map(
      (t) => `
      <div class="row">
        <span>☑️ <strong>${t.title.slice(0, 38)}</strong></span>
        <span><span class="p-tag">${t.priority}</span> <em style="color:#94a3b8;">${t.due}</em></span>
      </div>
    `
    )
    .join("");
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
  currentTasks.unshift({ title, priority, due });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ todoisttask_items: currentTasks });
  }
  document.getElementById("taskInp").value = "";
  render();
});
