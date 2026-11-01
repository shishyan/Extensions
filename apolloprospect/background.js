/**
 * ApolloProspect — Background Service Worker
 * Manages saved B2B leads in chrome.storage.local
 */

const SEED_LEADS = [
  {
    name: "Elena Vance",
    title: "VP of Engineering",
    seniority: "VP / Executive",
    department: "Engineering & AI",
    email: "elena.vance@acmecloud.io",
    company: "acmecloud.io"
  }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apolloLeads"], (res) => {
    if (!Array.isArray(res.apolloLeads) || res.apolloLeads.length === 0) {
      chrome.storage.local.set({ apolloLeads: SEED_LEADS });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "APOLLO_SAVE_LEAD") {
    chrome.storage.local.get(["apolloLeads"], (res) => {
      const list = Array.isArray(res.apolloLeads) && res.apolloLeads.length ? res.apolloLeads : [...SEED_LEADS];
      if (msg.lead) list.unshift(msg.lead);
      const trimmed = list.slice(0, 60);
      chrome.storage.local.set({ apolloLeads: trimmed }, () => {
        sendResponse({ ok: true, leads: trimmed });
      });
    });
    return true;
  }

  if (msg && msg.type === "APOLLO_GET_LEADS") {
    chrome.storage.local.get(["apolloLeads"], (res) => {
      const leads = Array.isArray(res.apolloLeads) && res.apolloLeads.length ? res.apolloLeads : SEED_LEADS;
      sendResponse({ ok: true, leads });
    });
    return true;
  }
});
