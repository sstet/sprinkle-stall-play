'use strict';
const $=id=>document.getElementById(id);
const names=['葱花','孜然','辣椒'];
const mobile=document.body.dataset.mode==='mobile';
const regulars=['葱花猫','孜然熊','辣椒兔'];
const ticketPrefix='sprinkle-stall.ticket.';
let receipts=loadReceipts(),orders=dailyMenu(),walletPage=0,storageWarning=false;
function loadReceipts(){
  const rows=[];
  try{
    for(const key of Object.keys(localStorage).filter(key=>key.startsWith(ticketPrefix))){
      try{
        const row=JSON.parse(localStorage.getItem(key));
        if(Number.isFinite(row?.date)&&Array.isArray(row.scores)&&row.scores.length===3&&
          row.scores.every(score=>Number.isInteger(score)&&score>=0&&score<=10)&&
          Array.isArray(row.guests)&&row.guests.length===3&&row.guests.every(id=>[0,1,2].includes(id)))rows.push(row);
      }catch{}
    }
  }catch{}
  return rows.sort((a,b)=>a.date-b.date);
}
function totalOf(row){return row.scores.reduce((sum,score)=>sum+score,0)}
const stage=$('stage'),phone=$('phone'),board=$('lcd')?.getContext('2d'),table=$('dinepic').getContext('2d');
let index=0,phase='cook',selected=0,handfuls=[],grains=[],land=false,deadline=0,entered=0,pausedAt=null;
let retried=false,history=[],caught=false,review='',sound=false,audio=null,drag=null,shakeGesture=null,ignoreClickUntil=0;
let tasteScore=null;
const firstBiteMs=820,scoreRevealMs=1600;
const tastingSounds=['好香！','嗯～','咦？','唔……'];
function reactionTier(score){
  if(score===10)return 0;
  if(score>=7)return 1;
  if(score>=4)return 2;
  return 3;
}
const time=()=>pausedAt??performance.now();
function tone(hz,duration=.085){if(!sound||!audio)return;const osc=audio.createOscillator(),amp=audio.createGain(),t=audio.currentTime;osc.type='triangle';osc.frequency.value=hz;amp.gain.setValueAtTime(.065,t);amp.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(amp);amp.connect(audio.destination);osc.start(t);osc.stop(t+duration)}
function initArt(){
  document.querySelectorAll('[data-art]').forEach(el=>{const c=el.getContext('2d');if(el.dataset.art==='logo'){c.scale(.51,.51);Art.food(c,0)}else Art.order(c)});
  for(let i=0;i<names.length;i++){
    const button=document.createElement('button'),pic=document.createElement('canvas');
    pic.width=360;pic.height=336;
    pic.setAttribute('aria-hidden','true');
    ShopArt.jar(pic,i);
    const label=document.createElement('span');label.className='jarTag';label.textContent=names[i];
    button.append(pic,label);button.onclick=()=>choose(i);$('choices').append(button);
  }
  {
    const canvas=table.canvas;
    const resize=()=>{
      const rect={width:canvas.clientWidth,height:canvas.clientHeight};
      if(!rect.width||!rect.height)return;
      const ratio=Math.min(window.devicePixelRatio||1,2,1600/Math.max(rect.width,rect.height));
      canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    };
    new ResizeObserver(resize).observe(canvas);
    ShopArt.ready.then(()=>{
      ShopArt.jar($('bottle'),selected);
      [...$('choices').querySelectorAll('canvas')].forEach((pic,id)=>ShopArt.jar(pic,id));
      if($('wallet').hidden)drawCustomerIcon(getOrder().id);
    });
  }
  function landscape(){const el=$('scenery');el.width=Math.max(160,Math.round(stage.clientWidth/2.8));el.height=Math.round(stage.clientHeight/2.8);Art.sky(el.getContext('2d'),el.width,el.height)}
  if(!mobile){new ResizeObserver(landscape).observe(stage);landscape()}
}
function choose(i){
  if(phase!=='cook')return;
  const changed=selected!==i;selected=i;
  ShopArt.jar($('bottle'),i);
  if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
    $('bottle').animate([{opacity:.45,transform:'translateY(6px) rotate(-4deg)'},{opacity:1,transform:'none'}],{duration:170});
  $('bottlename').textContent=names[i];
  [...$('choices').children].forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));
}
function setButtons(primary,secondary,disabled=false){$('primary').textContent=primary;$('secondary').textContent=secondary;$('secondary').hidden=!secondary;$('secondary').disabled=disabled}
function getOrder(){return orders[index]}
function setLand(value){land=value;stage.classList.toggle('land',value);document.body.classList.toggle('serving',value);$('bottleview').hidden=value;$('dining').hidden=!value;$('phonetag').textContent=value?'手机 · 横放':'手机 · 竖握'}
function drawCustomerIcon(id){
  const icon=$('orderPortrait'),ctx=icon.getContext('2d');
  ctx.clearRect(0,0,icon.width,icon.height);
  if(id===null){ctx.save();ctx.scale(icon.width/36,icon.height/38);Art.order(ctx);ctx.restore()}
  else ShopArt.portrait(ctx,id);
}
function refresh(){const o=getOrder();drawCustomerIcon(o.id);$('album').hidden=phase!=='cook'||!receipts.length;$('orderLabel').textContent=regulars[o.id]+'的订单';stage.classList.toggle('waiting',phase==='count'&&!land);
  $('order').textContent=o.dish+' · '+names[o.id]+o.word;$('round').textContent='0'+(index+1)+' / 03';$('pips').textContent=orders.map((_,i)=>i<=index?'●':'○').join(' ');
  for(const b of $('choices').children)b.disabled=phase!=='cook';
  document.body.dataset.phase=phase;
  $('boardword').classList.toggle('countbadge',phase==='count');
  if(mobile){
    $('countCaption').textContent=phase==='miss'?'菜已滑出':phase==='slide'?'正在出菜':'即将出菜';
    $('menuCode').textContent='菜单 '+String(o.menuId).padStart(3,'0');
  }
  if(phase==='cook'){setButtons('撒一撮',document.body.classList.contains('motion-on')?'':'扶正出菜',!handfuls.length);$('hint').textContent=handfuls.length?'可以继续撒料，也可以扶正出菜。':'点手机换调料，给'+o.dish+'撒'+(['一','两','三'][o.count-1])+'撮'+names[o.id]+'。';$('boardword').textContent=o.short}
  if(mobile&&phase==='cook'&&!handfuls.length)$('hint').textContent=($('motion').getAttribute('aria-pressed')==='true'?'把手机顶端朝下，轻抖撒料。':'选好调料，点瓶身撒一撮。');
  if(phase==='count'||phase==='slide'){setButtons(land?'餐桌就位':'横放手机','');$('primary').disabled=land;$('hint').textContent=land?'小人拿好筷子了。':'把手机拖向左边松手，或点「横放手机」。'}
  else $('primary').disabled=false;
  if(mobile&&(phase==='count'||phase==='slide'))$('hint').textContent=land?'筷子备好了，等菜上桌。':'趁出菜前横放手机，也可以点按接菜。';
  if(phase==='miss'){setButtons('横放查看','');$('primary').disabled=false;$('hint').textContent='碗已经滑走了。放平手机，看看客人的餐桌。'}
  if(phase==='eat'||phase==='react'){setButtons('正在尝菜','');$('primary').disabled=true;$('hint').textContent=phase==='eat'?'客人接住了，尝尝这一单。':'看看客人的表情。'}
  window.dispatchEvent(new Event('stall-state'));
  if(phase==='result'){const retry=!caught&&index===0&&!retried;setButtons(retry?'再接一次':index===2?'看收摊小票':'竖起手机 · 下一单','');$('hint').textContent=retry?'横着放平手机接菜。这一碗可以免费重送。':caught?`口味 ${tasteScore} / 10 分 · ${review}`:review}
}
function cook(){document.body.classList.remove('view-wallet');$('wallet').hidden=true;phase='cook';handfuls=[];grains=[];retried=false;caught=false;tasteScore=null;review='';ShopArt.prepareGuest(getOrder().id);setLand(false);$('speech').textContent='';choose(0);refresh()}
function sprinkle(){
  if(phase!=='cook')return;handfuls.push(selected);const t=time();
  // Separate the first two pinches across the visible surface of the food.
  const centers=[35,60,47,28,66];
  const center=centers[(handfuls.length-1)%centers.length];
  const pattern=[[-7,0],[-3,-3],[3,-2],[7,1],[-1,3],[4,4]];
  pattern.forEach(([x,y],j)=>grains.push({
    id:selected,x:center+x+Math.random()*2-1,dy:y+Math.random()*1.7-.85,
    angle:(Math.random()-.5)*1.3,at:t+j*28
  }));
  tone(370+80*selected);phone.classList.remove('shake');void phone.offsetWidth;phone.classList.add('shake');refresh()
}
function countdown(){if(phase==='cook'&&!handfuls.length)return;phase='count';caught=false;setLand(false);$('speech').textContent='等上菜…';deadline=time()+3000;$('boardword').textContent='3';refresh();tone(520)}
function place(){if(phase==='miss'){setLand(true);phase='result';$('speech').textContent=review;refresh();return}if(phase!=='count'||time()>=deadline)return;setLand(true);tone(690);refresh()}
function taste(order, portions){
  const correct=portions.filter(id=>id===order.id).length;
  const extra=portions.length-correct;
  const difference=correct-order.count;
  let score=Math.max(1,10-2*Math.abs(difference)-3*extra);
  let text=order.good;
  if(correct===0){
    score=Math.min(4,score);
    text=`我点的是${names[order.id]}呀！`;
  }else if(extra){
    const other=portions.find(id=>id!==order.id);
    text=`怎么还有${names[other]}味？`;
  }else if(difference<0){
    text=`${names[order.id]}再多一点！`;
  }else if(difference>0){
    text=order.id===0&&difference>=2?'面藏哪儿了？':`${names[order.id]}撒多了！`;
  }
  return {score,text};
}
function finishSlide(now){
  caught=land;$('speech').classList.toggle('missed',!caught);
  const rating=caught?taste(getOrder(),handfuls):null;
  tasteScore=rating?.score??null;
  review=rating?.text??('我的'+(index===0?'面':getOrder().dish)+'呢？');
  phase=caught?'eat':mobile?'result':'miss';if(mobile&&!caught)setLand(true);entered=now;$('speech').textContent=caught?'啊呜…':review;tone(caught?780:190);refresh()
}
function next(){
  if(phase!=='result')return;
  if(!caught&&index===0&&!retried){retried=true;countdown();return}
  history.push(tasteScore??0);
  if(index<2){index++;cook();return}
  phase='end';
  const row={date:Date.now(),guests:orders.map(order=>order.id),scores:[...history]};
  try{
    const key=ticketPrefix+row.date+'-'+Math.random().toString(36).slice(2);
    localStorage.setItem(key,JSON.stringify(row));
    if(!storageWarning)receipts=loadReceipts();
    else receipts.push(row);
  }catch{storageWarning=true;receipts.push(row)}
  setLand(false);openWallet(receipts.length-1);
}
function openWallet(page){
  document.body.classList.add('view-wallet');
  walletPage=page;
  const row=receipts[page],total=totalOf(row);
  const stars=[10,20,28].filter(threshold=>total>=threshold).length;
  const best=receipts.reduce((max,r)=>Math.max(max,totalOf(r)),0);
  $('wallet').hidden=false;$('bottleview').hidden=true;$('dining').hidden=true;
  $('phonetag').textContent='手机 · 票夹';
  const collectorEdition=row.scores.every(score=>score===10);
  $('wallet').classList.toggle('collector',collectorEdition);
  $('wallet').querySelector('.stampLabel').textContent=collectorEdition?'✦ 三章珍藏 ✦':'常客满分章';
  drawCustomerIcon(null);
  $('pageNo').textContent=(page+1)+' / '+receipts.length;
  const date=new Date(row.date);
  $('ticketDate').textContent=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('.');
  $('ticketNo').textContent='#'+String(page+1).padStart(3,'0');
  $('total').textContent=total;
  $('stars').replaceChildren();$('stars').setAttribute('aria-label',stars+'颗星，共三颗');
  for(let n=0;n<3;n++){
    const star=document.createElement('span');star.className=n<stars?'lit':'dim';star.textContent='★';$('stars').append(star);
  }
  $('stamps').replaceChildren();
  row.guests.forEach((id,i)=>{
    const seal=document.createElement('span'),pic=document.createElement('canvas');
    const earned=row.scores[i]===10;
    seal.className=earned?'seal':'seal empty';seal.title=regulars[id]+(earned?' · 满分签章':' · 满分点亮');
    seal.setAttribute('role','img');seal.setAttribute('aria-label',seal.title);
    pic.width=138;pic.height=162;ShopArt.portrait(pic.getContext('2d'),id);seal.append(pic);$('stamps').append(seal);
  });
  $('record').textContent=best===total&&best>0?'★ 个人最佳 ★':'个人最佳 '+best+' 分';
  $('older').disabled=page===0;$('newer').disabled=page===receipts.length-1;
  $('walletAction').textContent=phase==='end'?'再开一摊':'回到做菜';
  setButtons($('walletAction').textContent,'');$('primary').disabled=false;
  $('orderLabel').textContent='我的票夹';$('order').textContent='已收藏 '+receipts.length+' 张';
  const collected=new Set(receipts.flatMap(r=>r.guests.filter((_,i)=>r.scores[i]===10)));
  const missing=regulars.filter((_,id)=>!collected.has(id));
  $('hint').textContent=storageWarning?'本次小票仅保存在当前页面。':missing.length?
    '下一枚常客章：让'+missing[0]+'给出 10 分。':'三位常客章已集齐。试试一张小票盖满三个章！';
  if(!missing.length&&row.scores.every(score=>score===10))$('hint').textContent=storageWarning?'本次小票仅保存在当前页面。':'三章同票！明天再来试试新菜单。';
}
function leaveWallet(){
  if(phase==='end'){
    history=[];index=0;orders=dailyMenu();cook();
  }else{
    document.body.classList.remove('view-wallet');$('wallet').hidden=true;setLand(false);refresh();
  }
}
$('album').onclick=()=>openWallet(receipts.length-1);
$('older').onclick=()=>openWallet(walletPage-1);
$('newer').onclick=()=>openWallet(walletPage+1);
$('walletAction').onclick=leaveWallet;
function tick(raw){
  const now=time();
  if(phase==='count'){const left=Math.ceil((deadline-now)/1000);
    if(left<=0){$('boardword').textContent='';finishSlide(deadline)}
    else if($('boardword').textContent!==String(left)){$('boardword').textContent=String(left);tone(left===1?660:550)}}

  if(phase==='eat'&&now-entered>=firstBiteMs){
    phase='react';$('speech').textContent=tastingSounds[reactionTier(tasteScore)];refresh();
  }
  if(phase==='react'&&now-entered>=scoreRevealMs){phase='result';$('speech').textContent=review;tone(870);refresh()}
  if(board){board.fillStyle='#000';board.fillRect(0,0,160,160)}const moving=phase==='count'?Math.max(0,1-(deadline-now)/430):0;
  if(board&&['cook','count','slide'].includes(phase)){
    board.save();const wobble=phase==='count'&&deadline-now<900?Math.round(Math.sin(now/75)*1.6):0;
    const counting=phase==='count';
    board.translate(Math.round((counting?13:8)-160*moving*moving)+wobble,counting?26:43);
    board.scale(counting?1.4:1.5,counting?1.4:1.5);
    ShopArt.counterDish(board,getOrder().dishId);
    for(const g of grains){if(now<g.at)continue;Art.drawGrains(board,[g],Math.min(1,(now-g.at)/430),getOrder().dishId)}
    // Steam uses just a few opaque pixels, keeping the surrounding LCD entirely black.
    if(getOrder().dishId===0)for(let j=0;j<2;j++){const step=Math.floor(now/185+j*3)%7;board.fillStyle=step>4?'#6c626a':'#a69691';board.fillRect(32+j*12+Math.floor(Math.sin(step)),17-step,1,3);board.fillRect(33+j*12,15-step,1,2)}
    board.restore()
  }
  if(mobile&&phase==='cook'&&$('wallet').hidden)ShopArt.orderPreview($('orderDish'),getOrder().dishId,grains,now);
  if(land){
    if(phase==='count')$('speech').textContent='餐桌就位 · '+Math.max(1,Math.ceil((deadline-now)/1000));
    const elapsed=now-entered;
    const reaction=caught&&(phase==='react'||phase==='result')?{tier:reactionTier(tasteScore),elapsed:elapsed-firstBiteMs}:null;
    const displayedScore=phase==='result'?tasteScore:null;
    ShopArt.room(table,now,caught||phase==='count',now-deadline,getOrder().dishId,grains,
      phase==='eat',getOrder().id,reaction,displayedScore,Math.min(1,(elapsed-scoreRevealMs)/320),
      !caught&&phase==='result'?Math.min(1,elapsed/620):1);
  }
  requestAnimationFrame(tick)
}
function mainAction(){if(!$('wallet').hidden){leaveWallet();return}if(phase==='cook')sprinkle();else if(phase==='count'||phase==='slide'||phase==='miss')place();else if(phase==='result')next()}
$('primary').onclick=mainAction;$('secondary').onclick=()=>{if(phase==='cook'&&handfuls.length)countdown()};
$('bottle').onclick=()=>{if(time()>ignoreClickUntil)sprinkle()};
$('bottle').onpointerdown=e=>{if(phase!=='cook')return;shakeGesture={y:e.clientY,last:e.clientY,direction:0};e.target.setPointerCapture(e.pointerId)};
$('bottle').onpointermove=e=>{if(!shakeGesture||phase!=='cook')return;const g=shakeGesture,d=e.clientY-g.last;if(Math.abs(d)<14)return;const direction=Math.sign(d);if(g.direction&&direction!==g.direction){sprinkle();ignoreClickUntil=time()+500}g.direction=direction;g.last=e.clientY};
$('bottle').onpointerup=$('bottle').onpointercancel=()=>{shakeGesture=null};
phone.onpointerdown=e=>{if(mobile||land||!['count','slide','miss'].includes(phase))return;drag={x:e.clientX,y:e.clientY};phone.setPointerCapture(e.pointerId);stage.classList.add('dragging')};
phone.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;phone.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px)) rotate('+Math.max(-40,Math.min(40,dx*.18))+'deg)'};
function release(e){if(!drag)return;const moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);drag=null;phone.style.transform='';stage.classList.remove('dragging');if(e.type==='pointerup'&&moved>=20)place()}
phone.onpointerup=phone.onpointercancel=release;
$('help').onclick=()=>{pausedAt=performance.now();$('guide').showModal()};$('closeguide').onclick=()=>$('guide').close();
$('guide').onclose=()=>{const dt=performance.now()-pausedAt;deadline+=dt;entered+=dt;grains.forEach(g=>g.at+=dt);pausedAt=null};
$('sound').onclick=()=>{sound=!sound;if(sound){audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();tone(600)}$('sound').textContent='音效 '+(sound?'开':'关');$('sound').setAttribute('aria-pressed',String(sound))};
document.addEventListener('keydown',e=>{if(e.repeat||e.metaKey||e.ctrlKey||e.altKey||document.querySelector('dialog[open]'))return;
  if(!$('wallet').hidden)return;
  if(document.body.classList.contains('motion-on')&&['cook','count'].includes(phase)&&['ArrowLeft','Enter'].includes(e.code))return;
  if(e.key==='?'){$('help').click();return}
  if(['1','2','3'].includes(e.key)){choose(Number(e.key)-1);return}
  if(!['Space','Enter','ArrowLeft'].includes(e.code)||mobile&&e.target.closest('button'))return;
  if(e.target.closest('nav, dialog')&&e.code==='Enter')return;
  e.preventDefault();if(e.code==='Space')sprinkle();else if(e.code==='ArrowLeft')place();else if(phase==='cook'&&handfuls.length)countdown();else if(phase==='result')next()
});
initArt();cook();requestAnimationFrame(()=>requestAnimationFrame(()=>stage.classList.add('ready')));requestAnimationFrame(tick);
