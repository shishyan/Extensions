(function () {
  if (window.__magicalTextLoaded) return;
  window.__magicalTextLoaded = true;

  const DEFAULT_SNIPPETS = {
    "//intro": "Hi there! I came across {title} on {domain} and wanted to connect regarding our upcoming collaboration.",
    "//cal": "Feel free to grab a 15-minute slot on my calendar whenever works best for you (checked on {date}).",
    "//followup": "Just following up on my previous note sent on {date} — let me know if you have any questions!",
    "//sig": "Best regards,\nExecutive Operations Team ({domain})",
    "//date": "{date} {time}",
    "//clip": "Reference: {title} ({url}) — captured on {date}"
  };

  let snippets = Object.assign({}, DEFAULT_SNIPPETS);

  function loadSnippets() {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(["magicaltext_snippets"], (res) => {
      if (res && res.magicaltext_snippets && typeof res.magicaltext_snippets === "object") {
        snippets = Object.assign({}, DEFAULT_SNIPPETS, res.magicaltext_snippets);
      }
    });
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.magicaltext_snippets && changes.magicaltext_snippets.newValue) {
        snippets = Object.assign({}, DEFAULT_SNIPPETS, changes.magicaltext_snippets.newValue);
      }
    });
  }

  function resolveVariables(template) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const domainStr = location.hostname || "localhost";
    const titleStr = document.title || "Web Page";
    const urlStr = location.href || "";

    return String(template)
      .replace(/\{date\}/gi, dateStr)
      .replace(/\{time\}/gi, timeStr)
      .replace(/\{domain\}/gi, domainStr)
      .replace(/\{title\}/gi, titleStr)
      .replace(/\{url\}/gi, urlStr);
  }

  function showToast(trigger) {
    let toast = document.getElementById("magicaltext-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "magicaltext-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = `✨ MagicalText Expanded: ${trigger}`;
    toast.style.display = "flex";
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.style.display = "none";
    }, 2200);
  }

  function incrementCount() {
    if (!chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(["magicaltext_count"], (res) => {
      const next = (res.magicaltext_count || 0) + 1;
      chrome.storage.local.set({ magicaltext_count: next });
    });
  }

  function expandInString(rawVal) {
    if (!rawVal || !rawVal.includes("//")) return null;
    for (const [trig, tpl] of Object.entries(snippets)) {
      if (rawVal.includes(trig)) {
        const expanded = resolveVariables(tpl);
        return {
          trigger: trig,
          newValue: rawVal.split(trig).join(expanded)
        };
      }
    }
    return null;
  }

  function handleElementInput(el) {
    if (!el) return false;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const res = expandInString(el.value);
      if (res) {
        el.value = res.newValue;
        showToast(res.trigger);
        incrementCount();
        return true;
      }
    } else if (el.isContentEditable) {
      const res = expandInString(el.innerText || el.textContent || "");
      if (res) {
        el.innerText = res.newValue;
        showToast(res.trigger);
        incrementCount();
        return true;
      }
    }
    return false;
  }

  document.addEventListener(
    "input",
    (e) => {
      handleElementInput(e.target);
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MAGICAL_TEST_EXPAND") {
      const res = expandInString(msg.text || "//intro");
      sendResponse({
        ok: Boolean(res),
        expanded: res ? res.newValue : msg.text,
        trigger: res ? res.trigger : null
      });
      return true;
    }
    if (msg && msg.type === "MAGICAL_SCRAPE_PAGE") {
      const h1 = document.querySelector("h1");
      sendResponse({
        title: document.title || "",
        domain: location.hostname || "",
        url: location.href || "",
        heading: h1 ? h1.innerText.trim() : ""
      });
      return true;
    }
  });

  loadSnippets();
})();
