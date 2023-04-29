//这里用bsc 链举例子
//加载web3的库
var Web3 = require('web3');
const { ethers } = require('ethers');
const { TypedDataUtils } = require("ethers-eip712");

var moment = require('moment');
//用私钥将交易内容签名
var EthereumTx = require('ethereumjs-tx');
const util = require('ethereumjs-util')
//这里是加载私钥的部分

const { Common } = require('@ethereumjs/common');
const HttpsProxyAgent = require('https-proxy-agent')
erc20 = require('./erc20.js')


require('dotenv').config()
var fs = require('fs');

url = require("url")
querytring = require("querystring")

const { env } = process
const proxy = env.PROXYURL // HTTP/HTTPS proxy to connect to
const useproxy = Number(env.PROXYUSE)

const EthereumTx1559 = require('@ethereumjs/tx');

const web4 = new Web3();
//加载abi

function getnetworkconf(networkname)
{
    var js = fs.readFileSync("./config.json");
    var evmnetworks = JSON.parse(js);
    for(var network of evmnetworks)
    {
        if(network.network == networkname)
        {
            return network;
        }
    }
    return null;
}

function loadabi(jsData) {
    var tmpabimap = new Map();
    jsData.forEach(element => {
        if (element.type == "function") {
            sign = web4.eth.abi.encodeFunctionSignature(element);
            tmpabimap.set(sign, element);
        }
    });
    return tmpabimap;
}

erc20abi = loadabi(erc20);
function sendmsg(msg) {
    if (mainWindow != null) {
        mainWindow.webContents.send("info:msg", { msg });
    }
}

function setmainWindow(newmainWindow) {
    mainWindow = newmainWindow;
}

const prikeymap = new Map();

class EthereumManager {
    constructor() {
        this.web3 = null;
        this.chainid = 1;
        this.nownetwork = 'eth';
        this.prikeyfile = './prikey.prikey';
        //this.#priKeys = this.#getPriKeys(this.prikeyfile);
       this.#getPriKeys(this.prikeyfile);
      
        //prikeymap.set(this,priKeys)
     
    }

    //使用完了不再使用要清除
   removethis()
   {
    prikeymap.delete(this)
   }


    setkeyfilepath(path)
    {
        
        this.prikeyfile = path
    }

    isFileExist(path) {
        try {
            fs.accessSync(path, fs.F_OK);
        } catch (e) {
            return false;
        }
        return true;
    }


