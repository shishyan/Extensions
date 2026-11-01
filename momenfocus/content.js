(function () {
  if (window.__momenFocusLoaded) return;
  window.__momenFocusLoaded = true;

  let focusGoal = "Ship zero-error production release";
  let secondsLeft = 1500;
  let running = false;
  let intervalId = null;

  function formatMMSS(s) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  function injectBar() {
    if (document.getElementById("momenfocus-bar")) return;
    const bar = document.createElement("div");
    bar.id = "momenfocus-bar";
    bar.innerHTML = `
      <div>
        🎯 <strong>MomenFocus MIT #1:</strong> <span id="mf-goal-txt">${focusGoal}</span> • 🔥 7-Day Streak
      </div>
      <span class="mf-timer" id="mf-timer-btn">⏱️ ${formatMMSS(secondsLeft)} (Start)</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(bar);

    const timerBtn = bar.querySelector("#mf-timer-btn");
    timerBtn.addEventListener("click", () => {
      running = !running;
      if (running) {
        secondsLeft = Math.max(0, secondsLeft - 1);
        timerBtn.textContent = `▶ ${formatMMSS(secondsLeft)} (Active)`;
        if (!intervalId) {
          intervalId = setInterval(() => {
            if (!running) return;
            secondsLeft = Math.max(0, secondsLeft - 1);
            timerBtn.textContent = `▶ ${formatMMSS(secondsLeft)} (Active)`;
          }, 1000);
        }
      } else {
        timerBtn.textContent = `⏸ ${formatMMSS(secondsLeft)} (Paused)`;
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MOMEN_SET_GOAL") {
      if (msg.goal) focusGoal = msg.goal;
      const el = document.getElementById("mf-goal-txt");
      if (el) el.textContent = focusGoal;
      sendResponse({ ok: true, goal: focusGoal, timer: formatMMSS(secondsLeft) });
      return true;
    }
  });

  injectBar();
})();
