

const electron = require('electron');
const { ipcRenderer, dialog } = electron;

var nownetwork = 'eth';
var chainid = 1;
var nowgastype = "eip1599";
function init() {
  document.querySelector("#rpc").checked = true;
  //debugger
  document.querySelector("#eip1559").checked = true;
  changewebgastype(nowgastype);

  document.querySelector("#contractmodel").checked = true;
  changejiaohutype("contractmodel");
  document.querySelector("#webjiaohuaddress2").checked = true;


}
init();


//初始化web3
function initweb3() {
  var webtype = "rpc";
  const wschecked = document.querySelector('#ws').checked
  if (wschecked) {
    webtype = "ws";
  }

  const weburl = document.querySelector('#weburl').value;
  var value = { webtype, weburl, chainid, nownetwork };
  //console.log(value);
  ipcRenderer.send('info:initweb3', value)
}

//查询智能合约功能
function queryContarct() {
  const contractaddress = document.querySelector('#Contractaddress').value;
  evmnetwork = getNetworkInfo(nownetwork);
  if (evmnetwork[0]) {
    var apiurl = evmnetwork[1].apiurl;
    var value = { contractaddress, apiurl };
    ipcRenderer.send('info:queryabi', value)
  }
}



//抢购开始函数
function qianggou() {
  const nftaddress = document.querySelector('#nftaddress').value;
  const inputdata = document.querySelector('#inputdata').value;
  const gas = document.querySelector('#qianggougas').value;

  const gaslimit = document.querySelector('#qianggougaslimit').value;
  const neth = document.querySelector('#neth').value;

  const maxPriorityFeePerGas = document.querySelector('#qianggoumaxPriorityFeePerGas').value;
  const maxFeePerGas = document.querySelector('#qianggoumaxFeePerGas').value;

  value = { nftaddress, inputdata, gas, gaslimit, neth, maxPriorityFeePerGas, maxFeePerGas, nowgastype };
  console.log("开始抢购，请稍等，或者去区块链网络查看：");
  ipcRenderer.send('info:qianggou', value)
}

function ceshi() {


  ipcRenderer.send('info:test', {})
}

function init1() {

  //debugger;
  var network = document.querySelector('#network');
  var i = 0;
  for (evmnetwork in evmnetworks) {
    //console.log(evmnetwork);
    var radioWrapper = document.createElement('div');
    radioWrapper.className = 'form-check form-check-inline';
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "evmnetwork";
    radio.className = 'form-check-input'
    console.log(radio);
    radio.value = evmnetworks[evmnetwork].network;
    radio.id = evmnetworks[evmnetwork].network;
    if (i == 0) {
      radio.checked = true;
      nownetwork = evmnetworks[evmnetwork].network;
      chainid = evmnetworks[evmnetwork].chainid;
    }
    i++;
    //radio.innerHTML = '"' + evmnetworks[evmnetwork].network + '"';
    radio.onclick = function () { changenetwork(this.value) };
    // network.appendChild(radio);
    radioWrapper.appendChild(radio);
    var label = document.createElement("label");
    label.className = 'form-check-label';
    label.innerHTML = evmnetworks[evmnetwork].network;
    // network.appendChild(label);
    radioWrapper.appendChild(label);
    network.appendChild(radioWrapper)
  }

}



function changejiaohutype(jiaohutype) {
  //debugger
  if (jiaohutype == "contractmodel") {
    document.querySelector('#followmodelcard').style.display = 'none';
    document.querySelector('#contractmodelcard').style.display = 'block';
  }
  else {
    document.querySelector('#followmodelcard').style.display = 'block';
    document.querySelector('#contractmodelcard').style.display = 'none';
  }

}

