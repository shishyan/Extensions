const tabs = Array.from(document.querySelectorAll(".tab"));
const panes = {
  qa: document.getElementById("pane-qa"),
  translate: document.getElementById("pane-translate"),
  reply: document.getElementById("pane-reply"),
  prompts: document.getElementById("pane-prompts")
};

tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    t.classList.add("active");
    const target = t.getAttribute("data-pane");
    Object.keys(panes).forEach((k) => {
      panes[k].style.display = k === target ? "block" : "none";
    });
  });
});

function loadActivePageSummary() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "MONI_PAGE_DATA" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        const bullets = (res.summaryBullets || []).map((b) => `• ${b.slice(0, 170)}`).join("\n\n");
        document.getElementById("qaOut").textContent = `📌 ${res.title} (${res.words} words, ~${res.readMin}m read)\n\n${bullets}`;
      } else {
        document.getElementById("qaOut").textContent = "Ready — Open any webpage or type a question above.";
      }
    });
  });
}

document.getElementById("askPageBtn").addEventListener("click", () => {
  const query = document.getElementById("qaQuery").value.trim();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "MONI_ASK_PAGE", query }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        document.getElementById("qaOut").textContent = res.answer;
      }
    });
  });
});

document.getElementById("openSidebarBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "MONI_TOGGLE_SIDEBAR" }, () => {});
  });
});

document.getElementById("explainBtn").addEventListener("click", () => {
  const text = document.getElementById("transInput").value;
  chrome.runtime.sendMessage({ type: "MONI_EXPLAIN", text }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      document.getElementById("transOut").textContent = res.explanation;
    }
  });
});

document.getElementById("translateBtn").addEventListener("click", () => {
  const text = document.getElementById("transInput").value;
  const targetLang = document.getElementById("transLang").value;
  chrome.runtime.sendMessage({ type: "MONI_TRANSLATE", text, targetLang }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      document.getElementById("transOut").textContent = res.translated;
    }
  });
});

document.querySelectorAll(".tone-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tone = btn.getAttribute("data-tone");
    const context = document.getElementById("replyInput").value;
    chrome.runtime.sendMessage({ type: "MONI_DRAFT_REPLY", tone, context }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        document.getElementById("replyOut").textContent = res.reply;
      }
    });
  });
});

loadActivePageSummary();
