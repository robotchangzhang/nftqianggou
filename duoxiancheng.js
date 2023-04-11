//这里用bsc 链举例子
//加载web3的库
var Web3 = require('web3');

var moment = require('moment');
//用私钥将交易内容签名
var EthereumTx = require('ethereumjs-tx');
const util = require('ethereumjs-util')
//这里是加载私钥的部分

const { Common } = require('@ethereumjs/common');
const HttpsProxyAgent = require('https-proxy-agent')

require('dotenv').config()
const { env } = process
const proxy = env.PROXYURL // HTTP/HTTPS proxy to connect to
const useproxy = Number(env.PROXYUSE)

const EthereumTx1559 = require('@ethereumjs/tx');
var web4 = new Web3()

var fs = require('fs');
var mainWindow = null; //用来给前台发信息
var web3 = null;
var chainid = 1;
var nownetwork = 'eth';
var prikeyfile = "./prikey.prikey";
var priKeys = getPriKeys(prikeyfile)
process.env.UV_THREADPOOL_SIZE = 20

function isFileExist(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

function getPriKeys(prikeyPath) {
    var arr = new Array();
    var exists = isFileExist(prikeyPath);
    if (exists) {
        var filecon = fs.readFileSync(prikeyPath).toString();
        filecon = filecon.replace("\r", "");

        var privKeyFile = filecon.split("\n");


        for (line in privKeyFile) {
            privKeyFile[line] = privKeyFile[line].replace("0x", "");
            //console.log(privKeyFile[line]);
            if (privKeyFile[line] != "") {
                arr.push(new Buffer.from(privKeyFile[line].trim(), "hex"))
            }

        }
        //console.log(arr);
        return arr;
    }


}

function addprikey(str, filename) {
    fs.appendFile(filename, str, (err, data) => {
        if (err) throw err;
    });
}


function initWeb3(value) {
    if (web3 != null) {

        web3 = null;
    }
    if (value.webtype == 'rpc') {
        if(useproxy ==1)
        {
            var providers = new Web3.providers.HttpProvider(value.weburl,{
                agent: {
                  https: HttpsProxyAgent(
                    proxy
                  ),
                },
              })
            var rpcweb3 = new Web3(providers);
            web3 = rpcweb3;
        }
        else
        {
            var providers = new Web3.providers.HttpProvider(value.weburl)
            var rpcweb3 = new Web3(providers);
            web3 = rpcweb3;
        }

        
    }
    else if (value.webtype == 'ws') {
        var wscweb3 = new Web3(new Web3.providers.WebsocketProvider(value.weburl));
        web3 = wscweb3;
    }
    else {
        return false;
    }
    chainid = Number(value.chainid.toString())
    nownetwork = value.nownetwork;


    return true;
}





function getPriKey(prikeystring) {
    prikeystring = prikeystring.replace("0x", "")
    const privKey = new Buffer.from(prikeystring, "hex");
    return privKey;
}


//通过小数点多少位，转换对应的数据
function getweiname(tokendecimals = 18) {
    tokendecimals = Number(tokendecimals.toString())
    weiname = 'ether';

    switch (tokendecimals) {
        case 3:
            weiname = "Kwei";
            break;
        case 6:
            weiname = 'mwei';
            break;
        case 9:
            weiname = 'gwei';
            break;
        case 12:
            weiname = 'microether ';
            break;
        case 15:
            weiname = 'milliether';
            break;
        case 18:
            weiname = 'ether';
            break;
        default:
            weiname = 'ether';
            break;

    }
    return weiname;
}

//这里是将交易用私钥签名部分
function getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) {

    var rawTransaction = {
        "from": fromAddress,
        "nonce": web3.utils.toHex(nonceNum),
        "gasLimit": web3.utils.toHex(gaslimit),
        "gasPrice": web3.utils.toHex(gasPrice),
        "to": toAddress,
        "value": web3.utils.toHex(nbnb),
        "data": input,  //设置num属性
        "chainId": chainid //4:Rinkeby, 3:Ropsten, 1:mainnet


    };

    var tx = new EthereumTx(rawTransaction);
    tx.sign(privKey);
    var serializedTx = tx.serialize();
    return serializedTx;
}




