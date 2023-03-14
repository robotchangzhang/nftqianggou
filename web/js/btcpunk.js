function punkimgdownload()
{
    ipcRenderer.send('info:punkimgdownload', null)
}

function punkselectblockinfo()
{
   
    ipcRenderer.send('info:punkselectblockinfo', null)
}

function punkidselect()
{
    var punkid = document.querySelector('#punkid').value;
    ipcRenderer.send('info:punkidselect', {punkid})
}

function getbtccookiepath()
{
    ipcRenderer.send('info:getbtccookiepath', null)
}

ipcRenderer.on('info:getbtccookiepath', (e, value) => {
   var filename = value.filename
   document.querySelector('#btccookiepath').value =  filename;
  });

  ipcRenderer.on('info:punkidselect', (e, value) => {
    var info = value.info
    console.log(info)
   });


  function btcsetting()
  {
      var btcordrpc = document.querySelector('#btcordrpc').value
      var btcrpc = document.querySelector('#btcrpc').value
      var cookiefilename = document.querySelector('#btccookiepath').value
      ipcRenderer.send('info:btcsetting', {btcordrpc,btcrpc,cookiefilename})
  }