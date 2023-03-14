//通过访问ord 的区块链浏览器，抓取所有ord nft的编号，id，以及图片hash
//存储每次区块读写高度
//获得当前最大区块

const got = require('got');
const cheerio = require('cheerio');
const { imageHash } = require('image-hash');
const schedule = require('node-schedule');

var btcrpc = "http://127.0.0.1:8332"
var cookiefilename = "E:\\btc\\data\\.cookie"

//这里的端口号我自己修改过
var serveraddr = "http://127.0.0.1:13468"
var renwuj = null
var fs = require("fs");

const crypto = require('crypto');
var mainWindow= null
var startblock = 775633;
var endblock = 778775;
const lock = {};
var renwu = 0
var renwuall = 0;

function loadstartblock() {
    try {
        startblock = Number(fs.readFileSync('startblock.txt', 'utf8'))
    } catch (error) {
        console.log("未找到文件，请忽略该问题");
    }
}

function writestartblock(blockid) {
    fs.writeFileSync('startblock.txt', blockid.toString(), 'utf8');
}


async function getblockhigh() {

    //读取本地cookie文件
    const cookieStr = fs.readFileSync(cookiefilename, 'utf-8');

    
    try
    {
        const response = await got.post(btcrpc, {
            headers: {
                'Content-Type': 'application/json',
                Authorization:
                  'Basic ' + Buffer.from(cookieStr).toString('base64'),
            },
            body: JSON.stringify({
              method: 'getblockcount',
              params: [],
              jsonrpc: '2.0',
              id: Date.now(),
            }),
          });
          var resluts =  JSON.parse( response.body)
          endblock = resluts.result;
          console.log("btc 区块高度:"+resluts.result)
    }
    catch(e)
    {
        console.log(e);
    }
}


async function getbolck(blockid) {
    try {
        let response = await got(serveraddr + "/block/" + blockid);

        const $ = cheerio.load(response.body);
        const ul = $('body > main > ul');
        const lis = ul.find('li');
        const hrefs = [];
        lis.each(function () {
            const href = $(this).find('a').attr('href');
            hrefs.push(href);
        });
        return [true, hrefs];

    }
    catch (error) {

        return [false]

    }

}

async function gettx(tx) {
    try {
        let response = await got(serveraddr + tx);

        const $ = cheerio.load(response.body);
        const ul = $('body > main > ul');
        const lis = ul.find('li');
        const hrefs = [];
        lis.each(function () {
            const href = $(this).find('a').attr('href');
            hrefs.push(href);
        });

        const div = $('body > main > div');
        var link = null
        var herf = div.find('a').attr('href');
        if (herf != null) {

            if (herf.indexOf("inscription") != -1) {
                link = herf
            }
        }

        return [true, hrefs, link];

    }
    catch (error) {

        return [false]

    }

}

async function getoutputs(output) {
    try {

        let response = await got(serveraddr + output);

        const $ = cheerio.load(response.body);
        const ul = $('body > main > dl > dd.thumbnails');


        var href = ul.find('a').attr('href');


        if (href != null) {

            return [true, href];


        }
        else {

            return [false]


        }

    }
    catch (error) {

        return [false]

    }

}

async function getInscription(inscriptionid) {
    try {
        // body > main > h1
        // body > main > div > iframe
        let response = await got(serveraddr + inscriptionid);

        const $ = cheerio.load(response.body);
        const h1 = $('body > main > h1');
        var bianhao = h1.html();
        var bianhaoid = Number(bianhao.replace("Inscription", "").replace(" ", ""));

        const niframe = $('body > main > div > iframe');
        var imgsrc = niframe.attr("src");





        if (bianhaoid > 0) {
            return [true, bianhaoid, imgsrc];
        }
        else {
            return [false]
        }

    }
    catch (error) {

        return [false]

    }

}



