// 配置文件数据（请将下面的JSON字符串替换为您的配置文件内容）
// const configFileData = '[{"id":1,"taskname":"HOPE自动脚本","scriptpath":"./swap.js","exectime":1000,"rematimes":9999,"exectype":"now","execwallet":"./prikey.prikey","lastExecTime":"1970-01-01"}]';
// const configData = JSON.parse(configFileData);
taskInit()
configData = []
const tableBody = document.querySelector('#configTable tbody');
const addRowButton = document.querySelector('#addRowButton');
//displayConfigData()
function displayConfigData() {
    tableBody.innerHTML = '';
    for (const item of configData) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        for (const key in item) {
            const cell = document.createElement('td');
            if (key === 'exectime') {
                const select = document.createElement('select');
                const timeOptions = [
                    { label: '1分', value: 60000 },
                    { label: '15分钟', value: 900000 },
                    { label: '1小时', value: 3600000 },
                    { label: '12小时', value: 43200000 },
                    { label: '1天', value: 86400000 },
                    { label: '1周', value: 604800000 },
                    { label: '1年', value: 31536000000 }
                ];

                timeOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.textContent = option.label;
                    opt.value = option.value;
                    if (item[key] == option.value) {
                        opt.selected = true;
                    }
                    select.appendChild(opt);
                });

                select.setAttribute('data-key', key);
                select.disabled = true;
                cell.appendChild(select);
            } else if ((key !== 'id') || (key !== 'lastExecTime')) {
                const input = document.createElement('input');
                input.value = item[key];
                input.setAttribute('data-key', key);
                input.disabled = true;
                cell.appendChild(input);
            } else {
                cell.textContent = item[key];
            }
            row.appendChild(cell);
        }
        const editCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.textContent = '编辑';
        editButton.classList.add('edit');
        editButton.addEventListener('click', () => enableEditing(row));
        editCell.appendChild(editButton);
        row.appendChild(editCell);

        const saveCell = document.createElement('td');
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.addEventListener('click', () => saveRow(row));
        saveCell.appendChild(saveButton);
        row.appendChild(saveCell);

        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => deleteRow(row));
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        tableBody.appendChild(row);
    }
}

function enableEditing(row) {

    const editButton = row.querySelector('button.edit');
    editButton.disabled = true;
    const inputs = row.querySelectorAll('input ,select');
    var id = null;

    inputs.forEach((input, index) => {
        input.disabled = false;
        if (input.getAttribute('data-key') === 'id') {
            id = input.value;
        }

        if ((input.getAttribute('data-key') === 'scriptpath') || (input.getAttribute('data-key') === 'execwallet')) {
            const browseButton = document.createElement('button');
            browseButton.textContent = '浏览';
            browseButton.setAttribute('data-input-id', index);
            browseButton.onclick = async () => {
                onSelectPath(id, input.getAttribute('data-key'));
            };
            input.parentNode.appendChild(browseButton);

        }
    });

   

}

async function onSelectPath(id, type) {
    ipcRenderer.send('info:selectpath', { id, type })
}

ipcRenderer.on('info:selectpath', (e, value) => {

    id = Number(value.id);
    type = value.type;
    row = findRowById(id);
    if (row != null) {
        const inputs = row.querySelectorAll('input');

        inputs.forEach(input => {
            input.disabled = false;
            if (input.getAttribute('data-key') === type) {
                input.value = value.filepath;
            }

        });
    }


});

function findRowById(id) {
   debugger
    const rows = tableBody.querySelectorAll('tr');
    for (const row of rows) {
        const rowId = parseInt(row.getAttribute('data-id'));
        if (rowId === id) {
            return row;
        }
    }
    return null;
}


function saveRow(row) {


    const inputs = row.querySelectorAll('input, select');
    const rowIndex = Array.from(tableBody.children).indexOf(row);
    inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        if(key == "exectime")
        {
            configData[rowIndex][key] = Number(input.value);
        }
        else
        {
            configData[rowIndex][key] = input.value;
        }
        
        input.disabled = true;
    });

    // 查找所有文本内容为"浏览"的按钮并删除它们
    const browseButtons = row.querySelectorAll('button[data-input-id]');
    for (const button of browseButtons) {
        button.parentNode.removeChild(button);
    }

   

    const editButton = row.querySelector('button.edit');
    editButton.disabled = false;

    configedit(configData[rowIndex]);
    //将修改完的提交到后台

    //console.log(configData); // 输出更新后的configData，实际应用中请根据需要保存到文件或服务器
}

function configedit(editdata) {
    ipcRenderer.send('info:taskedit', { "editdata": editdata })
}

function taskInit() {
    ipcRenderer.send('info:taskInit', {})
}

function deleteRow(row) {
    id = row.getAttribute('data-id');
    ipcRenderer.send('info:taskdelete', { id })


   
    if (row) {
        
        row.parentNode.removeChild(row);
        // Call the function to delete the task from the config file.
        // deleteTaskById(configData, taskId);
        const taskIndex = configData.findIndex(item => item.id === id);

        if (taskIndex !== -1) {
            configData.splice(taskIndex, 1);
        } else {
            // console.log(`Task with ID ${taskId} not found.`);
        }
        //displayConfigData();
    }

}

ipcRenderer.on('info:taskInit', (e, value) => {


    configData = value.configData;
    displayConfigData();

});

function addRow() {
    const newRowData = {
        id: (configData.length + 1),
        taskname: "",
        scriptpath: "",
        exectime: 0,
        rematimes: 0,
        exectype: "",
        execwallet: "",
        lastExecTime: "1970-01-01"
    };
    configData.push(newRowData);
    displayConfigData();
}