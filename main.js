// Electron Declarations.
const electron = require("electron");
const app = electron.app;
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const webContents = electron.webContents;
const remote = electron.remote;
const Menu = electron.Menu;
const { menubar } = require("menubar");
const defaultMenu = require("electron-default-menu");
require("@electron/remote/main").initialize();

// Helper Functions.
const path = require("path");
const url = require("url");

// Declare Menubar and Options.
let mainIconPath;
if (process.platform === "win32") {
  mainIconPath = path.join(__dirname, "assets/iconWhite.png");
} else {
  mainIconPath = path.join(__dirname, "assets/iconTemplate.png");
}
const playingIconPath = path.join(__dirname, "assets/iconOrange.png");

var options = {
  icon: mainIconPath,
  browserWindow: {
    width: 380,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true,
    },
  },
  preloadWindow: true,
};
var mb = menubar(options);

// Options Variables.
var mediaKeysBound = true;
var functionKeysBound = false;
var indicator = true;
var isPlaying = false;

// Global functions can be triggered by Javascript in the rendered index.html page.

// Playing sets the icon orange if the playing indicator is turned on.
// Playing state is determined by 'media-started-playing' event.
global.playing = function () {
  if (indicator) {
    mb.tray.setImage(playingIconPath);
  }
  isPlaying = true;
};

// Paused sets the icon white if the playing indicator is turned on.
// Pause state is determined by 'media-paused' event.
global.paused = function () {
  if (indicator) {
    mb.tray.setImage(mainIconPath);
  }
  isPlaying = false;
};

// Right Click Menu Template
// Bind Media Keys toggles global media key controls.
// Show Playing Indicator changes menu icon based on playing state.
// Quit quits. Obviously.
const rcMenuTemplate = [
  {
    label: "Bind Media Keys",
    type: "checkbox",
    checked: mediaKeysBound,
    click() {
      if (mediaKeysBound) {
        unregisterKeys("media");
      } else {
        registerKeys("media");
      }
      mediaKeysBound = !mediaKeysBound;
    },
  },
  {
    label: "Bind Function Keys",
    type: "checkbox",
    checked: functionKeysBound,
    click() {
      if (functionKeysBound) {
        unregisterKeys("function");
      } else {
        registerKeys("function");
      }
      functionKeysBound = !functionKeysBound;
    },
  },
  {
    label: "Show Playing Indicator",
    type: "checkbox",
    checked: indicator,
    click() {
      if (indicator) {
        mb.tray.setImage(mainIconPath);
      } else {
        if (isPlaying) {
          mb.tray.setImage(playingIconPath);
        }
      }
      indicator = !indicator;
    },
  },
  {
    label: "Quit",
    click() {
      mb.app.quit();
    },
  },
];

// Create right click menu.
const rcMenu = Menu.buildFromTemplate(rcMenuTemplate);

// Create global media key shortcuts.
var registerKeys = function (keySet) {
  if (keySet === "function") {
    const reg = globalShortcut.register("F8", () => {
      // Media keys trigger javascript functions in the index.html file.
      mb.window.webContents.executeJavaScript("playpause()");
    });
    const regNext = globalShortcut.register("F9", () => {
      mb.window.webContents.executeJavaScript("next()");
    });
    const regPrevious = globalShortcut.register("F7", () => {
      mb.window.webContents.executeJavaScript("previous()");
    });
  } else {
    const reg = globalShortcut.register("MediaPlayPause", () => {
      // Media keys trigger javascript functions in the index.html file.
      mb.window.webContents.executeJavaScript("playpause()");
    });
    const regStop = globalShortcut.register("MediaStop", () => {
      mb.window.webContents.executeJavaScript("stop()");
    });
    const regNext = globalShortcut.register("MediaNextTrack", () => {
      mb.window.webContents.executeJavaScript("next()");
    });
    const regPrevious = globalShortcut.register("MediaPreviousTrack", () => {
      mb.window.webContents.executeJavaScript("previous()");
    });
  }
};

// Unregister media keys.
var unregisterKeys = function (keySet) {
  if (keySet === "function") {
    globalShortcut.unregister("F7");
    globalShortcut.unregister("F8");
    globalShortcut.unregister("F9");
  } else if (keySet === "media") {
    globalShortcut.unregister("MediaPlayPause");
    globalShortcut.unregister("MediaStop");
    globalShortcut.unregister("MediaNextTrack");
    globalShortcut.unregister("MediaPreviousTrack");
  } else {
    globalShortcut.unregisterAll();
  }
};

// Show window when the app first runs.
// A 1ms delay is required to fix a bug causing the window to disappear after spawning.
mb.on("ready", function ready() {
  // Get template for default menu
  const menu = defaultMenu(app, shell);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  setTimeout(function () {
    mb.showWindow();
  }, 1);
});

// Register the media keys and tray menu once the app starts.
mb.on("after-create-window", function () {
  registerKeys();

  mb.tray.on("right-click", function () {
    mb.tray.popUpContextMenu(rcMenu);
  });
});

// Unregister media keys upon exit.
mb.app.on("will-quit", function () {
  unregisterKeys();
});
