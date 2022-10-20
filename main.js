// Modules to control application life and create native browser window
const electron = require('electron')
const path = require('path')
const qianggou = require('./duoxiancheng')
const queryContract = require("./dealContract")

const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow = null
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: true,
      contextIsolation: false

    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./web/index.html')
  qianggou.setmainWindow(mainWindow);
  //const mainMenu = Menu.buildFromTemplate(menuTemplate);
  //Menu.setApplicationMenu(mainMenu);
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


const eventListener = async () => {
  ipcMain.on('info:initweb3', async (e, value) => {
    console.log("info:initweb3");
    console.log(value)
    result = qianggou.initWeb3(value)
    
    mainWindow.webContents.send("info:initweb3", { result });
  })

  ipcMain.on('info:qianggou', async (e, value) => {
    console.log("info:qianggou");
    console.log(value)
    result = qianggou.qianggou(value)

    mainWindow.webContents.send("info:qianggou", { result });
  })

  ipcMain.on('info:test', async (e, value) => {
    console.log("info:test");
    console.log(value)
    result = qianggou.test(value)

    mainWindow.webContents.send("info:test", { result });
  })

  ipcMain.on('info:queryabi', async (e, value) => {
    console.log("info:queryabi");
    console.log(value)

    result = await queryContract.start(value)

    mainWindow.webContents.send("info:queryabi", { result });
  })

  ipcMain.on('info:abishiyong', async (e, value) => {
    console.log("info:abishiyong");
    console.log(value)
    result = qianggou.abishiyong(value)
    //result = await queryContract.abishiyong(value)

    //mainWindow.webContents.send("info:abishiyong", { result });
  })

  ipcMain.on('info:accounts', async (e, value) => {
    console.log("info:accounts");
    console.log(value)
    result = qianggou.accounts();
    console.log(result);

    mainWindow.webContents.send("info:accounts", { result });
  })

  ipcMain.on('info:creatpriatenumber', async (e, value) => {
    console.log("info:creatpriatenumber");
    console.log(value)
    result = qianggou.creatpriatenumber(value);
   

    mainWindow.webContents.send("info:creatpriatenumber", { result });
  })


}

eventListener();