function changewebgastype(gastype) {
  //alert(webtype);
  //debugger
  if (gastype == "default") {
    //正常模式
    nowgastype = "default";
    /*
    document.querySelector('#divdefalutgas').style.visibility = 'visible';
    document.querySelector('#divmaxPriorityFeePerGas').style.visibility = 'hidden';
    document.querySelector('#divmaxFeePerGas').style.visibility = 'hidden';*/
    document.querySelector('#divdefalutgas').style.display = 'block';
    document.querySelector('#divmaxPriorityFeePerGas').style.display = 'none';
    document.querySelector('#divmaxFeePerGas').style.display = 'none';

  }
  else {
    //EIP1559
    nowgastype = "eip1559";
    document.querySelector('#divdefalutgas').style.display = 'none';
    document.querySelector('#divmaxPriorityFeePerGas').style.display = 'block';
    document.querySelector('#divmaxFeePerGas').style.display = 'block';

  }
}

function changewebnetwork(webtype) {
  //alert(webtype);
  changenetwork(nownetwork);
}

function changenetwork(network) {
  var result = getNetworkInfo(network);
  if (result[0]) {
    nownetwork = result[1].network;
    chainid = result[1].chainid;
    var webtype = "rpc";
    const wschecked = document.querySelector('#ws').checked
    if (wschecked) {
      webtype = "ws";
    }
    if (webtype == "rpc") {
      document.querySelector('#weburl').value = result[1].rpc;
    }
    else {
      document.querySelector('#weburl').value = result[1].ws;
    }

  }

}

function getNetworkInfo(network) {
  for (evmnetwork of evmnetworks) {
    //console.log(evmnetwork);
    if (network == evmnetwork.network) {
      return [true, evmnetwork];

    }
  }
  return [false, "false"];
}

init1();



ipcRenderer.on('info:initweb3', (e, value) => {
  //console.log(value)
  if (value.result) {
    console.log("initweb3成功");
  }
  else {
    console.log("initweb3失败");
  }

});

var abi = null;
ipcRenderer.on('info:queryabi', (e, value) => {
  console.log(value)
  if (value.result[0] == true) {
    console.log("智能合约查询成功")
    abi = value.result;
  }
  else {
    abi = null;
  }
});

function cleanall() {
  var selecthtml = document.querySelector('#log');
  cleanchild(selecthtml)
}

function cleanchild(selecthtml) {
  while (true) {
    try {
      selecthtml.removeChild(selecthtml.childNodes[0]);
    }
    catch (e) {
      break;
    }
  }
}

function readfunction(value) {
  //debugger;
  var selecthtml = document.querySelector('#fangfa');
  if (selecthtml != null) {

    cleanchild(selecthtml)
  }
  else {
    return;
  }

  if (abi == null) {
    return;
  }
  var viewmap = null;
  var typename = "view"
  if (value == "view") {
    viewmap = abi[1];
    typename = "view";

  }
  else if (value == "nonpayable") {
    viewmap = abi[2];
    typename = "nonpayable";
  }
  else if (value == "payable") {
    viewmap = abi[3];
    typename = "payable";
  }
  viewmap.forEach(element => {
    //debugger;
    var fname = element.name
    var option = document.createElement("option");
    option.value = typename;
    option.id = fname + ":" + element.id;
    option.innerHTML = fname;
    option.selected = true;
    //option.onclick = function () { changefunction(this.value,this.id) };
    selecthtml.appendChild(option);
  });
  changefunction(selecthtml);
}

function changefunction(selecthtml) {
  //debugger;
  var option = selecthtml.options[selecthtml.selectedIndex];
  console.log(option.value)
  changefunctionEX(option.value, option.id);
}

function transpara(input) {
  type = input.name;
  value = input.value;
  id = input.id;
  debugger
  if (type == "bool") {
    if (value.toLowerCase() == "ture" || value == "1") {
      return true;
    }
    else if (value.toLowerCase() == "false" || value == "0") {
      return false;
    }
    else {
      console.log("错误：" + id + "输入的参数不匹配");
      return "error";
    }
  }
  else if(type.indexOf("[]")!=-1)
  {
    value = JSON.parse(value);
    return value;
  }
  else if (type == "address") {
    if (value.indexOf("0x") == -1) {
      if (value == "myaddress") {
        return value;
      }
      if (value == "我的地址") {
        return value;
      }
      if (value == "地址") {
        return value;
      }
      console.log("错误：" + id + "输入的参数不匹配");
      return "error";
    }
    else {
      return value;
    }
  }
  else {
    return value;
  }

}