function getEthRawTx1559(fromAddress, toAddress, input, nonceNum, privKey, maxPriorityFeePerGas, maxFeePerGas, nbnb, gaslimit) {

    //maxPriorityFeePerGas = web3.utils.toWei((2).toString(10), 'Gwei');
    //maxFeePerGas = web3.utils.toWei((50).toString(10), 'Gwei');
    var rawTransaction = {
        "from": fromAddress,
        "nonce": web3.utils.toHex(nonceNum),
        "gasLimit": web3.utils.toHex(gaslimit),
        //"gasPrice": web3.utils.toHex(gasPrice),
        "maxPriorityFeePerGas": web3.utils.toHex(maxPriorityFeePerGas),
        "maxFeePerGas": web3.utils.toHex(maxFeePerGas),
        "to": toAddress,
        "value": web3.utils.toHex(nbnb),
        "data": input,  //设置num属性
        "chainId": chainid, //4:Rinkeby, 3:Ropsten, 1:mainnet
        "type": '0x2', //EIP-1559

    };
    const common = Common.custom({ chainId: chainid })
    var tx = EthereumTx1559.FeeMarketEIP1559Transaction.fromTxData(rawTransaction, { common });
    var signedtx = tx.sign(privKey);

    var serializedTx = signedtx.serialize();
    return serializedTx;
}



//这里是将签名的内容发送到区块链网络中的代码
const signTransaction = async (fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit, gastype, gasmaxPriorityFeePerGas, gasmaxFeePerGas) => {

    var serializedTx;
    if (gastype == "defalut") {
        serializedTx = getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit)
    }
    else {
        serializedTx = getEthRawTx1559(fromAddress, toAddress, input, nonceNum, privKey, gasmaxPriorityFeePerGas, gasmaxFeePerGas, nbnb, gaslimit)
    }


    // Comment out these three lines if you don't really want to send the TX right now
    console.log(`Attempting to send signed tx:  ${serializedTx.toString('hex')}`);
    var receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);
    if (receipt.status == true) {
        return true;
    }
    return false;
}

const getBNBBalance = async (address) => {
    let result = await web3.eth.getBalance(address)
    //由于使用的是大数模式，小数点有18位，所以获得的balance 要除以10^18次方才是正确的数据
    //或者使用自带的转换工具
    //原始区块链数据中存的BNB的数量是

    let balance = web3.utils.fromWei(result.toString(10), getweiname());
    return balance;
}
//私钥，合约地址，inputdata，主币数量，gas费，最大gasuse
const qianggouNFT = async (priKey, walletaddress, inputdata, value, gas, ngasLimit, gastype, maxPriorityFeePerGas, maxFeePerGas) => {
    //获得自己的地址
    var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');


    var toAddress = walletaddress

    var nsendETH = value
    //假设交易 0.008个bnb
    var nbnb = web3.utils.toWei((nsendETH).toString(10), 'ether');
    //设置gasprice 为 5G wei
    var gasPrice = web3.utils.toWei((gas).toString(10), 'Gwei');
    var gasmaxPriorityFeePerGas = web3.utils.toWei((maxPriorityFeePerGas).toString(10), 'Gwei');
    var gasmaxFeePerGas = web3.utils.toWei((maxFeePerGas).toString(10), 'Gwei');
    //设置 gaslimit 为 420000
    var gaslimit = ngasLimit;
    //没有调用智能合约，将input设置为空
    var input = inputdata;
    //获得下一次交易的数
    console.log("发送地址是：" + fromAddress)
    var nonceCnt = await web3.eth.getTransactionCount(fromAddress);
    let reslut = await signTransaction(fromAddress, toAddress, input, nonceCnt, priKey, gasPrice, nbnb, gaslimit, gastype, gasmaxPriorityFeePerGas, gasmaxFeePerGas)
    if (reslut) {
        //console.log("交易成功")
        sendmsg(fromAddress + "交易成功");
    }
    else {
        //console.log("交易失败")
        sendmsg(fromAddress + "交易失败");
    }
}

function getNowMilliSecond() {
    return Math.floor(Date.now());
}

const testbalance = async (i, priKey) => {

    i = i + 1
    try {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
    }
    catch (e) {
        return;
    }

    //console.log("地址：" + fromAddress)
    var balance = await getBNBBalance(fromAddress);
    //if (Number(balance) > 0) 
    {
        msg = ("时间" + getNowMilliSecond() + "|第" + i + "个" + "地址:" + fromAddress + "有" + balance + "个" + nownetwork);
        sendmsg(msg);
    }



}

