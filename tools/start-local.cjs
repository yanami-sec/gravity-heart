const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const file=path.resolve(__dirname,'../dist/index.html');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
 if(!['/','/index.html'].includes(url.pathname)){res.writeHead(404);return res.end('Not found');}
 const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data);
});
server.once('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(8791,'127.0.0.1',()=>{
 const url='http://127.0.0.1:8791/';console.log('Gravity Heart - LOCAL\n'+url+'\nKeep this window open. Press Ctrl+C to stop.');
 if(process.argv.includes('--open')){
  if(process.platform==='win32'){
   const chrome=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
   if(chrome)spawn(chrome,['--no-first-run','--no-default-browser-check','--new-window',url],{stdio:'ignore'}).on('error',()=>{});
   else spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{stdio:'ignore',windowsHide:true}).on('error',()=>{});
  }
 }
});
