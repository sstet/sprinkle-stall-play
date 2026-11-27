'use strict';
const button=document.querySelector('#connect'),label=document.querySelector('#status');
const status=text=>label.textContent=text;
let port,writer,reader,peer,phone,verified=false;
let offset=null,bestRtt=Infinity,pending=null,busy=false;
const encoder=new TextEncoder();
function command(line){return writer.write(encoder.encode(line+'\n'))}
async function release(message){
  verified=false;phone?.close();phone=null;peer?.destroy();peer=null;pending=null;
  document.querySelector('#pair').hidden=true;
  if(reader){await reader.cancel().catch(()=>{});reader.releaseLock();reader=null}
  if(writer){writer.releaseLock();writer=null}
  if(port){await port.close().catch(()=>{});port=null}
  status(message);button.disabled=false;
}
async function snapshots(){
  if(busy)return;
  busy=true;
  try{
    while(pending&&writer){
      const m=pending;pending=null;
      const lag=offset===null?0:Math.max(0,performance.now()-(m.at+offset));
      const ms=Math.round(Math.max(0,Math.min(3000,m.remaining-(m.scene===1?lag:0))));
      await command(['S',m.round,m.dish,m.kind,m.wanted,m.scene,ms,m.total,m.tail||'-'].join(' '));
    }
  }catch{status('USB 写入中断，请重新连接')}finally{busy=false}
}
function pairing(){
  // Keep the receiver address in this tab's URL so refreshing or reopening it
  // preserves the QR link that the phone already scanned.
  const address=new URL(location.href);
  const saved=new URLSearchParams(address.hash.slice(1)).get('station');
  const id=/^stall-[0-9a-f]{32}$/.test(saved||'')?saved:'stall-'+crypto.randomUUID().replaceAll('-','');
  address.hash='station='+id;
  history.replaceState(null,'',address);
  peer=new Peer(id);
  peer.on('open',()=>{
    const link=new URL('index.html',location.href);
    // The local build has a separate desktop simulator at index.html.
    if(location.hostname!=='sstet.github.io')link.pathname=link.pathname.replace(/index\.html$/,'phone.html');
    link.hash='board='+id;
    const qr=qrcode(0,'M');qr.addData(link.href);qr.make();
    document.querySelector('#qr').innerHTML=qr.createSvgTag(4,16);
    document.querySelector('#url').href=link.href;document.querySelector('#pair').hidden=false;
    status('开发板就绪，等待手机扫码');
  });
  peer.on('disconnected',()=>{if(peer&&!peer.destroyed)peer.reconnect()});
  peer.on('error',e=>status('配对服务连接失败，请刷新后重试（'+e.type+'）'));
  peer.on('connection',c=>{
    if(phone?.open){c.on('open',()=>c.close());return}
    phone=c;offset=null;bestRtt=Infinity;
    c.on('open',()=>{status('手机与开发板已连接');ping()});
    c.on('data',m=>{
      if(phone!==c||!verified||!m)return;
      if(m.type==='pong'){
        const now=performance.now(),rtt=now-m.start;
        if(Number.isFinite(m.at)&&rtt>=0&&rtt<bestRtt){bestRtt=rtt;offset=(now+m.start)/2-m.at}
      }
      if(m.type!=='state'||![m.round,m.dish,m.kind,m.wanted,m.scene,m.total].every(Number.isSafeInteger)||
        !Number.isFinite(m.at)||!Number.isFinite(m.remaining)||typeof m.tail!=='string'||
        !/^[012]{0,48}$/.test(m.tail))return;
      pending=m;snapshots();
    });
    c.on('close',()=>{if(phone===c){phone=null;status('手机已断开，可重新扫码')}})
  });
}
function ping(){if(phone?.open)phone.send({type:'ping',start:performance.now()})}
setInterval(ping,1800);
async function readBoard(){
  let text='';const decoder=new TextDecoder();
  while(reader){
    const {value,done}=await reader.read();if(done)break;
    text+=decoder.decode(value,{stream:true});
    const lines=text.split('\n');text=lines.pop().slice(-120);
    if(!verified&&lines.some(line=>line.trim()==='SPRINKLE/1')){
      verified=true;status('已识别小吃摊，正在生成配对码');pairing()
    }
  }
}
button.onclick=async()=>{
  button.disabled=true;
  try{
    const known=(await navigator.serial.getPorts()).filter(p=>p.getInfo().usbVendorId===0x303a);
    port=known.length===1?known[0]:await navigator.serial.requestPort();
    await port.open({baudRate:115200});
    writer=port.writable.getWriter();reader=port.readable.getReader();status('正在识别固件…');
    readBoard().catch(()=>{}).finally(()=>{if(verified)release('串口已断开，插好后重新选择')});
    for(let attempt=0;attempt<12&&!verified;attempt++){await command('HELLO');await new Promise(r=>setTimeout(r,300))}
    if(!verified)await release('未收到小吃摊固件回应。请检查烧录和 USB 端口。');
  }catch(e){await release(e.name==='NotFoundError'?'尚未选择串口':'串口连接失败，请关闭 Arduino 串口监视器后重试')}
};
if(!navigator.serial){button.disabled=true;status('请在 Mac 版 Chrome 或 Edge 中打开配对页')}
