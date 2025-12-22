// electron.js code
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    transparent: false,
    fullscreen: false, // Start windowed with frame
    fullscreenable: true,
    backgroundColor: "#000000",
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false, // Don't show until ready
    icon: path.join(__dirname, "../source/img/fractal.png"),
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, "../source/index.html"));

  // Show window with fade-in effect when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    // Start maximized for best gaming experience
    mainWindow.maximize();
    mainWindow.setFullScreen(true);
  });

  // Open DevTools in development (uncomment for debugging)
  // mainWindow.webContents.openDevTools();

  // Keyboard shortcuts for game window
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // F11 or F for fullscreen toggle
    if (
      (input.key === "F11" || input.key === "F" || input.key === "f") &&
      input.type === "keyDown" &&
      !input.control &&
      !input.alt
    ) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        mainWindow.unmaximize();
      } else {
        mainWindow.setFullScreen(true);
      }
    }
    // Alt+F4 or Ctrl+W to close
    if (
      (input.key === "F4" && input.alt) ||
      (input.key === "w" && input.control)
    ) {
      mainWindow.close();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