async function getjpghash(src) {
    try {
        let response = await got(serveraddr + src);

        const $ = cheerio.load(response.body);
        const ming = $('body > img');
        var imgsrc = ming.attr("src");

        if (imgsrc != null) {
            return await getimghash(serveraddr + imgsrc)
        }
        return [false]


    }
    catch (error) {

        return [false]

    }
}
//775633


function writeFileSyncWithLock(filePath, data) {
    // 获取同步锁
    while (lock[filePath]) {
        // 如果同步锁已被占用，则等待一段时间再尝试获取
        setTimeout(() => { }, 10);
    }

    try {
        // 立即占用同步锁
        // 先把文件清空

        lock[filePath] = true;
        fs.writeFileSync(filePath, '');
        for (var i = 0; i < data.length; i++) {
            fs.appendFileSync(filename, data[i])
            //fs.writeFileSync(filePath, data);
        }
        // 使用同步写入方式写入文件

    } finally {
        // 释放同步锁
        lock[filePath] = false;
    }
}

function shuchurenwu() {
    filePath = "renwu"
    while (lock[filePath]) {
        // 如果同步锁已被占用，则等待一段时间再尝试获取
        setTimeout(() => { }, 10);
    }

    try {
        // 立即占用同步锁
        // 先把文件清空

        lock[filePath] = true;
        renwu++;
        str = "任务进度：" + renwu + "/" + renwuall
        console.log(str)
        sendmsg(str)
        // 使用同步写入方式写入文件

    } finally {
        // 释放同步锁
        lock[filePath] = false;
    }
}


//var json = {}
//分 3层，第一层 key:{}
//第二层, {lowest:"id",hashes:{}}
//第三层 hashes {id:inscription}
async function getjson() {
    var json = {}
    for (var key of punkinfo.keys()) {


        var map = punkinfo.get(key)
        if (map.size > 0) {
            var keys = {}
            var hashes = {}
            var lowest = 100000000000;
            for (var id of map.keys()) {
                try {
                    if (id < lowest) {
                        lowest = id;
                    }
                    hashes[(id)] = map.get(id)[0].replace("/inscription/", "");
                    //str = key + "," + id + "," + map.get(id)[0].replace("/inscription/","") +","+ map.get(id)[1]+ "\n"
                    //console.log("id:" + key  + "|numberid:" + id +"|Inscription:" + map.get(id))
                    //addxml(str,filename);
                    //data.push(str);
                }
                catch (e) {
                    console.log(e);
                }

            }
            keys["lowest"] = (lowest);
            keys["hashes"] = hashes;
            json[(key)] = keys;

        }
    }
    var string = JSON.stringify(json)
    //console.log(string)
    filePath = "punk.json"
    fs.writeFileSync(filePath, '');
    addxml(string, filePath)
}

async function getallinfo() {
    filename = "punknftid.csv"
    var data = []
    for (var key of punkinfo.keys()) {
        var map = punkinfo.get(key)
        if (map.size > 0) {
            for (var id of map.keys()) {
                try {
                    str = key + "," + id + "," + map.get(id)[0].replace("/inscription/", "") + "," + map.get(id)[1] + "\n"
                    //console.log("id:" + key  + "|numberid:" + id +"|Inscription:" + map.get(id))
                    //addxml(str,filename);
                    data.push(str);
                }
                catch (e) {
                    console.log(e);
                }

            }

        }
    }
    writeFileSyncWithLock(filename, data);
    shuchurenwu();
    getjson();
}

async function loadblockdata() {


    if (lock["loadblockdata"]) {
        // 如果有任务在执行，就直接返回
      return;
    }
    lock["loadblockdata"] = true;
    



    //挨个区块链遍历
    //var blockid = 775633;
    //await checkpunk(blockid);

    //return
    //getjpghash(src)

    //for(var blockid = 775633;blockid<778184;blockid++ )
    var start = startblock;
    var end = endblock;
    renwuall = end - start;
    for (var blockid = start; blockid < end; blockid++) {
        console.log(blockid)
        await checkpunk(blockid);
        startblock = blockid;
        writestartblock(startblock)
    }
    lock["loadblockdata"] = false;

}



