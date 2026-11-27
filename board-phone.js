// A normal visit remains a standalone game. Only a paired link starts WebRTC.
(() => {
  const room=new URLSearchParams(location.hash.slice(1)).get('board');
  const usb=new URLSearchParams(location.hash.slice(1)).get('usb');
  const local=location.port==='8446'&&/^[a-f0-9]{32}$/.test(usb||'');
  const bluetooth=window.webkit?.messageHandlers?.stallState;
  if(!bluetooth&&!local&&!/^stall-[a-f0-9]{32}$/.test(room||''))return;
  const badge=document.createElement('span');
  badge.setAttribute('role','status');
  $('modebar').append(badge);
  const status=text=>badge.textContent=' · '+text;
  if(bluetooth)badge.remove();else status('正在连接板子');
  const lib=document.createElement('script');
  lib.src='vendor/peerjs.min.js';
  lib.onerror=()=>status('连接组件未加载，请刷新');

  let peer,link,round=0,lastOrder=null;
  function snapshot(){
    const order=getOrder();
    if(order!==lastOrder){lastOrder=order;round++;}
    return {type:'state',at:performance.now(),round,dish:order.dishId,kind:order.id,wanted:order.count,
      scene:phase==='cook'?0:phase==='count'?(pausedAt===null?1:3):2,
      remaining:phase==='count'?Math.max(0,Math.min(3000,deadline-time())):0,
      total:handfuls.length,tail:handfuls.slice(-48).join('')};
  }
  let busy=false,pending=false,bestRoundTrip=Infinity;
  async function send(){
    if(bluetooth){
      const m=snapshot();
      bluetooth.postMessage(['S',m.round,m.dish,m.kind,m.wanted,m.scene,Math.round(m.remaining),m.total,m.tail||'-'].join(' '));
      return;
    }
    if(!local){if(link?.open)link.send(snapshot());return}
    if(busy){pending=true;return}
    busy=true;
    try{
      do{
        pending=false;
        const m=snapshot();
        const start=performance.now();
        const travel=m.scene===1&&Number.isFinite(bestRoundTrip)?Math.min(35,bestRoundTrip/2):0;
        const line=['S',m.round,m.dish,m.kind,m.wanted,m.scene,Math.max(0,Math.round(m.remaining-travel)),m.total,m.tail||'-'].join(' ');
        const response=await fetch('/usb-state',{method:'POST',headers:{'X-Stall-Key':usb},body:line});
        if(!response.ok)throw Error();
        bestRoundTrip=Math.min(bestRoundTrip,performance.now()-start);
        status('已直连开发板');
      }while(pending);
    }catch{status('Mac 或 USB 暂未回应，正在重试')}finally{busy=false}
  }
  function connect(){
    if(peer)peer.destroy();
    const current=peer=new Peer();
    current.on('error',()=>{if(current===peer)status('板子未连接，正在重试')});
    current.on('open',()=>{
      if(current!==peer)return;
      const channel=link=current.connect(room,{reliable:true});
      channel.on('open',()=>{status('已连开发板');send()});
      channel.on('data',m=>{
        if(m?.type==='ping'&&Number.isFinite(m.start))channel.send({type:'pong',start:m.start,at:performance.now()});
      });
      channel.on('close',()=>{if(link===channel)status('板子已断开，正在重连')});
    });
  }
  lib.onload=()=>{connect();setInterval(()=>{if(!link?.open&&!document.hidden)connect()},9000)};
  if(local||bluetooth)send();else document.head.append(lib);
  addEventListener('stall-state',send);
  setInterval(send,450);
})();