function exce() {
  var paralist = document.querySelector('#paralist').getElementsByTagName("input")
  var okvalue = [];
  var tijiao = true;
  for (i = 0; i < paralist.length; i++) {
    var result = transpara(paralist[i])
    if (result != "error")
      okvalue.push(result)
    else
      tijiao = false;
  }
  if (tijiao) {



    //给后台提交数组
    if (useabi != null) {


      var nftaddress = document.querySelector('#nftaddress').value;
      const address2 = document.querySelector("#webjiaohuaddress2").checked;
      if (address2 == false) {
        nftaddress = document.querySelector('#Contractaddress').value;
      }
      const gas = document.querySelector('#qianggougas').value;
      const gaslimit = document.querySelector('#qianggougaslimit').value;
      const neth = document.querySelector('#neth').value;
      const maxPriorityFeePerGas = document.querySelector('#qianggoumaxPriorityFeePerGas').value;
      const maxFeePerGas = document.querySelector('#qianggoumaxFeePerGas').value;
      //debugger;
      value = { useabi, okvalue, nftaddress, gas, gaslimit, neth, maxPriorityFeePerGas, maxFeePerGas, nowgastype };
      ipcRenderer.send('info:abishiyong', value)
    }
  }
}

var useabi = null;
function changefunctionEX(name, value) {

  var viewmap = null;
  if (name == "view") {
    viewmap = abi[1];


  }
  else if (name == "nonpayable") {
    viewmap = abi[2];

  }
  else if (name == "payable") {
    viewmap = abi[3];

  }
  if (viewmap != null) {
    var valueabi = viewmap.get(value);
    if (valueabi != null) {
      console.log(valueabi);
      var inputs = valueabi.inputs;
      useabi = valueabi;
      var selecthtml = document.querySelector('#paralist');
      if (selecthtml != null) {

        cleanchild(selecthtml)
      }
      else {
        return;
      }

      inputs.forEach(element => {
        var dom = document.createElement('div');
        dom.className = 'mb-1';
        var label = document.createElement('label');
        label.innerHTML = element.name + "(" + element.type + ")";
        dom.appendChild(label)
        var input = document.createElement('input');
        input.name = element.type;
        input.id = element.name;
        input.className = 'form-control'
        if (element.type == "address") {
          input.value = "myaddress";
        }
        dom.appendChild(input);
        selecthtml.appendChild(dom);
      });


    }
    else {
      useabi = null;
    }

  }
}

ipcRenderer.on('info:msg', (e, value) => {
  
  console.log(value.msg)


});

ipcRenderer.on('info:setnowgasprice', (e, value) => {
  //debugger;
  if(bautogetgas)
  {
    var xiaofei =Number(value.maxgasprice) + Number(document.querySelector('#qianggoumaxPriorityFeePerGas').value);
    document.querySelector('#qianggoumaxFeePerGas').value =  Number(xiaofei);
  }
    
  

});



var accountHolder = document.getElementById('priAccounts');
ipcRenderer.on('info:accounts', (e, value) => {
  cleanchild(accountHolder)
  for (let acct of value['result']) {
    accountHolder.append(acct);
    accountHolder.append(document.createElement('br'))
  }
});

(function () {
  var old = console.log;
  var logger = document.getElementById('log');
  console.log = function (message) {
    if (typeof message == 'object') {
      logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
    } else {
      logger.innerHTML += message + '<br />';
    }
  }
})();

setTimeout(() => {
  ipcRenderer.send('info:accounts', null)
}, 300);


var bautogetgas = false
function autogetgas()
{
    var mybutton =  document.querySelector('#autogetgas');
    if(bautogetgas)
    {
      //关闭自动获取
      bautogetgas = false;
      mybutton.innerHTML = "启动自动获取gas"
    }
    else
    {
      //启动自动获取
      bautogetgas = true;
      mybutton.innerHTML = "关闭自动获取gas"
      ipcRenderer.send('info:startgetmaxgasprice', null)
    }
}

function LoadlocalABI()
{
  ipcRenderer.send('info:loadlocalABI', null)
}

