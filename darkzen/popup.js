let state = {
  enabled: false,
  contrast: 100,
  brightness: 100,
  sepia: 10,
  grayscale: 0,
  dyslexia: false
};
let currentHost = 'active-site';

const cSlider = document.getElementById('contrast');
const bSlider = document.getElementById('brightness');
const sSlider = document.getElementById('sepia');
const gSlider = document.getElementById('grayscale');
const toggleDarkBtn = document.getElementById('toggleDark');
const dyslexiaBtn = document.getElementById('dyslexiaBtn');
const siteBadge = document.getElementById('siteBadge');

function syncUI() {
  cSlider.value = state.contrast;
  bSlider.value = state.brightness;
  sSlider.value = state.sepia;
  gSlider.value = state.grayscale;

  document.getElementById('cVal').textContent = state.contrast;
  document.getElementById('bVal').textContent = state.brightness;
  document.getElementById('sVal').textContent = state.sepia;
  document.getElementById('gVal').textContent = state.grayscale;

  toggleDarkBtn.textContent = state.enabled
    ? `✅ OLED Dark Mode ON (${currentHost})`
    : `⚡ Enable OLED Dark Mode on ${currentHost}`;
  toggleDarkBtn.className = state.enabled ? 'active-mode' : '';

  dyslexiaBtn.textContent = state.dyslexia ? '🔤 Dyslexia Font: ON ✓' : '🔤 Dyslexia Font: OFF';
  dyslexiaBtn.style.borderColor = state.dyslexia ? '#4ade80' : '#475569';
}

function pushUpdate() {
  state.contrast = Number(cSlider.value);
  state.brightness = Number(bSlider.value);
  state.sepia = Number(sSlider.value);
  state.grayscale = Number(gSlider.value);
  syncUI();

  chrome.storage.local.get({ darkzenSites: {} }, (data) => {
    const sites = data.darkzenSites || {};
    sites[currentHost] = state;
    chrome.storage.local.set({ darkzenSites: sites });
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'DARKZEN_APPLY',
      config: state
    });
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  try {
    const u = new URL(tabs[0].url || 'https://example.com');
    currentHost = (u.hostname || 'local').replace(/^www\./, '') || 'local';
    siteBadge.textContent = currentHost.slice(0, 22);
  } catch (_) {}

  chrome.tabs.sendMessage(tabs[0].id, { type: 'DARKZEN_GET_STATE' }, (res) => {
    if (!chrome.runtime.lastError && res && res.config) {
      currentHost = res.host || currentHost;
      siteBadge.textContent = currentHost.slice(0, 22);
      state = { ...state, ...res.config };
      syncUI();
    } else {
      chrome.storage.local.get({ darkzenSites: {} }, (data) => {
        if (data.darkzenSites && data.darkzenSites[currentHost]) {
          state = { ...state, ...data.darkzenSites[currentHost] };
        }
        syncUI();
      });
    }
  });
});

[cSlider, bSlider, sSlider, gSlider].forEach(sl => {
  sl.addEventListener('input', pushUpdate);
});

toggleDarkBtn.addEventListener('click', () => {
  state.enabled = !state.enabled;
  pushUpdate();
});

dyslexiaBtn.addEventListener('click', () => {
  state.dyslexia = !state.dyslexia;
  pushUpdate();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  state = {
    enabled: false,
    contrast: 100,
    brightness: 100,
    sepia: 0,
    grayscale: 0,
    dyslexia: false
  };
  pushUpdate();
});

document.getElementById('readerBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'DARKZEN_READER' }, (res) => {
      if (res && res.ok) {
        document.getElementById('readerBtn').textContent = res.readerOpen
          ? '📖 Zen Reader Active on Tab ✓'
          : '📖 Open Distraction-Free Zen Reader';
      }
    });
  });
});
