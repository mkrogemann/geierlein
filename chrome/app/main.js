const electron = require('electron');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, hostipc;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, show: false});

  mainWindow.once('ready-to-show', mainWindow.show);

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../content/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  let ignoreFileChanged = false;
  mainWindow.on('close', (e) => {
    if (ignoreFileChanged) {
      return;
    }

    // don't close dialog for now
    e.preventDefault();

    hostipc.askSaveChanges()
    .then((saveChanges) => {
      if (saveChanges) {
        hostipc.save();
      }

      ignoreFileChanged = true;
      mainWindow.close();
    })
    // do nothing on cancel
    .catch(() => undefined);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  mainWindow.once('ready-to-show', () => {
    for(let i = 1; i < process.argv.length - 1; i ++) {
      if (process.argv[i] === '-load') {
        hostipc.openFile(process.argv[i + 1]);
      }
    }
  })
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

hostipc = require('./hostipc')(
  (...args) => mainWindow.send(...args)
);

require('./menu')(
  hostipc
);