    #getPriKeys(prikeyPath) {
        var arr = new Array();
        var exists = this.isFileExist(prikeyPath);
        if (exists) {
            var filecon = fs.readFileSync(prikeyPath).toString();
            filecon = filecon.replace("\r", "");

            var privKeyFile = filecon.split("\n");


            for (var line in privKeyFile) {
                privKeyFile[line] = privKeyFile[line].replace("0x", "");
                //console.log(privKeyFile[line]);
                if (privKeyFile[line] != "") {
                    arr.push(new Buffer.from(privKeyFile[line].trim(), "hex"))
                }

            }
            //console.log(arr);
            prikeymap.set(this,arr);

            return arr;
        }
       

    }

    addprikey(str, filename) {
        fs.appendFile(filename, str, (err, data) => {
            if (err) throw err;
        });
    }


    initWeb3(value) {
        if (this.web3 != null) {

            this.web3 = null;
        }
        if (value.webtype == 'rpc') {
            if (useproxy == 1) {
                var providers = new Web3.providers.HttpProvider(value.weburl, {
                    agent: {
                        https: HttpsProxyAgent(
                            proxy
                        ),
                    },
                })
                var rpcweb3 = new Web3(providers);
                this.web3 = rpcweb3;
            }
            else {
                var providers = new Web3.providers.HttpProvider(value.weburl)
                var rpcweb3 = new Web3(providers);
                this.web3 = rpcweb3;
            }


        }
        else if (value.webtype == 'ws') {
            var wscweb3 = new Web3(new Web3.providers.WebsocketProvider(value.weburl));
            this.web3 = wscweb3;
        }
        else {
            return false;
        }
        this.chainid = Number(value.chainid.toString())
        this.nownetwork = value.nownetwork;


        return true;
    }





    getPriKey(prikeystring) {
        prikeystring = prikeystring.replace("0x", "")
        const privKey = new Buffer.from(prikeystring, "hex");
        return privKey;
    }


    //通过小数点多少位，转换对应的数据
    getweiname(tokendecimals = 18) {
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
    getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) {

        var rawTransaction = {
            "from": fromAddress,
            "nonce": this.web3.utils.toHex(nonceNum),
            "gasLimit": this.web3.utils.toHex(gaslimit),
            "gasPrice": this.web3.utils.toHex(gasPrice),
            "to": toAddress,
            "value": this.web3.utils.toHex(nbnb),
            "data": input,  //设置num属性
            "chainId": this.chainid //4:Rinkeby, 3:Ropsten, 1:mainnet


        };

        var tx = new EthereumTx(rawTransaction);
        tx.sign(privKey);
        var serializedTx = tx.serialize();
        return serializedTx;
    }




    getEthRawTx1559(fromAddress, toAddress, input, nonceNum, privKey, maxPriorityFeePerGas, maxFeePerGas, nbnb, gaslimit) {

        //maxPriorityFeePerGas = this.web3.utils.toWei((2).toString(10), 'Gwei');
        //maxFeePerGas = this.web3.utils.toWei((50).toString(10), 'Gwei');
        var rawTransaction = {
            "from": fromAddress,
            "nonce": this.web3.utils.toHex(nonceNum),
            "gasLimit": this.web3.utils.toHex(gaslimit),
            //"gasPrice": this.web3.utils.toHex(gasPrice),
            "maxPriorityFeePerGas": this.web3.utils.toHex(maxPriorityFeePerGas),
            "maxFeePerGas": this.web3.utils.toHex(maxFeePerGas),
            "to": toAddress,
            "value": this.web3.utils.toHex(nbnb),
            "data": input,  //设置num属性
            "chainId": this.chainid, //4:Rinkeby, 3:Ropsten, 1:mainnet
            "type": '0x2', //EIP-1559

        };
        const common = Common.custom({ chainId: this.chainid })
        var tx = EthereumTx1559.FeeMarketEIP1559Transaction.fromTxData(rawTransaction, { common });
        var signedtx = tx.sign(privKey);

        var serializedTx = signedtx.serialize();
        return serializedTx;
    }



    //这里是将签名的内容发送到区块链网络中的代码
    signTransaction = async (fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit, gastype, gasmaxPriorityFeePerGas, gasmaxFeePerGas) => {

        var serializedTx;
        if (gastype == "defalut") {
            serializedTx = this.getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit)
        }
        else {
            serializedTx = this.getEthRawTx1559(fromAddress, toAddress, input, nonceNum, privKey, gasmaxPriorityFeePerGas, gasmaxFeePerGas, nbnb, gaslimit)
        }


        // Comment out these three lines if you don't really want to send the TX right now
        console.log(`Attempting to send signed tx:  ${serializedTx.toString('hex')}`);
        var receipt = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
        console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);
        if (receipt.status == true) {
            return true;
        }
        return false;
    }

    getBNBBalance = async (address) => {
        let result = await this.web3.eth.getBalance(address)
        //由于使用的是大数模式，小数点有18位，所以获得的balance 要除以10^18次方才是正确的数据
        //或者使用自带的转换工具
        //原始区块链数据中存的BNB的数量是

        let balance = this.web3.utils.fromWei(result.toString(10), this.getweiname());
        return balance;
    }
    //私钥，合约地址，inputdata，主币数量，gas费，最大gasuse
    qianggouNFT = async (priKey, walletaddress, inputdata, value, gas, ngasLimit, gastype, maxPriorityFeePerGas, maxFeePerGas) => {
        //获得自己的地址
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');


        var toAddress = walletaddress

        var nsendETH = value
        //假设交易 0.008个bnb
        var nbnb = this.web3.utils.toWei((nsendETH).toString(10), 'ether');
        //设置gasprice 为 5G wei
        var gasPrice = this.web3.utils.toWei((gas).toString(10), 'Gwei');
        var gasmaxPriorityFeePerGas = this.web3.utils.toWei((maxPriorityFeePerGas).toString(10), 'Gwei');
        var gasmaxFeePerGas = this.web3.utils.toWei((maxFeePerGas).toString(10), 'Gwei');
        //设置 gaslimit 为 420000
        var gaslimit = ngasLimit;
        //没有调用智能合约，将input设置为空
        var input = inputdata;
        //获得下一次交易的数
        console.log("发送地址是：" + fromAddress)
        var nonceCnt = await this.web3.eth.getTransactionCount(fromAddress);
        let reslut = await this.signTransaction(fromAddress, toAddress, input, nonceCnt, priKey, gasPrice, nbnb, gaslimit, gastype, gasmaxPriorityFeePerGas, gasmaxFeePerGas)
        if (reslut) {
            //console.log("交易成功")
            sendmsg(fromAddress + "交易成功");
        }
        else {
            //console.log("交易失败")
            sendmsg(fromAddress + "交易失败");
        }
    }

    getNowMilliSecond() {
        return Math.floor(Date.now());
    }



    qianggou(value) {
        var gas = value.gas;
        var gaslimit = value.gaslimit;
        var inputdata = value.inputdata;
        var nftaddress = value.nftaddress;
        var neth = value.neth;
        var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
        var maxFeePerGas = value.maxFeePerGas;
        var gastype = value.nowgastype;
        var priKeys = prikeymap.get(this);

        for (var priKey of priKeys) {

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
            this.qianggouNFT(priKey, nftaddress, okvalue[0], neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
            //break;
        }

    }




    async GetAbiInfoNoprikey(functionname, abi, abiokvalue, nftaddress) {
        // var okvalue = [].concat[abiokvalue];
        var tokenContract = new this.web3.eth.Contract([abi], nftaddress);
        var functionname = abi.name;
        let result = await tokenContract.methods[functionname].apply(null, abiokvalue).call()
        return result;
    }

    async GetAbiInfo(functionname, abi, abiokvalue, nftaddress) {
        var results = []
        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {
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
            var tokenContract = new this.web3.eth.Contract([abi], nftaddress);
            var functionname = abi.name;
            let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
            results.push[address, result];

        }
        return results;
    }

    async abishiyong(value, bsingle = false) {
        //return;
        var abi = value.useabi;
        var gas = value.gas;
        var gaslimit = value.gaslimit;
        var nftaddress = value.nftaddress;
        var neth = value.neth;
        var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
        var maxFeePerGas = value.maxFeePerGas;
        var gastype = value.nowgastype;
        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {
            //这里要复制数字，不然就是指针模式
            var okvalue = [].concat(value.okvalue);
            // 创建abi二进制
            // 如果要填自己的地址 ,默认通配符是 myaddress
            const now = moment().unix();
            const DEADLINE = now + 60 * 20; //往后延迟20分钟

            var deadline = (DEADLINE).toString(10);



            var address = "0x" + util.privateToAddress(priKey).toString('hex');
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
                var tokenContract = new this.web3.eth.Contract([abi], nftaddress);
                var functionname = abi.name;
                let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
                sendmsg("地址：" + address + "调用方法：" + functionname + "结果为" + result);

            }
            else {
                var inputdata = this.web3.eth.abi.encodeFunctionCall(abi, okvalue);
                //如果10个号，直接多线程
                //this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
                //如果1000个号，还是用单线程模式
                if (bsingle) {
                    try {
                        await this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);

                    }
                    catch (e) {
                        console.log(e)
                    }
                }
                else {
                    this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }

            }
            //break;
        }
    }

    async signEIP712(domain, types, values, nowaddress) {

        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {
            //这里要复制数字，不然就是指针模式
            var address = "0x" + util.privateToAddress(priKey).toString('hex');
            if (address != nowaddress) {
                continue;
            }
            domain.chainId = this.chainid;
            const privateKey = "0x" + priKey.toString("hex")
            const signer = new ethers.Wallet(privateKey);

            const sig = await signer._signTypedData(domain, types, values);
            //console.log(sig);
            return sig;

        }
    }



    async abishiyongbyaddress(value, bsingle = false, nowaddress) {
        //return;
        var abi = value.useabi;
        var gas = value.gas;
        var gaslimit = value.gaslimit;
        var nftaddress = value.nftaddress;
        var neth = value.neth;
        var maxPriorityFeePerGas = value.maxPriorityFeePerGas;
        var maxFeePerGas = value.maxFeePerGas;
        var gastype = value.nowgastype;
        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {
            //这里要复制数字，不然就是指针模式
            var okvalue = [].concat(value.okvalue);
            // 创建abi二进制
            // 如果要填自己的地址 ,默认通配符是 myaddress
            const now = moment().unix();
            const DEADLINE = now + 60 * 20; //往后延迟20分钟

            var deadline = (DEADLINE).toString(10);



            var address = "0x" + util.privateToAddress(priKey).toString('hex');
            if (address != nowaddress) {
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
                var tokenContract = new this.web3.eth.Contract([abi], nftaddress);
                var functionname = abi.name;
                let result = await tokenContract.methods[functionname].apply(null, okvalue).call()
                sendmsg("地址：" + address + "调用方法：" + functionname + "结果为" + result);

            }
            else {
                var inputdata = this.web3.eth.abi.encodeFunctionCall(abi, okvalue);
                //如果10个号，直接多线程
                //this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit);
                //如果1000个号，还是用单线程模式
                if (bsingle) {
                    try {
                        await this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);

                    }
                    catch (e) {
                        console.log(e)
                    }
                }
                else {
                    this.qianggouNFT(priKey, nftaddress, inputdata, neth, gas, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }

            }
            //break;
        }
    }

    creatpriatenumber(value) {
        var createnumber = Number(value.createnumber);
        try {
            for (var i = 0; i < createnumber; i++) {
                //创建私钥
                var result = this.web3.eth.accounts.create();
                var privateKey = result.privateKey;
                //将私钥写入配置配件
                this.addprikey(privateKey + "\n", this.prikeyfile);
                //console.log(result);
            }
            sendmsg("添加" + createnumber + "个私钥成功");
        }
        catch (e) {
            sendmsg("添加" + createnumber + "个私钥失败<br> 请确认web3是否初始化");
        }
        return {};

    }

    accounts() {
        this.#getPriKeys(this.prikeyfile);
        var priKeys = prikeymap.get(this);
         
        return priKeys.map(_key => { console.log("0x" + util.privateToAddress(_key).toString('hex')); return "0x" + util.privateToAddress(_key).toString('hex'); })
    }

    importprikey(filepath) {
        var filename = filepath[0];
        var filecon = fs.readFileSync(filename).toString();
        filecon = filecon.replace("\r", "");

        var privKeyFile = filecon.split("\n");


        for (var line in privKeyFile) {
            privKeyFile[line] = privKeyFile[line].replace("0x", "");
            //console.log(privKeyFile[line]);
            if (privKeyFile[line] != "") {
                var prikey = new Buffer.from(privKeyFile[line].trim(), "hex");
                try {
                    util.privateToAddress(prikey).toString('hex');
                    this.addprikey(privKeyFile[line] + "\n", this.prikeyfile);
                }
                catch (e) {
                    console.log("私钥:" + prikey + "导入失败");
                }
            }

        }
        sendmsg("导入完成");

    }

    async CalcGasPrice() {
        let gasPrice = await this.web3.eth.getGasPrice();
        let nowgasprice = this.web3.utils.fromWei((gasPrice).toString(10), 'Gwei');
        if (Number(nowgasprice) < 0.01) {
            nowgasprice = 0.01
        }
        let maxgasprice = Number(nowgasprice) * (1.125 ** 4);

        maxgasprice = Number(maxgasprice.toFixed(2));
        console.log(maxgasprice);
        mainWindow.webContents.send("info:setnowgasprice", { maxgasprice });
        return maxgasprice;

    }

    exportprikey(filepath) {

        var filecon = fs.readFileSync(this.prikeyfile).toString();
        this.addprikey(filecon, filepath + "\\export.prikey");
        sendmsg("导出完成");


    }

    //归集的ETH 主币给一个地址，如果地址是自己，要排除,用传统模式，归集不需要掏额外的gas
    async guijieth(value) {
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
        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {



            address = "0x" + util.privateToAddress(priKey).toString('hex');
            //如果包含要操作这个地址，就转
            if (guijiethaddress == address) {
                continue;
            }
            else if (addressmap.hash(address)) {
                //获取当前gas
                let gasPrice = await this.web3.eth.getGasPrice();
                let nowgasprice = this.web3.utils.fromWei((gasPrice).toString(10), 'Gwei');
                let xioahao = this.web3.utils.fromWei((Number(gasPrice) * Number(gaslimit)).toString(10), 'ether');

                let neth = Number(this.getBNBBalance(address));
                if (ethnumbertype == "pct") {
                    //删掉gas 
                    neth = neth * ethpct / 100 - Number(xioahao);
                    await this.qianggouNFT(prikey, guijiethaddress, inputdata, neth, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }
                else {
                    shengyu = neth - ethnumber - xioahao;
                    if (shengyu < 0) {
                        //钱包eth 数量不够
                        continue;

                    }
                    else {
                        await this.qianggouNFT(prikey, guijiethaddress, inputdata, ethnumber, nowgasprice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                    }

                }

            }
        }
        //(priKey, walletaddress, inputdata, value, gas, ngasLimit, gastype, maxPriorityFeePerGas, maxFeePerGas)
    }






    getTokenBalance = async (tokenaddress, address) => {
        //创建代币的智能合约函数
        var tokenContract = new this.web3.eth.Contract(erc20, tokenaddress);


        //调用代币的智能合约获取余额功能
        let result = await tokenContract.methods.balanceOf(address).call();

        //获得代币有多少位小数
        let decimals = await tokenContract.methods.decimals().call();
        //weiname = getweiname(decimals);
        //let tokenbalance = this.web3.utils.fromWei(result.toString(10), weiname);
        let tokenbalance = transnum(result, decimals);
        //获得代币的符号
        let symbol = await tokenContract.methods.symbol().call();

        //打印结果
        //console.log("地址:" + address + "有代币:" + symbol + "的数量是:" + tokenbalance);
        return tokenbalance;
    }

    //归集token接口，使用EIP1559
    async guijitoken(value) {
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
        var priKeys = prikeymap.get(this);
        for (var priKey of priKeys) {



            var address = "0x" + util.privateToAddress(priKey).toString('hex');
            //如果包含要操作这个地址，就转
            if (guijiethaddress == address) {
                continue;
            }
            else if (addressmap.hash(address)) {
                //获取当前gas
                let gasPrice = await Number(this.CalcGasPrice()) + 2;
                //获得代币数量
                let tokennumber = await this.getTokenBalance(tokenaddress, address);

                let neth = Number(this.getBNBBalance(address));
                if (ethnumbertype == "pct") {
                    //删掉gas 
                    neth = neth * ethpct / 100 - Number(xioahao);
                    await this.qianggouNFT(prikey, guijiethaddress, inputdata, neth, gasPrice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                }
                else {
                    var shengyu = neth - ethnumber - xioahao;
                    if (shengyu < 0) {
                        //钱包eth 数量不够
                        continue;

                    }
                    else {
                        await this.qianggouNFT(prikey, guijiethaddress, inputdata, ethnumber, gasPrice, gaslimit, gastype, maxPriorityFeePerGas, maxFeePerGas);
                    }

                }

            }
        }
    }







    stringtonum(stringnumber, decimals) {
        var length = stringnumber.length;
        if (length > decimals) {
            var stringfirst = stringnumber.substring(0, length - decimals);
            var stringse = stringnumber.substring(length - decimals, length);
            return stringfirst + "." + stringse;
        }
        else {
            var tmp = "0."
            for (var i = 0; i < length - decimals; i++) {
                tmp += "0";
            }
            return tmp + stringnumber
        }
    }

    numtostring(number, decimals) {

        //将number 转为string
        var strnumber = number.toString(10);

        //获取小数点后面有几位小数
        var dotpos = strnumber.indexOf(".");
        if (dotpos != -1) {
            var tmplength = strnumber.length - dotpos - 1;
            if (tmplength < decimals) {
                strnumber = strnumber.replace(".", "");
                for (var i = 0; i < decimals - tmplength; i++) {
                    strnumber += "0";
                }
            }
            else {
                var removenumber = tmplength - decimals;
                strnumber = strnumber.substring(0, strnumber.length - removenumber);
                strnumber = strnumber.replace(".", "");
            }
            if (dotpos == 1) {
                strnumber = strnumber.substring(1, strnumber.length);
            }
        }
        else {
            for (var i = 0; i < decimals; i++) {
                strnumber += "0";
            }
        }
        return strnumber;

    }

}

module.exports = {
    setmainWindow: setmainWindow,
    getnetworkconf:getnetworkconf,
    EthereumManager,


}

