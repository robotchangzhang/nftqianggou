const axios = require('axios');

//bsc
//tokenaddress = "0x6B653D6dC0EECbb94256fb269593AA0A8736a3bD"
//apiurl = 'https://api.bscscan.com/api?module=contract&action=getsourcecode&address='

//eth
//tokenaddress = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"
//apiurl = 'https://api.etherscan.com/api?module=contract&action=getsourcecode&address='


//matic
//tokenaddress = "0x2f85e99067ddefb7f6d0f71efa32cc0056d322bb"
//apiurl = 'https://api.polygonscan.com/api?module=contract&action=getsourcecode&address='
async function getContract(url, address) {
    return new Promise((resolve, reject) => {
        axios.post(url + address).then(res => {
            if (res.data.status == 1) {
                resolve([true, res.data.result[0]]);

            }
            else {
                reject([false, "未找到"]);
            }
        })
    })
}

async function startEx(apiurl, tokenaddress) {
    let sourcecode = await getContract(apiurl, tokenaddress);
    // 获取开源智能合约的ABI
    if (sourcecode[0] && sourcecode[1].ABI!= "Contract source code not verified") {
        var stringABI = sourcecode[1].ABI;
        //将string abi 转换成json;
        var jsonabi = JSON.parse(stringABI);
        console.log(jsonabi);
        //将json 转换成3种可调用的function
        /*
            abi type=function分为三种情况：
            1、只读函数 ， "stateMutability": "view"
            2、写函数，不需要主币支付费用  "stateMutability": "nonpayable",
            3、写函数，需要主币支付费用  "stateMutability": "payable",  
        */
       return fenxiabi(jsonabi);
    }
    else
    {
        return [false]
    }
    //console.log(sourcecode);
}

function fenxiabi(jsonabi) {
    var viewabi = new Map();
    var payableabi = new Map();
    var nonpayable = new Map();
    jsonabi.forEach(element => {
        if (element.type == 'function') {
            if (element.stateMutability == 'view') {
                viewabi.set(element.name, element);
            }
            else if (element.stateMutability == 'nonpayable') {
                nonpayable.set(element.name, element);
            }
            else if (element.stateMutability == 'payable') {
                payableabi.set(element.name, element);
            }
        }
    });
    //这三种方法没问题了，查询没问题了
    console.log("----------------------------------------------");
    console.log("view");
    console.log(viewabi);

    console.log("----------------------------------------------");
    console.log("nonpayable");
    console.log(nonpayable);

    console.log("----------------------------------------------");
    console.log("payable");
    console.log(payableabi);
    return [true, viewabi, nonpayable, payableabi];
}

async function start(value) {
    return await startEx(value.apiurl,value.contractaddress);
}

module.exports = {
    start,start
}