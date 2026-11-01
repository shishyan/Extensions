const INITIAL_DEALS = [
  { name: "Acme AI Cloud", stage: "Proposal", value: 18500, domain: "acme.ai" },
  { name: "Vertex Data Labs", stage: "Demo", value: 12000, domain: "vertexlabs.io" }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["streakcrm_deals"], (res) => {
    if (!Array.isArray(res.streakcrm_deals)) {
      chrome.storage.local.set({ streakcrm_deals: INITIAL_DEALS });
    }
  });
});
