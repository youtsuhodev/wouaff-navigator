const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const tabs = new Map();
let tabIdCounter = 0;
let bookmarksPath, settingsPath;

function getBookmarksPath() {
  if (!bookmarksPath) {
    bookmarksPath = path.join(app.getPath('userData'), 'bookmarks.json');
  }
  return bookmarksPath;
}

function getSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Wouaff',
    icon: path.join(__dirname, 'assets', 'logo', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvel onglet',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('new-tab'),
        },
        {
          label: 'Fermer l\'onglet',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('close-tab'),
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('reload-tab'),
        },
        {
          label: 'Recharger (sans cache)',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow?.webContents.send('hard-reload-tab'),
        },
        { type: 'separator' },
        {
          label: 'Outils de développement',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.send('toggle-devtools'),
        },
        { type: 'separator' },
        {
          label: 'Zoom avant',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('zoom-in'),
        },
        {
          label: 'Zoom arrière',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('zoom-out'),
        },
        {
          label: 'Zoom normal',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('zoom-reset'),
        },
      ],
    },
    {
      label: 'Histoire',
      submenu: [
        {
          label: 'Précédent',
          accelerator: 'CmdOrCtrl+[',
          click: () => mainWindow?.webContents.send('go-back'),
        },
        {
          label: 'Suivant',
          accelerator: 'CmdOrCtrl+]',
          click: () => mainWindow?.webContents.send('go-forward'),
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('create-tab', () => {
  tabIdCounter++;
  const id = tabIdCounter;
  tabs.set(id, { id, url: 'about:blank', title: 'Nouvel onglet' });
  return { id, url: 'about:blank', title: 'Nouvel onglet' };
});

ipcMain.handle('remove-tab', (_, tabId) => {
  tabs.delete(tabId);
});

ipcMain.handle('update-tab-info', (_, { tabId, url, title }) => {
  if (tabs.has(tabId)) {
    const tab = tabs.get(tabId);
    if (url !== undefined) tab.url = url;
    if (title !== undefined) tab.title = title;
  }
});

ipcMain.handle('get-tabs', () => {
  return Array.from(tabs.values());
});

ipcMain.handle('save-dialog', async (_, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
  });
  return result.canceled ? null : result.filePath;
});

function loadBookmarks() {
  try {
    const p = getBookmarksPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveBookmarks(bookmarks) {
  try {
    fs.writeFileSync(getBookmarksPath(), JSON.stringify(bookmarks, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save bookmarks:', e);
  }
}

ipcMain.handle('get-bookmarks', () => loadBookmarks());
ipcMain.handle('add-bookmark', (_, { title, url }) => {
  const bookmarks = loadBookmarks();
  if (!bookmarks.find(b => b.url === url)) {
    bookmarks.push({ title, url });
    saveBookmarks(bookmarks);
  }
  return bookmarks;
});
ipcMain.handle('remove-bookmark', (_, url) => {
  let bookmarks = loadBookmarks();
  bookmarks = bookmarks.filter(b => b.url !== url);
  saveBookmarks(bookmarks);
  return bookmarks;
});

function loadSettings() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch {}
  return { searchEngine: 'qwant', homepage: 'https://www.qwant.com/', newTabPage: 'homepage', showBookmarksBar: true };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('save-settings', (_, settings) => {
  saveSettings(settings);
  return settings;
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
