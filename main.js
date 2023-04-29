// Modules to control application life and create native browser window
const electron = require('electron')
const path = require('path')
const duoxiancheng = require('./duoxiancheng_v1')
const queryContract = require("./dealContract")
const schedule = require('node-schedule');
const { dialog } = require('electron')
const punk = require('./btcord')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const confighelper = require("./confighandle")



let mainWindow = null
const qianggou =new duoxiancheng.EthereumManager();
const configFilePath = "./taskconfig.json"
const configData = confighelper.readConfigFile(configFilePath);

const tasklist =[]  //用来管理任务队列，新增任务，删除任务的是，要从这里面增加删除。
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1900,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: true,
      contextIsolation: false

    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./web/index.html')
  duoxiancheng.setmainWindow(mainWindow);
  
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
var bInitTask = false;

async function alltask()
{
  if(bInitTask)
  {
    return
  }
  bInitTask = true;
    //启动 task
    for(var i=0;i<configData.length;i++)
    {
        var data = configData[i];
        var renwuj =await taskcreate(data);
       
    }
}

function gettime(exectime) {
  var result = [true];
  let schedule = null;
  var nowexectime = Number(exectime)
  switch (nowexectime) {
    case 60000: // 1 minute
      schedule = '*/1 * * * *';
      break;
    case 3600000: // 1 hour
      schedule = '0 * * * *';
      break;
    case 86400000: // 1 day
      schedule = '0 0 * * *';
      break;
    case 604800000: // 1 week
      schedule = '0 0 * * 0';
      break;
    case 2628000000: // 1 month (approx.)
      schedule = '0 0 1 * *';
      break;
    case 31536000000: // 1 year (approx.)
      schedule = '0 0 1 1 *';
      break;
    // 在这里添加更多的case，根据您的需求
    default:
      console.log('Invalid exectime value');
      ;
  }
  if (schedule != null) {
    result.push(schedule)
  }
  else {
    result[0] = false;
  }
  return result;
}

const taskcreate = async (data) => {
  
  timeresult = gettime(data.exectime)
  if(timeresult[0])
  {
    const j = schedule.scheduleJob(timeresult[1], async () => {
        //脚本地址
        data = confighelper.getElementById(configData,data.id);

        if(data == null ||  Number(data.rematimes)<1)
        {
          return;
        }
        filename = data.scriptpath
        try {
          const dynamicModule = require(filename);
          if (typeof dynamicModule.start === 'function') {
            
            await dynamicModule.start(data);
          } else {
            console.error(`Error: The file ${filename} does not have a start function.`);
          }
          data.rematimes = Number(data.rematimes)-1;
          data.lastExecTime = formatDate( new Date());
          confighelper.updateOrAddTask(configData,data);
          confighelper.writeConfigFile(configFilePath, configData);
          //给页面发送通知
          mainWindow.webContents.send("info:taskInit", { configData});
          clearModuleCache(filename);
        } catch (error) {
          clearModuleCache(filename);
          console.error(`Error loading and executing file: ${filename}`, error);
        }

    })
    tasklist.push({"id":data.id,"renwuj":j})
    return j;
  }
  
}

async function addTask(taskData) {
  // Update configData and save it to the file
 

  // Create a new task and add it to the tasklist
  const newTask = await taskcreate(taskData);

}

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
            dynamicModule.start(value);
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


  ipcMain.on('info:selectpath', async (e, value) => {
    console.log("info:selectpath");
    filename = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (filename.canceled == false) {
       
       value.filepath = filename.filePaths[0]
       mainWindow.webContents.send("info:selectpath", value);
    }
    else
    {

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
  ipcMain.on('info:taskInit', async (e, value) => {
    console.log("info:taskInit");
    alltask()
    mainWindow.webContents.send("info:taskInit", { configData});
    
  })

  ipcMain.on('info:taskedit', async (e, value) => {
    console.log("info:taskedit");
    var result = confighelper.updateOrAddTask(configData, value.editdata);

    confighelper.writeConfigFile(configFilePath, configData);
    if(result)
    {
      //说明新增了任务
      await taskcreate(value.editdata);
    }
    else
    {
      //说明修改了任务,需要删除旧任务，然后增加新任务
      const taskIndex = tasklist.findIndex((task) => task.id === value.editdata.id);
      if (taskIndex !== -1) {
        tasklist[taskIndex].renwuj.cancel();
        tasklist.splice(taskIndex, 1);
      }

      await taskcreate(value.editdata);
    }
    //mainWindow.webContents.send("info:taskInit", { configData});
    
  })

  ipcMain.on('info:taskdelete', async (e, value) => {
    console.log("info:taskdelete");
    confighelper.deleteTaskById(configData, value.id);

    confighelper.writeConfigFile(configFilePath, configData);

    //任务队列需要取消之前的任务
    const taskIndex = tasklist.findIndex((task) => task.id === value.id);
    if (taskIndex !== -1) {
      tasklist[taskIndex].renwuj.cancel();
      tasklist.splice(taskIndex, 1);
    }
    //mainWindow.webContents.send("info:taskInit", { configData});
    
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


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}