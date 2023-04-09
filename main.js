// Modules to control application life and create native browser window
const electron = require('electron')
const path = require('path')
const qianggou = require('./duoxiancheng')
const queryContract = require("./dealContract")
const schedule = require('node-schedule');
const { dialog } = require('electron')
const punk = require('./btcord')
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
  punk.setmainWindow(mainWindow);
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

//app.commandLine.appendSwitch('proxy-server', 'socks5://127.0.0.1:10808');

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

  ipcMain.on('info:importprikey', async (e, value) => {
    console.log("info:importprikey");

    
    filename = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (filename.canceled == false) {
      qianggou.importprikey(filename.filePaths);
    }

    //result = 


    //mainWindow.webContents.send("info:importprikey", {  });
  })

  

  ipcMain.on('info:exportprikey', async (e, value) => {
    console.log("info:exportprikey");

    
    filename = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (filename.canceled == false) {
      qianggou.exportprikey(filename.filePaths);
    }

    //result = 


    //mainWindow.webContents.send("info:importprikey", {  });
  })


  ipcMain.on('info:pilianglingshui', async (e, value) => {
    console.log("info:pilianglingshui");
    filename = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (filename.canceled == false) {
      try {
        const dynamicModule = require(filename.filePaths[0]);
        if (typeof dynamicModule.start === 'function') {
          await dynamicModule.start();
        } else {
          console.error(`Error: The file ${filename} does not have a start function.`);
        }
        clearModuleCache(filename.filePaths[0]);
      } catch (error) {
        clearModuleCache(filename.filePaths[0]);
        console.error(`Error loading and executing file: ${filename}`, error);
      }
     
    }

  })

  ipcMain.on('info:getmaxgasprice', async (e, value) => {
    console.log("info:getmaxgasprice");
    qianggou.CalcGasPrice();


  })

  

  ipcMain.on('info:boxcheck', async (e, value) => {
    console.log("info:boxcheck");
    qianggou.boxcheck(value);


   

  })

  ipcMain.on('info:loadlocalABI', async (e, value) => {
    console.log("info:loadlocalABI");
   

    
    filename = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (filename.canceled == false) {
      result = await queryContract.loadlocalABI(filename.filePaths[0])

      mainWindow.webContents.send("info:queryabi", { result });
    }
   

  })


  var renwu = null;

  //启动定时监控，关闭定时监控
  ipcMain.on('info:startgetmaxgasprice', async (e, value) => {
    console.log("info:startgetmaxgasprice");
    qianggou.CalcGasPrice();
    //开启定时任务
    if (renwu == null) {
      renwu = task1()
    }
    
    else {
      
    }
  })

  ipcMain.on('info:mytest', async (e, value) => {
    console.log("info:mytest");
    qianggou.mytest();
   
  })

  const task1 = async ()=>{
    //每分钟的1-10秒都会触发，其它通配符依次类推
    //console.log("123111");
    //console.log(value);
    //console.log(count);
    const j = schedule.scheduleJob('*/5 * * * * *', async ()=>{
      
     await  qianggou.CalcGasPrice();
    })
    return j;
  }
  ipcMain.on('info:getbtccookiepath', async (e, value) => {
    console.log("info:getbtccookiepath");
    filename = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (filename.canceled == false) {

      mainWindow.webContents.send("info:getbtccookiepath", { "filename":filename.filePaths });
    }
  })


  ipcMain.on('info:btcsetting', async (e, value) => {
    console.log("info:btcsetting");
    punk.setInit(value)
  })

  ipcMain.on('info:punkimgdownload', async (e, value) => {
    console.log("info:punkimgdownload");
    punk.punkimgdownload()
  })

  ipcMain.on('info:punkselectblockinfo', async (e, value) => {
    console.log("info:punkselectblockinfo");
    punk.punkselectblockinfo()
  })

  ipcMain.on('info:punkidselect', async (e, value) => {
    console.log("info:punkidselect");
    var info = punk.punkidselect(value.punkid)
    mainWindow.webContents.send("info:getbtccookiepath", { info });

  })


}
function clearModuleCache(modulePath) {
  try {
    const resolvedPath = require.resolve(modulePath);
    delete require.cache[resolvedPath];
  } catch (error) {
    console.error(`Error clearing module cache for: ${modulePath}`, error);
  }
}

eventListener();