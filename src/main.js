const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const DiscordRPC = require("./rpc.js");

// Discord Rich Presence
let discordRPC = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    transparent: false,
    fullscreen: false,
    fullscreenable: true,
    backgroundColor: "#000000",
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Need this for preload to work with IPC
      devTools: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false, // Don't show until ready
    icon: path.join(__dirname, "../source/img/fractal.png"),
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, "../source/index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
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

app.whenReady().then(async () => {
  createWindow();

  // Initialize Discord Rich Presence
  discordRPC = new DiscordRPC();
  await discordRPC.connect();

  // Handle RPC updates from renderer
  ipcMain.on("rpc-update", (event, state) => {
    if (discordRPC) {
      discordRPC.updateState(state);
    }
  });

  // Handle screenshot saving
  ipcMain.handle("save-screenshot", async (event, dataUrl) => {
    try {
      // Get user's documents folder
      const documentsPath = app.getPath("documents");
      const screenshotDir = path.join(documentsPath, "FRACTAL", "screenshots");

      // Create directory if it doesn't exist
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `fractal_${timestamp}.png`;
      const filepath = path.join(screenshotDir, filename);

      // Convert data URL to buffer and save
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(filepath, base64Data, "base64");

      return { success: true, path: filepath };
    } catch (error) {
      console.error("Screenshot save error:", error);
      return { success: false, error: error.message };
    }
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async function () {
  // Cleanup Discord RPC
  if (discordRPC) {
    await discordRPC.disconnect();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
