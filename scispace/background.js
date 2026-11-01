chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["scispace_papers"], (res) => {
    if (!res.scispace_papers) {
      chrome.storage.local.set({
        scispace_papers: [
          {
            title: "Attention Is All You Need",
            doi: "10.48550/arXiv.1706.03762",
            arxiv: "1706.03762",
            bibtex:
              "@article{vaswani2017attention,\n  title={Attention Is All You Need},\n  doi={10.48550/arXiv.1706.03762},\n  year={2017}\n}"
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCISPACE_SAVE_PAPER") {
    chrome.storage.local.get(["scispace_papers"], (res) => {
      const list = res.scispace_papers || [];
      list.unshift(msg.paper);
      chrome.storage.local.set({ scispace_papers: list.slice(0, 50) }, () => {
        sendResponse({ ok: true, count: list.length });
      });
    });
    return true;
  }
});
