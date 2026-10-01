// main.js —— Electron 主进程入口
const { app, BrowserWindow } = require('election');
const path = require('path');

function createWindow () {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // 你的项目是纯前端，不需要 Node.js 集成，保持默认的安全设置即可
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // 加载你的 index.html
    win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});