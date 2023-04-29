const fs = require('fs');

// 读取JSON配置文件
function readConfigFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (error) {
        console.error('Error reading the config file:', error);
    }
}

// 写入JSON配置文件
function writeConfigFile(filePath, data) {
    try {
        const jsonData = JSON.stringify(data, null, 4);
        fs.writeFileSync(filePath, jsonData, 'utf8');
    } catch (error) {
        console.error('Error writing the config file:', error);
    }
}

function getElementById(configData,id)
{
    
    const existingTaskIndex = configData.findIndex(item => item.id === id);
    if (existingTaskIndex !== -1) {
       return configData[existingTaskIndex] ;
    } else {
      return null;
    }

}


// 更新或添加任务
function updateOrAddTask(configData, task) {
    const existingTaskIndex = configData.findIndex(item => item.id === task.id);

    if (existingTaskIndex !== -1) {
        configData[existingTaskIndex] = task;
        return false;
    } else {
        configData.push(task);
        return true;
    }
}

// 根据ID删除任务
function deleteTaskById(configData, taskId) {
    const taskIndex = configData.findIndex(item => item.id === taskId);

    if (taskIndex !== -1) {
        configData.splice(taskIndex, 1);
    } else {
        console.log(`Task with ID ${taskId} not found.`);
    }
}


module.exports={
    readConfigFile:readConfigFile,
    writeConfigFile:writeConfigFile,
    updateOrAddTask:updateOrAddTask,
    deleteTaskById:deleteTaskById,
    getElementById:getElementById

}