const getnonce = async (address) => {
    var nonceCnt = await web3.eth.getTransactionCount(address);
    //console.log("下一次交易数" + nonceCnt);
    return nonceCnt;
}


function test() {
    //var prikeyint = BigInt(0xaba9a9f7df9d19a5339073a9b5f2976d69b756dac39826a166353307d853cc80n); //这里填自己的私钥
    //启动程序
    /*for (var i = 0; i < 10; i++) {

       // main(i, prikeyint.toString(16))
       console.log(prikeyint.toString(16));
        prikeyint = prikeyint + 1n;
    }*/
    var i = 0;
    for (priKey of priKeys) {
        testbalance(i, priKey);
        i++;
    }
}

var url = require("url")
var querytring = require("querystring")

function read_csv_line(csvfile) {
    let csvstr = fs.readFileSync(csvfile, "utf8", 'r+');
    let arr = csvstr.split('\n');
    let canshumap = new Map();

    for (var i = 0; i < arr.length; i++) {
        var line = arr[i];
        let data = line.split(',');
        if (data != null) {
            let tmp = {};
            tmp.tokenId = data[0];
            tmp.rarity = data[1]
            canshumap.set(Number(tmp.tokenId), tmp);
            //array.push(line.split[','])
        }
    }
    return canshumap;
}
async function mytest() {
    var tokenIdmap = new Map();
    try {
        tokenIdmap = read_csv_line("jilu.csv");
    }
    catch (e) {
        addprikey("tokenId" + "," + "rarity" + "," + "type" + "," + "timbre" + "," + "frequency" + "," + "quality" + "," + "energy" + "," + "level" + "\n", "jilu.csv")
    }

    var nftaddress = "0x4B5C4b2bE2fe1656F8eFEdd27393c61A7357b6E7";
    var abi = JSON.parse('{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}')
    var tokenContract = new web3.eth.Contract([abi], nftaddress);
    var functionname = abi.name;
   

    for (var i = 0; i < 11000; i++) {
        if (tokenIdmap.has(i)) {

        }
        else {
            
            try {
                let result = await tokenContract.methods[functionname].apply(null, [i]).call()
                var arg = url.parse(result).query;
                var params = querytring.parse(arg);
                var type = "R";
                if (params.rarity == 2) {
                    type = "S"
                }
                if (params.rarity == 3) {
                    type = "SS"
                }
                if (params.rarity == 4) {
                    type = "SSS"
                }
                if (params.rarity == 5) {
                    type = "SSSS"
                }
                addprikey(params.tokenId + "," + params.rarity + "," + type + "," + params.timbre + "," + params.frequency + "," + params.quality + "," + params.energy + "," + params.level + "\n", "jilu.csv")
                console.log(result);
            }
            catch (e) {
                sendmsg( i + "未查询到");
            }
        }


    }
}

