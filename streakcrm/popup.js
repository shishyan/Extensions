let currentDeals = [
  { name: "Acme AI Cloud", stage: "Proposal", value: 18500 },
  { name: "Vertex Data Labs", stage: "Demo", value: 12000 }
];

function render() {
  const total = currentDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
  document.getElementById("dealCount").textContent = `📌 Active Deals: ${currentDeals.length}`;
  document.getElementById("pipeVal").textContent = `💰 Pipeline: $${total.toLocaleString()}`;

  document.getElementById("dealList").innerHTML = currentDeals
    .map(
      (d) => `
      <div class="row">
        <span><strong>${d.name}</strong></span>
        <span class="stage-pill">${d.stage}</span>
        <strong style="color:#4ade80;">$${Number(d.value).toLocaleString()}</strong>
      </div>
    `
    )
    .join("");
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["streakcrm_deals"], (res) => {
    if (Array.isArray(res.streakcrm_deals) && res.streakcrm_deals.length) {
      currentDeals = res.streakcrm_deals;
    }
    render();
  });
} else {
  render();
}

document.getElementById("addBtn").addEventListener("click", () => {
  const name = document.getElementById("nameInp").value.trim() || "New Enterprise Deal";
  const stage = document.getElementById("stageSel").value;
  const value = parseInt(document.getElementById("valInp").value, 10) || 15000;
  currentDeals.unshift({ name, stage, value });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ streakcrm_deals: currentDeals });
  }
  document.getElementById("nameInp").value = "";
  render();
});
