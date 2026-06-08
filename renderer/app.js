const api = window.navigatorAPI;

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let zoomLevels = {};
const DEFAULT_ZOOM = 1.0;
const readyWebviews = new Set();
const SEARCH_ENGINES = {
  wouaff: 'https://www.qwant.com/?q=',
  qwant: 'https://www.qwant.com/?q=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
};

const tabContainer = document.getElementById('tab-container');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const welcomePage = document.getElementById('welcome-page');
const welcomeSearch = document.getElementById('welcome-search');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const newTabBtn = document.getElementById('new-tab-btn');
const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarksContainer = document.getElementById('bookmarks-container');
const bookmarksOverflow = document.getElementById('bookmarks-overflow');
const bookmarksOverflowBtn = document.getElementById('bookmarks-overflow-btn');
const bookmarksOverflowMenu = document.getElementById('bookmarks-overflow-menu');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');

let bookmarks = [];
let searchUrl = SEARCH_ENGINES.wouaff;

function normalizeUrl(input) {
  input = input.trim();
  if (!input) return '';
  if (input.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//)) return input;
  if (input.includes('.') && !input.includes(' ')) {
    return `https://${input}`;
  }
  const query = encodeURIComponent(input);
  const base = searchUrl || SEARCH_ENGINES.wouaff;
  return base + query;
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

  webview.addEventListener('did-fail-load', (e) => {
    if (e.errorCode !== -3 && e.errorCode !== -1) {
      console.warn(`Webview ${tabId} failed to load ${e.validatedURL}: ${e.errorDescription}`);
    }
  });

  webview.addEventListener('page-title-updated', (e) => {
    updateTabInfo(tabId, { title: e.title });
    updateTabUI(tabId, { title: e.title });
    updateBookmarkStar();
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
      updateBookmarkStar();
    }
    updateNavButtons(tabId);
    if (tabId === activeTabId) updateRPC();
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame && tabId === activeTabId) {
      urlBar.value = e.url;
      updateBookmarkStar();
    }
    updateNavButtons(tabId);
    if (e.isMainFrame && tabId === activeTabId) updateRPC();
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
    if (webview) webview.loadURL(normalizeUrl(url)).catch(() => {});
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
    const webview = container.querySelector('webview');
    if (webview && readyWebviews.has(tabId) && webview.getURL() !== 'about:blank') {
      container.classList.add('active');
      welcomePage.classList.remove('active');
      urlBar.value = webview.getURL();
    } else {
      welcomePage.classList.add('active');
      urlBar.value = '';
    }
    updateNavButtons(tabId);
    updateBookmarkStar();
  } else {
    welcomePage.classList.add('active');
    urlBar.value = '';
    bookmarkBtn.classList.remove('bookmarked');
    bookmarkBtn.innerHTML = '<i class="bi-star"></i>';
  }

  const tab = getTab(tabId);
  if (tab) {
    document.title = tab.title !== 'Nouvel onglet' ? `${tab.title} - Wouaff` : 'Wouaff';
  }
  updateRPC();
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
      document.title = 'Wouaff';
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
      document.title = tab.title !== 'Nouvel onglet' ? `${tab.title} - Wouaff` : 'Wouaff';
    }
    reloadBtn.innerHTML = loading ? '<i class="bi-x"></i>' : '<i class="bi-arrow-clockwise"></i>';
    updateRPC();
  }
}

