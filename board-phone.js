// A normal visit remains a standalone game. Only a paired link starts WebRTC.
(() => {
  const room=new URLSearchParams(location.hash.slice(1)).get('board');
  if(!/^stall-[a-f0-9]{32}$/.test(room||''))return;
  const badge=document.createElement('span');
  badge.setAttribute('role','status');
  $('modebar').append(badge);
  const status=text=>badge.textContent=' · '+text;
  status('正在连接板子');
  const lib=document.createElement('script');
  lib.src='vendor/peerjs.min.js';
  lib.onerror=()=>status('连接组件未加载，请刷新');
  document.head.append(lib);
  let peer,link,round=0,lastOrder=null;
  function send(){
    if(!link?.open)return;
    const order=getOrder();
    if(order!==lastOrder){lastOrder=order;round++;}
    link.send({type:'state',at:performance.now(),round,dish:order.dishId,kind:order.id,wanted:order.count,
      scene:phase==='cook'?0:phase==='count'?(pausedAt===null?1:3):2,
      remaining:phase==='count'?Math.max(0,Math.min(3000,deadline-time())):0,
      total:handfuls.length,tail:handfuls.slice(-48).join('')});
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
  addEventListener('stall-state',send);
  setInterval(send,450);
})();
