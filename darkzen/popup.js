let enabled = false;
const cSlider = document.getElementById('contrast');
const sSlider = document.getElementById('sepia');

function pushUpdate() {
  document.getElementById('cVal').textContent = cSlider.value;
  document.getElementById('sVal').textContent = sSlider.value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'DARKZEN_APPLY',
      config: { enabled, contrast: Number(cSlider.value), sepia: Number(sSlider.value) }
    });
  });
}

cSlider.addEventListener('input', pushUpdate);
sSlider.addEventListener('input', pushUpdate);

document.getElementById('toggleDark').addEventListener('click', () => {
  enabled = !enabled;
  document.getElementById('toggleDark').textContent = enabled ? 'Disable OLED Dark Mode' : 'Toggle OLED Dark Mode on Tab';
  pushUpdate();
});

document.getElementById('readerBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'DARKZEN_READER' });
  });
});