function updateRPC() {
  const tab = getTab(activeTabId);
  if (tab) {
    api.rpcUpdate({ title: tab.title !== 'Nouvel onglet' ? tab.title : '', url: tab.url || '' });
  } else {
    api.rpcUpdate({ title: '', url: '' });
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

  const webview = getWebview(tabId);
  if (webview) {
    const container = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
    if (container) container.classList.add('active');
    welcomePage.classList.remove('active');
    webview.loadURL(targetUrl).catch(() => {});
    urlBar.value = targetUrl;
  } else {
    createTab(targetUrl);
  }
}

function updateBookmarkStar() {
  const tab = getTab(activeTabId);
  if (tab && tab.url && tab.url !== 'about:blank') {
    const found = bookmarks.find(b => b.url === tab.url);
    bookmarkBtn.classList.toggle('bookmarked', !!found);
    bookmarkBtn.innerHTML = found ? '<i class="bi-star-fill"></i>' : '<i class="bi-star"></i>';
    bookmarkBtn.title = found ? 'Retirer des favoris' : 'Ajouter aux favoris';
  } else {
    bookmarkBtn.classList.remove('bookmarked');
    bookmarkBtn.innerHTML = '<i class="bi-star"></i>';
    bookmarkBtn.title = 'Ajouter aux favoris';
  }
}

async function loadBookmarks() {
  bookmarks = await api.getBookmarks();
  renderBookmarks();
  updateBookmarkStar();
}

function renderBookmarks() {
  const maxVisible = Math.max(0, Math.floor((bookmarksContainer.offsetWidth - 10) / 120));
  const visible = bookmarks.slice(0, maxVisible);
  const overflow = bookmarks.slice(maxVisible);

  bookmarksContainer.innerHTML = '';
  visible.forEach(bm => {
    const el = document.createElement('div');
    el.className = 'bookmark-item';
    el.innerHTML = `<span class="bm-icon">&#128279;</span>${escapeHtml(bm.title)}`;
    el.title = `${bm.title}\n${bm.url}`;
    el.addEventListener('click', () => navigateTo(bm.url));
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      removeBookmark(bm.url);
    });
    bookmarksContainer.appendChild(el);
  });

  if (overflow.length > 0) {
    bookmarksOverflow.classList.remove('hidden');
    bookmarksOverflowMenu.innerHTML = '';
    overflow.forEach(bm => {
      const el = document.createElement('div');
      el.className = 'bookmark-item';
      el.innerHTML = `<span class="bm-icon">&#128279;</span>${escapeHtml(bm.title)}`;
      el.title = `${bm.title}\n${bm.url}`;
      el.addEventListener('click', () => { navigateTo(bm.url); hideOverflow(); });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        removeBookmark(bm.url);
        hideOverflow();
      });
      bookmarksOverflowMenu.appendChild(el);
    });
  } else {
    bookmarksOverflow.classList.add('hidden');
  }
}

function hideOverflow() {
  bookmarksOverflowMenu.classList.add('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function toggleBookmark() {
  const tab = getTab(activeTabId);
  if (!tab || !tab.url || tab.url === 'about:blank') return;

  const existing = bookmarks.find(b => b.url === tab.url);
  if (existing) {
    bookmarks = await api.removeBookmark(tab.url);
  } else {
    const title = tab.title && tab.title !== 'Nouvel onglet' ? tab.title : extractTitle(tab.url);
    bookmarks = await api.addBookmark(title, tab.url);
  }
  renderBookmarks();
  updateBookmarkStar();
}

async function removeBookmark(url) {
  bookmarks = await api.removeBookmark(url);
  renderBookmarks();
  updateBookmarkStar();
}

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('hidden');
});

settingsMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const item = e.target.closest('.settings-item');
  if (!item) return;
  settingsMenu.classList.add('hidden');

  const action = item.dataset.action;
  const webview = getWebview(activeTabId);
  switch (action) {
    case 'bookmark-manager':
      createTab('chrome://bookmarks');
      break;
    case 'zoom-in':
      if (webview) {
        const current = zoomLevels[activeTabId] || DEFAULT_ZOOM;
        zoomLevels[activeTabId] = Math.min(5.0, current + 0.2);
        webview.setZoomLevel(zoomLevels[activeTabId]);
      }
      break;
    case 'zoom-out':
      if (webview) {
        const current = zoomLevels[activeTabId] || DEFAULT_ZOOM;
        zoomLevels[activeTabId] = Math.max(0.2, current - 0.2);
        webview.setZoomLevel(zoomLevels[activeTabId]);
      }
      break;
    case 'zoom-reset':
      if (webview) {
        zoomLevels[activeTabId] = DEFAULT_ZOOM;
        webview.setZoomLevel(DEFAULT_ZOOM);
      }
      break;
    case 'devtools':
      if (webview) {
        if (webview.isDevToolsOpened()) {
          webview.closeDevTools();
        } else {
          webview.openDevTools();
        }
      }
      break;
    case 'settings':
      openSettings();
      break;
    case 'about':
      document.getElementById('about-overlay').classList.remove('hidden');
      break;
  }
});

bookmarkBtn.addEventListener('click', toggleBookmark);

bookmarksOverflowBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  bookmarksOverflowMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  bookmarksOverflowMenu.classList.add('hidden');
  settingsMenu.classList.add('hidden');
});

bookmarksOverflowMenu.addEventListener('click', (e) => e.stopPropagation());

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

document.getElementById('about-close').addEventListener('click', () => {
  document.getElementById('about-overlay').classList.add('hidden');
});

document.getElementById('about-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('about-overlay').classList.add('hidden');
  }
});

