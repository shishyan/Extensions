let seconds = 1500;
let timerOn = true;
const clockEl = document.getElementById("pomoClock");

function renderClock() {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  if (clockEl) clockEl.textContent = `${m}:${s}`;
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ momenfocus_goal: "Ship zero-error production release" }, (res) => {
    if (res.momenfocus_goal) document.getElementById("goalInp").value = res.momenfocus_goal;
  });
}

setInterval(() => {
  if (timerOn && seconds > 0) {
    seconds--;
    renderClock();
  }
}, 1000);

if (clockEl) {
  clockEl.style.cursor = "pointer";
  clockEl.addEventListener("click", () => {
    timerOn = !timerOn;
  });
}

document.getElementById("saveGoalBtn").addEventListener("click", () => {
  const goal = document.getElementById("goalInp").value.trim();
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ momenfocus_goal: goal });
  }
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "MOMEN_SET_GOAL", goal }, () => {});
      }
    });
  }
  document.getElementById("saveGoalBtn").textContent = "✅ MIT Focus Goal Synced!";
});