async function checkpunk(blockid) {
    let value = await getbolck(blockid);
    if (value[0] == true) {
        var list = value[1];
        for (var i = 0; i < list.length; i++) {
            //每比交易遍历
            if (list[i] == "/tx/8cbc84854e03e456c1cd425329ec5d976f07ca4cf68fb0f3ede865f1029fc4f5") {
                i = i
            }
            let tx = await gettx(list[i]);
            //每笔交易又有几个output
            if (tx[0] == true) {
                var outputs = tx[1];
                if (outputs.length != 1) {
                    continue
                }
                for (var j = 0; j < outputs.length; j++) {
                    let Inscription = await getoutputs(outputs[j]);
                    if (Inscription[0] == true) {
                        await getNft(Inscription[1], blockid);

                    }
                    else if (tx[2] != null) {
                        await getNft(tx[2], blockid);
                    }

                }
            }
        }

    }
    getallinfo()
}

async function getNft(Inscription, blockid) {
    let info = await getInscription(Inscription);
    if (info[0] == true) {
        let hash = await getjpghash(info[2]);
        if (hash[0] == true) {

            if (hashpunk.has(hash[1])) {
                //console.log("blockid:" + blockid + "\n" + "tx:" + list[i] + "\n" + "output:" + outputs[j] + "\n" + "Inscription：" + Inscription[1]);
                //console.log("编号id:" + info[1] + "\n" + "图片地址:" + info[2]);
                //console.log("hash:" + hash[1]);
                var id = hashpunk.get(hash[1]);
                var mymap = punkinfo.get(id);
                var inscriptioninfo = mymap.get(info[1]);
                if (inscriptioninfo == null) {
                    mymap.set(info[1], [Inscription, blockid]);
                }

                else {
                    if (blockid > inscriptioninfo[1]) {
                        mymap.set(info[1], [Inscription, blockid]);
                    }
                }

                hashpunk.set(id, mymap);
            }
        }

    }
}

function addxml(str, filename) {
    fs.appendFile(filename, str, (err, data) => {
        if (err) throw err;
    });
}

const punkinfo = new Map()
const hashpunk = new Map()


function read_csv_line(csvfile) {
    try {
        let csvstr = fs.readFileSync(csvfile, "utf8", 'r+');
        let arr = csvstr.split('\n');


        for (var i = 0; i < arr.length; i++) {
            var line = arr[i];
            let data = line.split(',');
            punkinfo.set(Number(data[0]), new Map());
            hashpunk.set(data[1], Number(data[0]));
        }
    }
    catch (e) {
        console.log("没找到文件：" + csvfile)
    }

}
//urlstart = "C:\\Users\\laoxia\\Desktop\\punk"
// hash1 = urlstart + "7901" + urlend
// hash2 = urlstart + "8191" + urlend
// let varhash = await getimghash(hash1);
// let varhash2 = await getimghash(hash2);
// if(varhash[1] == varhash2[1])
// {
//     console.log("相同")
// }

//加载所有map
function loadpunk(csvfile) {
    try {
        let csvstr = fs.readFileSync(csvfile, "utf8", 'r+');
        let arr = csvstr.split('\n');


        for (var i = 0; i < arr.length; i++) {
            var line = arr[i];
            let data = line.split(',');
            var id = Number(data[0])
            if (id > 0) {
                var map = punkinfo.get(id)
                map.set(Number(data[1]), [data[2], data[3]])
                punkinfo.set(id, map);
            }

        }
    }
    catch (e) {
        console.log("没找到文件：" + csvfile)
    }



}

function getHashInfo() {
    var filename = "punk.csv"
    read_csv_line(filename)
    loadpunk("punknftid.csv")
}