let currentSettings = {};
let currentTheme = 'dark';

async function openSettings() {
  try {
    currentSettings = await api.getSettings();
  } catch (e) {
    currentSettings = {};
  }
  document.getElementById('setting-homepage').value = currentSettings.homepage || '';
  document.getElementById('setting-newtab').value = currentSettings.newTabPage || 'homepage';
  document.getElementById('setting-show-bookmarks').checked = currentSettings.showBookmarksBar !== false;
  document.getElementById('setting-search-engine').value = currentSettings.searchEngine || 'wouaff';
  document.getElementById('setting-theme').value = currentSettings.theme || 'dark';

  const csRow = document.getElementById('custom-search-row');
  if (currentSettings.searchEngine === 'custom') {
    csRow.classList.remove('hidden');
    document.getElementById('setting-custom-search').value = currentSettings.customSearchUrl || '';
  } else {
    csRow.classList.add('hidden');
  }

  document.getElementById('settings-overlay').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
}

function saveSettings() {
  const homepage = document.getElementById('setting-homepage').value.trim();
  const newTabPage = document.getElementById('setting-newtab').value;
  const showBookmarksBar = document.getElementById('setting-show-bookmarks').checked;
  const searchEngine = document.getElementById('setting-search-engine').value;
  const customSearchUrl = document.getElementById('setting-custom-search').value.trim();
  const theme = document.getElementById('setting-theme').value;

  const settings = { homepage, newTabPage, showBookmarksBar, searchEngine, theme };
  if (searchEngine === 'custom' && customSearchUrl) {
    settings.customSearchUrl = customSearchUrl;
  }

  api.saveSettings(settings).then(() => {
    currentSettings = settings;
    applySettings();
    closeSettings();
  });
}

function applySettings() {
  const bmBar = document.getElementById('bookmarks-bar');
  bmBar.style.display = currentSettings.showBookmarksBar !== false ? '' : 'none';

  if (currentSettings.searchEngine === 'custom' && currentSettings.customSearchUrl) {
    const url = currentSettings.customSearchUrl.replace('{query}', 'test');
    try { new URL(url); searchUrl = currentSettings.customSearchUrl; } catch {}
  } else {
    searchUrl = SEARCH_ENGINES[currentSettings.searchEngine] || SEARCH_ENGINES.qwant;
  }

  currentTheme = currentSettings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function updateSearchUrl() {
  const engine = document.getElementById('setting-search-engine').value;
  const csRow = document.getElementById('custom-search-row');
  if (engine === 'custom') {
    csRow.classList.remove('hidden');
  } else {
    csRow.classList.add('hidden');
  }
}

document.querySelectorAll('.settings-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + item.dataset.section).classList.add('active');
  });
});

document.getElementById('setting-search-engine').addEventListener('change', updateSearchUrl);
document.getElementById('settings-close').addEventListener('click', closeSettings);
document.getElementById('settings-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSettings();
});
document.getElementById('settings-save').addEventListener('click', saveSettings);
document.getElementById('settings-cancel').addEventListener('click', closeSettings);

document.getElementById('win-minimize').addEventListener('click', () => api.minimize());
document.getElementById('win-maximize').addEventListener('click', toggleMaximize);
document.getElementById('win-close').addEventListener('click', () => api.close());

api.onWindowStateChanged(maximized => {
  document.getElementById('max-icon').style.display = maximized ? 'none' : '';
  document.getElementById('restore-icon').style.display = maximized ? '' : 'none';
});

function toggleMaximize() {
  api.maximize();
}

api.isMaximized().then(maximized => {
  document.getElementById('max-icon').style.display = maximized ? 'none' : '';
  document.getElementById('restore-icon').style.display = maximized ? '' : 'none';
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

window.addEventListener('resize', () => {
  renderBookmarks();
});

api.getSettings().then(settings => {
  if (settings.searchEngine === 'wouaff' || !SEARCH_ENGINES[settings.searchEngine]) {
    searchUrl = SEARCH_ENGINES.wouaff;
  } else if (settings.searchEngine === 'custom' && settings.customSearchUrl) {
    searchUrl = settings.customSearchUrl;
  } else {
    searchUrl = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.wouaff;
  }
  createTab(settings.homepage && settings.homepage.trim() ? settings.homepage.trim() : '');
  if (settings.showBookmarksBar === false) {
    document.getElementById('bookmarks-bar').style.display = 'none';
  }
  if (settings.theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
});
loadBookmarks();
