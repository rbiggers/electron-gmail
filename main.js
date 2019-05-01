const {
  app,
  Menu,
  shell,
  dialog,
  BrowserView,
  BrowserWindow,
  globalShortcut,
} = require('electron');

const path = require('path');
const devtron = require('devtron');
const { version } = require('./package.json');
const GitHubApi = require('./GitHubApi');

const debug = /--debug/.test(process.argv[2]);

const targetUrl = 'https://www.pandora.com/account/sign-in';

if (process.mas) app.setName('Electron Pandora');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let pandoraView = null;

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  if (process.mas) return;

  app.requestSingleInstanceLock();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

function showDownlodDialog(window, url) {
  if (!(window) || !(url)) {
    console.error('Window: ', window);
    console.error('Url: ', url);
    return;
  }

  setTimeout(() => {
    const dialogOptions = {
      type: 'question',
      buttons: ['Download', 'Cancel'],
      icon: path.join(__dirname, 'assets/icon/icon.png'),
      title: 'Update',
      message: 'An update is available, would you like to download it?',
    };

    dialog.showMessageBox(dialogOptions, (i) => {
      if (i === 0) {
        GitHubApi.downloadLatestVersion(window, url)
          .then(result => console.log('Done!: \n', result))
          .catch(error => console.error(error));
      }
    });
  }, 3000);
}

function checkForUpdates() {
  GitHubApi.getLatestVersion()
    .then((githubVersion) => {
      if (!(version === githubVersion)) {
        GitHubApi.getLatestRelease()
          .then((response) => {
            const body = JSON.parse(response.body);
            body.assets.forEach((asset) => {
              if (asset.browser_download_url.includes(process.platform)) {
                // Show dialog
                showDownlodDialog(mainWindow, asset.browser_download_url);
              }
            });
          })
          .catch(error => console.error('Error: ', error));
      }
    })
    .catch(error => console.error('Error: ', error));
}

function registerGlobalShortcuts() {
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: '\u0020', // spacebar code
    });
    mainWindow.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: '\u0020', // spacebar code
    });
  });

  globalShortcut.register('MediaNextTrack', () => {
    mainWindow.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'right',
    });
    mainWindow.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: 'right',
    });
  });
}

function createBrowserView() {
  const mainWindowBounds = mainWindow.getBounds();

  pandoraView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setBrowserView(pandoraView);

  const desiredWidth = debug ? Math.round(mainWindowBounds.width * 0.7) : mainWindowBounds.width;

  pandoraView.setBounds({
    x: 0,
    y: 0,
    width: desiredWidth,
    height: mainWindowBounds.height,
  });

  pandoraView.setAutoResize({
    width: true,
    height: true,
  });

  pandoraView.webContents.loadURL(targetUrl);

  if (debug) pandoraView.webContents.openDevTools({ mode: 'right' });
}

function createDefaultMenu() {
  if (Menu.getApplicationMenu()) return;

  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() { shell.openExternal('https://github.com/rbiggers/electron-pandora'); },
        },
        {
          label: 'Documentation',
          click() { shell.openExternal('https://github.com/rbiggers/electron-pandora/blob/master/README.md'); },
        },
        {
          label: 'Search Issues',
          click() { shell.openExternal('https://github.com/rbiggers/electron-pandora/issues'); },
        },
        {
          label: 'Check for Updates',
          click() { checkForUpdates(); },
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
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' },
        ],
      },
    );

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function initialize() {
  makeSingleInstance();

  function createWindow() {
    // Create the browser window.
    const windowOptions = {
      width: 1280,
      height: 720,
      titleBarStyle: 'hidden',
      title: app.getName(),
      webPreferences: {
        nodeIntegration: false,
      },
    };

    mainWindow = new BrowserWindow(windowOptions);

    // and load the index.html of the app.
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      mainWindow.webContents.openDevTools();
      mainWindow.maximize();
      devtron.install();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    registerGlobalShortcuts();

    createBrowserView();

    createDefaultMenu();

    checkForUpdates();
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    createWindow();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}

initialize();