//下载整个btc punk的数据，进行md5运算，并存入csv
async function testpunk() {
    //读取已经下载过的数据，防止重复下载
    getHashInfo()
    //拼接整个下载地址
    urlstart = "https://cryptopunks.app/public/images/cryptopunks/punk"
    urlend = ".png"
    for (var i = 1001; i < 10000; i++) {
        if (punkinfo.has(i)) {   //如果已经下载过了，就跳过
            continue
        }
        url = urlstart + i + urlend;
        download(url, i, filename);
    }
}
//下载并存csv函数
async function download(url, i, filename) {
    let hash = await getimghash(url);
    if (hash[0] == true) {
        // 写入格式为 nft编号，hash值
        var msg = i + "," + hash[1] + "\n";
        addxml(msg, filename);
    }
}
//对图片进行下载并且进行md5加密获得一串hash值
async function getimghash(src) {
    try {
        let response = await got(src);
        const hash = crypto.createHash('md5');
        hash.update(response.body);
        const md5 = "0x" + hash.digest('hex');
        return [true, md5]
    }
    catch (error) {

        return [false]
    }
}

//初始化

async function punkselect()
{
    //如果第一次跑，要多下载几次punk数据
    //await testpunk()

    //加载上一次执行的任务
    loadstartblock();
    //获取最新区块高度
    await getblockhigh();
    //加载punk hash文件以及 punk nft 统计文件
    getHashInfo()

    //开始遍历整个区块链的数据
    loadblockdata()

    //开启定时任务
    if(renwuj == null)
    {
        renwuj = task()
    }
    
}

const task = async () => {
    //每分钟的1-10秒都会触发，其它通配符依次类推
    //console.log("123111");
    //console.log(value);
    //console.log(count);
    console.log('start');

    //每分钟执行一次
    const j = schedule.scheduleJob('0 * * * * *', async () => {
        try {
            //获取最新区块高度
            await getblockhigh();
   

            //开始遍历整个区块链的数据
            loadblockdata()
        }
        catch (e) {
            console.log(e);
        }


    })
    return j;
}

//启动程序
//Init()
function setmainWindow(newmainWindow) {
    mainWindow = newmainWindow;
}

function sendmsg(msg) {
    if (mainWindow != null) {
        mainWindow.webContents.send("info:msg", { msg });
    }
}

function setInit(value)
{
     btcrpc = value.btcrpc;
     cookiefilename = value.cookiefilename;
     serveraddr = value.btcordrpc;
    sendmsg("设置完成。")

}

async function punkimgdownload()
{
    await testpunk()
}

function punkidselect(punkid)
{
    var json = {}
    var key = Number(punkid);
    if(punkinfo.has(key))
    {


        var map = punkinfo.get(key)
        if (map.size > 0) {
            var keys = {}
            var hashes = {}
            var lowest = 100000000000;
            for (var id of map.keys()) {
                try {
                    if (id < lowest) {
                        lowest = id;
                    }
                    hashes[(id)] = map.get(id)[0].replace("/inscription/", "");
                    //str = key + "," + id + "," + map.get(id)[0].replace("/inscription/","") +","+ map.get(id)[1]+ "\n"
                    //console.log("id:" + key  + "|numberid:" + id +"|Inscription:" + map.get(id))
                    //addxml(str,filename);
                    //data.push(str);
                }
                catch (e) {
                    console.log(e);
                }

            }
            keys["lowest"] = (lowest);
            keys["hashes"] = hashes;
            json[(key)] = keys;

        }
    }
    else
    {
        json = {"result":"notfind"}
    }
    var string = JSON.stringify(json)
    sendmsg(string)
    return string;
}
//导出函数
module.exports = {
    setInit:setInit,
    setmainWindow: setmainWindow,
    punkimgdownload:punkimgdownload,
    punkselectblockinfo:punkselect,
    punkidselect:punkidselect
    
}



