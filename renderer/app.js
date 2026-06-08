const api = window.navigatorAPI;

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let zoomLevels = {};
const DEFAULT_ZOOM = 1.0;
const readyWebviews = new Set();

const tabContainer = document.getElementById('tab-container');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const welcomePage = document.getElementById('welcome-page');
const welcomeSearch = document.getElementById('welcome-search');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const newTabBtn = document.getElementById('new-tab-btn');

function normalizeUrl(input) {
  input = input.trim();
  if (!input) return '';
  if (input.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//)) return input;
  if (input.includes('.') && !input.includes(' ')) {
    return `https://${input}`;
  }
  const query = encodeURIComponent(input);
  return `https://www.google.com/search?q=${query}`;
}

function createWebviewContainer(tabId) {
  const existing = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
  if (existing) return existing;

  const container = document.createElement('div');
  container.className = 'webview-container';
  container.dataset.tabId = tabId;

  const webview = document.createElement('webview');
  webview.setAttribute('allowpopups', 'true');
  webview.src = 'about:blank';

  webview.addEventListener('dom-ready', () => {
    readyWebviews.add(tabId);
    if (tabId === activeTabId) updateNavButtons(tabId);
  });

  webview.addEventListener('did-start-loading', () => {
    const tab = getTab(tabId);
    if (tab) updateTabUI(tabId, { loading: true });
  });

  webview.addEventListener('did-stop-loading', () => {
    const tab = getTab(tabId);
    if (tab) updateTabUI(tabId, { loading: false });
  });

  webview.addEventListener('page-title-updated', (e) => {
    updateTabInfo(tabId, { title: e.title });
    updateTabUI(tabId, { title: e.title });
  });

  webview.addEventListener('update-target-url', (e) => {
    if (tabId === activeTabId && e.url) {
      urlBar.value = e.url;
    }
  });

  webview.addEventListener('did-navigate', (e) => {
    updateTabInfo(tabId, { url: e.url });
    if (tabId === activeTabId) {
      urlBar.value = e.url;
    }
    updateNavButtons(tabId);
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame && tabId === activeTabId) {
      urlBar.value = e.url;
    }
    updateNavButtons(tabId);
  });

  webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    createTab(e.url);
  });

  container.appendChild(webview);
  contentArea.appendChild(container);
  return container;
}

function getTab(tabId) {
  return tabs.find(t => t.id === tabId);
}

function getWebview(tabId) {
  const container = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
  return container ? container.querySelector('webview') : null;
}

async function createTab(url) {
  tabIdCounter++;
  const tabId = tabIdCounter;

  const tab = {
    id: tabId,
    url: url || 'about:blank',
    title: url ? extractTitle(url) : 'Nouvel onglet',
    loading: false,
  };
  tabs.push(tab);

  createWebviewContainer(tabId);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.tabId = tabId;
  tabEl.innerHTML = `
    <span class="tab-title">${tab.title}</span>
    <button class="tab-close" data-tab-id="${tabId}">&times;</button>
  `;
  tabEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      activateTab(tabId);
    }
  });
  tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });
  tabContainer.appendChild(tabEl);

  activateTab(tabId);

  if (url) {
    const webview = getWebview(tabId);
    if (webview) webview.src = normalizeUrl(url);
  }

  return tabId;
}

