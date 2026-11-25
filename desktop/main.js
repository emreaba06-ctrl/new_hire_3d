// New Hire 3D desktop shell.
// - Serves the game from a private app:// scheme so models and voices load like on the web.
// - Prefers the dedicated GPU.
// - Locked down: no Node access in the page, no navigating away, only https links open (in the browser).
// - Checks GitHub Releases for updates on launch and offers to restart once one is downloaded.
const { app, BrowserWindow, protocol, net, shell, session, Menu, dialog } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const { autoUpdater } = require("electron-updater");

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
const ROOT = path.join(__dirname, "game");
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 600, backgroundColor: "#1b2433", title: `New Hire 3D ${app.getVersion()}`,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, backgroundThrottling: false }
  });
  win.removeMenu();
  win.loadURL("app://game/index.html");
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("app://game/")) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === "F5") { win.reload(); e.preventDefault(); }
  });
}

function setupUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", async info => {
    const { response } = await dialog.showMessageBox(win, {
      type: "info", buttons: ["Restart now", "Later"], defaultId: 0, cancelId: 1,
      title: "Update ready", message: `New Hire 3D ${info.version} is ready.`,
      detail: "Restart to play the new version. Your progress is kept. If you pick Later, it installs when you close the game."
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", () => { /* offline or GitHub unreachable: just keep playing */ });
  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  protocol.handle("app", req => {
    const u = new URL(req.url); const rel = decodeURIComponent(u.pathname).replace(/^\/+/, "");
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) return new Response("Forbidden", { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false)); // no camera, mic or location
  Menu.setApplicationMenu(null);
  createWindow();
  setupUpdates();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