function qianggou(value) {
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var inputdata = value.inputdata;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
    var maxFeePerGas = value.maxFeePerGas;
    var gastype = value.nowgastype;


    for (priKey of priKeys) {

        const now = moment().unix();
        const DEADLINE = now + 60 * 20; //往后延迟20分钟
    
        var deadline = (DEADLINE).toString(10);

        okvalue = [].concat(inputdata);
        addressNo0x = util.privateToAddress(priKey).toString('hex')

        try {
            //只能替换第一个匹配的
            //okvalue[0] = okvalue[0].replace("myaddress", addressNo0x)
            //okvalue[0] = okvalue[0].replace("地址", addressNo0x)
            //用正则才能全部替换
            okvalue[0] = okvalue[0].replace(new RegExp("myaddress", 'g'), addressNo0x);
            okvalue[0] = okvalue[0].replace(new RegExp("我的地址", 'g'), addressNo0x);
            okvalue[0] = okvalue[0].replace(new RegExp("地址", 'g'), addressNo0x);
            okvalue[0] = okvalue[0].replace(new RegExp("deadline", 'g'), deadline);
            
        }
        catch (e) {
            ;
        }

        console.log("okvalue[0]:" + okvalue)
        qianggouNFT(priKey, nftaddress, okvalue[0], neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
        //break;
    }

}


function sendmsg(msg) {
    if (mainWindow != null) {
        mainWindow.webContents.send("info:msg", { msg });
    }
}

function setmainWindow(newmainWindow) {
    mainWindow = newmainWindow;
}

async function GetAbiInfoNoprikey(functionname,abi,abiokvalue,nftaddress)
{
   // var okvalue = [].concat[abiokvalue];
    var tokenContract = new web3.eth.Contract([abi], nftaddress);
    var functionname = abi.name;
    let result = await tokenContract.methods[functionname].apply(null, abiokvalue).call()
    return result;
}

async function GetAbiInfo(functionname,abi,abiokvalue,nftaddress)
{
    var results = []
    for (priKey of priKeys) {
        //这里要复制数字，不然就是指针模式
        var okvalue = [].concat(abiokvalue);
        // 创建abi二进制
        // 如果要填自己的地址 ,默认通配符是 myaddress
        const now = moment().unix();
        const DEADLINE = now + 60 * 20; //往后延迟20分钟
    
        var deadline = (DEADLINE).toString(10);

       

        address = "0x" + util.privateToAddress(priKey).toString('hex');
        for (var i = 0; i < okvalue.length; i++) {
            try {

                //只能替换第一个匹配的
                //okvalue[0] = okvalue[0].replace("myaddress", addressNo0x)
                //okvalue[0] = okvalue[0].replace("地址", addressNo0x)
                //用正则才能全部替换
                okvalue[i] = okvalue[i].replace(new RegExp("myaddress", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("我的地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("deadline", 'g'), deadline);
            
            }
            catch (e) {
                ;
            }
        }
    var tokenContract = new web3.eth.Contract([abi], nftaddress);
    var functionname = abi.name;
    let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
    results.push[address,result];

    }
    return results;
}

async function abishiyong(value,bsingle = false) {
    //return;
    var abi = value.useabi;
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
    var maxFeePerGas = value.maxFeePerGas;
    var gastype = value.nowgastype;
    for (priKey of priKeys) {
        //这里要复制数字，不然就是指针模式
        var okvalue = [].concat(value.okvalue);
        // 创建abi二进制
        // 如果要填自己的地址 ,默认通配符是 myaddress
        const now = moment().unix();
        const DEADLINE = now + 60 * 20; //往后延迟20分钟
    
        var deadline = (DEADLINE).toString(10);

       

        address = "0x" + util.privateToAddress(priKey).toString('hex');
        for (var i = 0; i < okvalue.length; i++) {
            try {

                //只能替换第一个匹配的
                //okvalue[0] = okvalue[0].replace("myaddress", addressNo0x)
                //okvalue[0] = okvalue[0].replace("地址", addressNo0x)
                //用正则才能全部替换
                okvalue[i] = okvalue[i].replace(new RegExp("myaddress", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("我的地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("deadline", 'g'), deadline);
            
            }
            catch (e) {
                ;
            }
        }
        if (abi.stateMutability == "view") {
            var tokenContract = new web3.eth.Contract([abi], nftaddress);
            var functionname = abi.name;
            let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
            sendmsg("地址：" + address + "调用方法：" + functionname + "结果为" + result);

        }
        else {
            var inputdata = web3.eth.abi.encodeFunctionCall(abi, okvalue);
            //如果10个号，直接多线程
            //qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
            //如果1000个号，还是用单线程模式
            if(bsingle)
            {
                try
            {
                await qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);

            }
            catch(e)
            {
                console.log(e)
            }
            }
            else
            {
                qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
            }
            
    }
        //break;
    }
}

async function abishiyongbyaddress(value,bsingle = false,nowaddress) {
    //return;
    var abi = value.useabi;
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
    var maxFeePerGas = value.maxFeePerGas;
    var gastype = value.nowgastype;
    for (priKey of priKeys) {
        //这里要复制数字，不然就是指针模式
        var okvalue = [].concat(value.okvalue);
        // 创建abi二进制
        // 如果要填自己的地址 ,默认通配符是 myaddress
        const now = moment().unix();
        const DEADLINE = now + 60 * 20; //往后延迟20分钟
    
        var deadline = (DEADLINE).toString(10);

       

        address = "0x" + util.privateToAddress(priKey).toString('hex');
        if(address != nowaddress)
        {
            continue;
        }
        for (var i = 0; i < okvalue.length; i++) {
            try {

                //只能替换第一个匹配的
                //okvalue[0] = okvalue[0].replace("myaddress", addressNo0x)
                //okvalue[0] = okvalue[0].replace("地址", addressNo0x)
                //用正则才能全部替换
                okvalue[i] = okvalue[i].replace(new RegExp("myaddress", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("我的地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("地址", 'g'), address);
                okvalue[i] = okvalue[i].replace(new RegExp("deadline", 'g'), deadline);
            
            }
            catch (e) {
                ;
            }
        }
        if (abi.stateMutability == "view") {
            var tokenContract = new web3.eth.Contract([abi], nftaddress);
            var functionname = abi.name;
            let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
            sendmsg("地址：" + address + "调用方法：" + functionname + "结果为" + result);

        }
        else {
            var inputdata = web3.eth.abi.encodeFunctionCall(abi, okvalue);
            //如果10个号，直接多线程
            //qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
            //如果1000个号，还是用单线程模式
            if(bsingle)
            {
                try
            {
                await qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);

            }
            catch(e)
            {
                console.log(e)
            }
            }
            else
            {
                qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
            }
            
    }
        //break;
    }
}

function creatpriatenumber(value) {
    var createnumber = Number(value.createnumber);
    try {
        for (var i = 0; i < createnumber; i++) {
            //创建私钥
            var result = web3.eth.accounts.create();
            privateKey = result.privateKey;
            //将私钥写入配置配件
            addprikey(privateKey + "\n", prikeyfile);
            //console.log(result);
        }
        sendmsg("添加" + createnumber + "个私钥成功");
    }
    catch (e) {
        sendmsg("添加" + createnumber + "个私钥失败<br> 请确认web3是否初始化");
    }
    return {};

}

function accounts() {
    priKeys = getPriKeys(prikeyfile);
    return priKeys.map(_key => { console.log("0x" + util.privateToAddress(_key).toString('hex')); return "0x" + util.privateToAddress(_key).toString('hex'); })
}

function importprikey(filepath) {
    var filename = filepath[0];
    var filecon = fs.readFileSync(filename).toString();
    filecon = filecon.replace("\r", "");

    var privKeyFile = filecon.split("\n");


    for (line in privKeyFile) {
        privKeyFile[line] = privKeyFile[line].replace("0x", "");
        //console.log(privKeyFile[line]);
        if (privKeyFile[line] != "") {
            prikey = new Buffer.from(privKeyFile[line].trim(), "hex");
            try {
                util.privateToAddress(prikey).toString('hex');
                addprikey(privKeyFile[line] + "\n", prikeyfile);
            }
            catch (e) {
                console.log("私钥:" + prikey + "导入失败");
            }
        }

    }
    sendmsg("导入完成");

}

async function CalcGasPrice() {
    let gasPrice = await web3.eth.getGasPrice();
    let nowgasprice = web3.utils.fromWei((gasPrice).toString(10), 'Gwei');
    if(Number(nowgasprice)<0.01)
    {
        nowgasprice = 0.01
    }
    let maxgasprice = Number(nowgasprice) * (1.125 ** 4);
    
    maxgasprice = Number(maxgasprice.toFixed(2));
    console.log(maxgasprice);
    mainWindow.webContents.send("info:setnowgasprice", { maxgasprice });
    return maxgasprice;

}

function exportprikey(filepath) {

    var filecon = fs.readFileSync(prikeyfile).toString();
    addprikey(filecon, filepath + "\\export.prikey");
    sendmsg("导出完成");


}

//归集的ETH 主币给一个地址，如果地址是自己，要排除,用传统模式，归集不需要掏额外的gas
async function guijieth(value) {
    var guijiethaddress = value.guijiethaddress;
    var inputdata = "";
    var gas = 5;
    var gaslimit = 21000;
    var gastype = "default";
    var addressmap = value.addressmap;
    var maxPriorityFeePerGas = 0;
    var maxFeePerGas = 0;
    //固定数量模式还是 百分比模式 ,pct or other
    var ethnumbertype = value.ethnumbertype;
    var ethnumber = value.ethnumber;
    var ethpct = value.ethpct;

    for (priKey of priKeys) {



        address = "0x" + util.privateToAddress(priKey).toString('hex');
        //如果包含要操作这个地址，就转
        if (guijiethaddress == address) {
            continue;
        }
        else if (addressmap.hash(address)) {
            //获取当前gas
            let gasPrice = await web3.eth.getGasPrice();
            let nowgasprice = web3.utils.fromWei((gasPrice).toString(10), 'Gwei');
            let xioahao = web3.utils.fromWei((Number(gasPrice) * Number(gaslimit)).toString(10), 'ether');

            let neth = Number(getBNBBalance(address));
            if (ethnumbertype == "pct") {
                //删掉gas 
                neth = neth * ethpct / 100 - Number(xioahao);
                await qianggouNFT(prikey, guijiethaddress, inputdata, neth, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
            }
            else {
                shengyu = neth - ethnumber - xioahao;
                if (shengyu < 0) {
                    //钱包eth 数量不够
                    continue;

                }
                else {
                    await qianggouNFT(prikey, guijiethaddress, inputdata, ethnumber, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }

            }

        }
    }
    //(priKey, walletaddress, inputdata, value, gas, ngasLimit, gastype, maxPriorityFeePerGas, maxFeePerGas)
}

var erc20 = require('./erc20.js')
var erc20abi = loadabi(erc20);

//加载abi
function loadabi(jsData) {
    var tmpabimap  = new Map();
    jsData.forEach(element => {
        if (element.type == "function") {
            sign = web4.eth.abi.encodeFunctionSignature(element);
            tmpabimap.set(sign, element);
        }
    });
    return tmpabimap;
}


const getTokenBalance = async (tokenaddress, address) => {
    //创建代币的智能合约函数
    var tokenContract = new web3.eth.Contract(erc20, tokenaddress);


    //调用代币的智能合约获取余额功能
   let result = await tokenContract.methods.balanceOf(address).call();

    //获得代币有多少位小数
    let decimals = await tokenContract.methods.decimals().call();
    //weiname = getweiname(decimals);
    //let tokenbalance = web3.utils.fromWei(result.toString(10), weiname);
    let tokenbalance = transnum(result,decimals);
    //获得代币的符号
    let symbol = await tokenContract.methods.symbol().call();

    //打印结果
    //console.log("地址:" + address + "有代币:" + symbol + "的数量是:" + tokenbalance);
    return tokenbalance;
}

//归集token接口，使用EIP1559
async function guijitoken()
{
    var guijiethaddress = value.guijiethaddress;
    var tokenaddress = value.tokenaddress;
    var inputdata = "";
    var gas = 5;
    var gaslimit = 210000;
    var gastype = "default";
    var addressmap = value.addressmap;
    var maxPriorityFeePerGas = 0;
    var maxFeePerGas = 0;
    //固定数量模式还是 百分比模式 ,pct or other
    var ethnumbertype = value.ethnumbertype;
    var ethnumber = value.ethnumber;
    var ethpct = value.ethpct;

    for (priKey of priKeys) {



        address = "0x" + util.privateToAddress(priKey).toString('hex');
        //如果包含要操作这个地址，就转
        if (guijiethaddress == address) {
            continue;
        }
        else if (addressmap.hash(address)) {
            //获取当前gas
            let gasPrice = await Number(CalcGasPrice()) +2;
            //获得代币数量
            let tokennumber = await getTokenBalance(tokenaddress,address);

            let neth = Number(getBNBBalance(address));
            if (ethnumbertype == "pct") {
                //删掉gas 
                neth = neth * ethpct / 100 - Number(xioahao);
                await qianggouNFT(prikey, guijiethaddress, inputdata, neth, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
            }
            else {
                shengyu = neth - ethnumber - xioahao;
                if (shengyu < 0) {
                    //钱包eth 数量不够
                    continue;

                }
                else {
                    await qianggouNFT(prikey, guijiethaddress, inputdata, ethnumber, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }

            }

        }
    }
}

function fenxiboduanEx(tokenid,tokenIdmap,start,end)
{
    var total = 0;
    
    var Rcount = 0;
    var Scount = 0;
    var SScount = 0;
    var SSScount = 0;
    var SSSScount = 0;
    
    for(var i=start;i<(end);i++)
    {
        if(tokenIdmap.has(i))
        {
            total++;
            var tmp = tokenIdmap.get(i);
            var rarity = Number(tmp.rarity);
            if(rarity ==1)
            {
                Rcount++;
            }
            else if(rarity == 2)
            {
                Scount++;
            }
            else if(rarity == 3)
            {
                SScount++;
            }
            else if(rarity == 4)
            {
                SSScount++;
            }
            else if(rarity == 5)
            {
                SSSScount++;
            }
        }
    }

    

    
    

    //写csv
    //总共有多少个盒子，开了多少个盒子，剩余的盒子中有多少个R，多少个S，开出来S的概率是多少
    var totalbox = end-start;
    var R = totalbox * 0.7;
    var S = totalbox * 0.2945;
    total;
    var shengyubox = totalbox - total ;
    var shengyuR = R - Rcount;
    var shengyuS = S - Scount;

    var gailv = (shengyuS/(shengyuR + shengyuS)*100).toFixed(2);
    if(shengyuS < 0 && gailv>0)
    {
        gailv = gailv*-1;
    }

    var huanhang = "<br>";
    var msg = "待开盒子编号:"+tokenid + huanhang;
    msg+="编号：" + start + "到"+ end  +"之前，有" + totalbox + "个盒子,开了" + total+ "个盒子" + huanhang;
    msg += "开了：" + Rcount + "个R,剩余：" + shengyuR + "个R没开" + huanhang;
    msg += "开了：" + Scount + "个S,剩余：" + shengyuS + "个S没开" + huanhang;
    msg += "开出S的概率是:" + gailv  +"%" + huanhang;
    sendmsg(msg);


}


function calcgailv(tokenid, tokenIdmap,number) {
    


    let c = parseInt((tokenid/number))
    let cmin = c * number;
    let cmax = (c + 1) * number;
    if(cmax == 10000)
    {
        cmax = 9700;
    }

    fenxiboduanEx(tokenid,tokenIdmap, cmin, cmax);
}

function fenxiEX(value)
{
    var tokenid = Number(value.tokenid);
    var total = 9700;
    //加载所有数据
    var tokenIdmap = new Map();
    try {
        tokenIdmap = read_csv_line("jilu.csv");
    }
    catch (e) {
        return;
    }
    //fenxiboduan(tokenIdmap,0,total);
   
    // 10 编号以内
   if(tokenIdmap.has(tokenid) && tokenid < 9700)
   {
        var msg = "该编号已经开出来了:" + tokenid;
        sendmsg(msg);
        //console.log(msg)
   }
   else
   {
    calcgailv(tokenid, tokenIdmap,10);
    calcgailv(tokenid, tokenIdmap,100);
    calcgailv(tokenid, tokenIdmap,1000);
   }
}

function stringtonum(stringnumber,decimals)
{
    var length = stringnumber.length;
    if(length>decimals)
    {
        stringfirst = stringnumber.substring(0,length-decimals);
        stringse = stringnumber.substring(length-decimals,length);
        return stringfirst + "." + stringse;
    }
    else
    {
        var tmp = "0."
        for(var i=0;i<length-decimals;i++)
        {
            tmp +="0";
        }
        return tmp + stringnumber
    }
}

function numtostring(number,decimals)
{
    
    //将number 转为string
    var strnumber = number.toString(10);
    
    //获取小数点后面有几位小数
    var dotpos = strnumber.indexOf(".");
    if(dotpos!=-1)
    {
        var tmplength =strnumber.length - dotpos-1;
        if(tmplength < decimals)
        {
            strnumber = strnumber.replace(".","");
            for(var i=0;i<decimals-tmplength;i++)
            {
                strnumber += "0";
            }
        }
        else
        {
            var removenumber = tmplength - decimals;
            strnumber = strnumber.substring(0,strnumber.length-removenumber);
            strnumber = strnumber.replace(".","");
        }
        if(dotpos==1)
        {
            strnumber = strnumber.substring(1,strnumber.length);
        }
    }
    else
    {
        for(var i=0;i<decimals;i++)
            {
                strnumber += "0";
            }
    }
    return strnumber;

}




function boxcheck(value)
{
    fenxiEX(value)
}

module.exports = {
    initWeb3: initWeb3,
    test: test,
    qianggou: qianggou,
    setmainWindow: setmainWindow,
    abishiyong: abishiyong,
    creatpriatenumber: creatpriatenumber,
    accounts: accounts,
    importprikey: importprikey,
    exportprikey: exportprikey,
    CalcGasPrice: CalcGasPrice,
    mytest: mytest,
    guijieth: guijieth,
    guijitoken: guijitoken,
    boxcheck:boxcheck,
    GetAbiInfoNoprikey:GetAbiInfoNoprikey,
    numtostring:numtostring,
    stringtonum:stringtonum,
    abishiyongbyaddress:abishiyongbyaddress
}

