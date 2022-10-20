  //查询智能合约功能
  function btcreatpriatenumber() {
    const createnumber = document.querySelector('#creatpriatenumber').value;
    
      var value = { createnumber };
      ipcRenderer.send('info:creatpriatenumber', value)
    
  }

  function reloadaddress(){
    ipcRenderer.send('info:accounts', null)
  }

  function changepage(pagename)
  {
        if(pagename == "jiaohu")
        {
            document.querySelector('#tabmanageprikey').style.display = 'none';
            document.querySelector('#tabjiaohu').style.display = 'block';
            
        }
        else
        {
            document.querySelector('#tabmanageprikey').style.display = 'block';
            document.querySelector('#tabjiaohu').style.display = 'none';
        }
  }