function extractTitle(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

function activateTab(tabId) {
  if (activeTabId === tabId) return;
  activeTabId = tabId;

  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.webview-container').forEach(el => el.classList.remove('active'));
  welcomePage.classList.remove('active');

  const tabEl = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.classList.add('active');

  const container = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
  if (container) {
    container.classList.add('active');
    const webview = container.querySelector('webview');
    if (webview && webview.src !== 'about:blank') {
      urlBar.value = webview.getURL();
    } else {
      urlBar.value = '';
    }
    updateNavButtons(tabId);
  } else {
    welcomePage.classList.add('active');
    urlBar.value = '';
  }

  const tab = getTab(tabId);
  if (tab) {
    document.title = tab.title !== 'Nouvel onglet' ? `${tab.title} - Navigator` : 'Navigator';
  }
}

async function closeTab(tabId) {
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  tabs.splice(idx, 1);

  const tabEl = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.remove();

  const container = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
  if (container) container.remove();

  if (tabId === activeTabId) {
    if (tabs.length > 0) {
      const newIdx = Math.min(idx, tabs.length - 1);
      activateTab(tabs[newIdx].id);
    } else {
      activeTabId = null;
      welcomePage.classList.add('active');
      urlBar.value = '';
      document.title = 'Navigator';
    }
  }
}

function updateTabInfo(tabId, data) {
  const tab = getTab(tabId);
  if (tab) {
    if (data.title !== undefined) tab.title = data.title;
    if (data.url !== undefined) tab.url = data.url;
  }
}

function updateTabUI(tabId, { title, loading } = {}) {
  const tabEl = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (!tabEl) return;
  const titleEl = tabEl.querySelector('.tab-title');
  if (title !== undefined) {
    titleEl.textContent = title;
  }
  if (tabId === activeTabId) {
    const tab = getTab(tabId);
    if (tab) {
      document.title = tab.title !== 'Nouvel onglet' ? `${tab.title} - Navigator` : 'Navigator';
    }
    reloadBtn.textContent = loading ? '\u2715' : '\u21BB';
  }
}

function updateNavButtons(tabId) {
  const webview = getWebview(tabId);
  if (webview && readyWebviews.has(tabId)) {
    backBtn.disabled = !webview.canGoBack();
    forwardBtn.disabled = !webview.canGoForward();
  } else {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
  }
}

function navigateTo(url) {
  const targetUrl = normalizeUrl(url);
  if (!targetUrl) return;

  let tabId = activeTabId;
  if (!tabId) {
    createTab(targetUrl);
    return;
  }

  const activeContainer = document.querySelector(`.webview-container[data-tab-id="${tabId}"].active`);
  if (activeContainer) {
    const webview = activeContainer.querySelector('webview');
    if (webview) {
      webview.src = targetUrl;
      urlBar.value = targetUrl;
    }
  } else {
    createTab(targetUrl);
  }
}

urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    navigateTo(urlBar.value);
    urlBar.blur();
  }
});

welcomeSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    navigateTo(welcomeSearch.value);
    welcomeSearch.value = '';
  }
});

document.querySelectorAll('.quick-link').forEach(el => {
  el.addEventListener('click', () => {
    navigateTo(el.dataset.url);
  });
});

newTabBtn.addEventListener('click', () => createTab());

backBtn.addEventListener('click', () => {
  const webview = getWebview(activeTabId);
  if (webview && typeof webview.canGoBack === 'function' && webview.canGoBack()) webview.goBack();
});

forwardBtn.addEventListener('click', () => {
  const webview = getWebview(activeTabId);
  if (webview && typeof webview.canGoForward === 'function' && webview.canGoForward()) webview.goForward();
});

reloadBtn.addEventListener('click', () => {
  const webview = getWebview(activeTabId);
  if (webview) {
    if (webview.isLoading()) {
      webview.stop();
    } else {
      webview.reload();
    }
  }
});

api.onNewTab(() => createTab());

api.onCloseTab(() => {
  if (activeTabId) closeTab(activeTabId);
});

api.onReloadTab(() => {
  const webview = getWebview(activeTabId);
  if (webview) webview.reload();
});

api.onHardReloadTab(() => {
  const webview = getWebview(activeTabId);
  if (webview) webview.reloadIgnoringCache();
});

api.onToggleDevtools(() => {
  const webview = getWebview(activeTabId);
  if (webview) {
    if (webview.isDevToolsOpened()) {
      webview.closeDevTools();
    } else {
      webview.openDevTools();
    }
  }
});

api.onGoBack(() => {
  const webview = getWebview(activeTabId);
  if (webview && typeof webview.canGoBack === 'function' && webview.canGoBack()) webview.goBack();
});

api.onGoForward(() => {
  const webview = getWebview(activeTabId);
  if (webview && typeof webview.canGoForward === 'function' && webview.canGoForward()) webview.goForward();
});

api.onZoomIn(() => {
  const webview = getWebview(activeTabId);
  if (webview) {
    const current = zoomLevels[activeTabId] || DEFAULT_ZOOM;
    zoomLevels[activeTabId] = Math.min(5.0, current + 0.2);
    webview.setZoomLevel(zoomLevels[activeTabId]);
  }
});

api.onZoomOut(() => {
  const webview = getWebview(activeTabId);
  if (webview) {
    const current = zoomLevels[activeTabId] || DEFAULT_ZOOM;
    zoomLevels[activeTabId] = Math.max(0.2, current - 0.2);
    webview.setZoomLevel(zoomLevels[activeTabId]);
  }
});

api.onZoomReset(() => {
  const webview = getWebview(activeTabId);
  if (webview) {
    zoomLevels[activeTabId] = DEFAULT_ZOOM;
    webview.setZoomLevel(DEFAULT_ZOOM);
  }
});

createTab();
