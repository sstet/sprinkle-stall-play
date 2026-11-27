'use strict';
(() => {
  const button=$('motion');
  const status=$('motionStatus');
  function showMode(name,detail,connected=false){
    if($('modeName').textContent!==name)$('modeName').textContent=name;
    if(status.textContent!==detail)status.textContent=detail;
    $('modebar').dataset.connected=String(connected);
  }
  if(!isSecureContext){
    button.textContent='体感说明';
    showMode('点按模式','本页使用 HTTP，体感需要 HTTPS');
  }
  let liftSince=null,enabled=false,probe=0,seenPose=false,seenMotion=false;
  let inverted=false,armed=false,uprightSince=null,flatSince=null,pose=null;
  let canShake=true,lastShake=-Infinity,lastMotion=0,force=0,gravity=null;
  const playing=()=>!document.hidden&&!document.querySelector('dialog[open]')&&$('wallet').hidden;
  function resetPose(){
    liftSince=null;inverted=false;armed=false;uprightSince=null;flatSince=null;pose=null;
    canShake=true;lastShake=-Infinity;lastMotion=0;gravity=null;
  }
  function stop(message){
    enabled=false;clearTimeout(probe);resetPose();
    removeEventListener('deviceorientation',orientation);
    removeEventListener('devicemotion',motion);
    button.textContent='开启体感';button.setAttribute('aria-pressed','false');
    showMode('点按模式',message);$('hint').textContent=message;
  }
  function orientation(e){
    if(!enabled||!playing()||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
    seenPose=true;
    const now=performance.now(),beta=e.beta*Math.PI/180,gamma=e.gamma*Math.PI/180;
    
    const vertical=Math.sin(beta),faceUp=Math.cos(beta)*Math.cos(gamma);
    pose={vertical,faceUp};
    checkPose(now);
  }
  function checkPose(now){
    if(!pose)return;
    const {vertical,faceUp}=pose;
    inverted=vertical<-.54;
    if(seenMotion&&seenPose&&phase==='cook')showMode('体感已连接',inverted?'瓶口朝下，轻抖撒料':'把手机顶端朝下',true);
    if(phase==='cook'){
      if(!handfuls.length)armed=false;
      if(inverted&&handfuls.length)armed=true;
      if(armed&&vertical>.60){
        uprightSince??=now;
        if(now-uprightSince>=200){armed=false;uprightSince=null;countdown()}
      }else uprightSince=null;
    }
    if(phase==='result'&&land&&vertical>.7){
      liftSince??=now;
      if(now-liftSince>=350){liftSince=null;next()}
    }else liftSince=null;
    if(['count','slide','miss'].includes(phase)&&!land&&faceUp>.92&&now-lastMotion<400&&force<2){
      flatSince??=now;
      if(now-flatSince>=230){flatSince=null;place()}
    }else flatSince=null;
  }
  function motion(e){
    if(!enabled||!playing())return;
    const now=performance.now();
    const linear=e.acceleration,raw=e.accelerationIncludingGravity;
    const valid=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
    if(valid(linear))force=Math.hypot(linear.x,linear.y,linear.z);
    else if(valid(raw)){
      const axes=[raw.x,raw.y,raw.z];
      if(!gravity)gravity=axes.slice();
      force=Math.hypot(...axes.map((value,i)=>value-gravity[i]));
      gravity=gravity.map((old,i)=>old*.82+axes[i]*.18);
    }else return;
    lastMotion=now;seenMotion=true;
    checkPose(now);
    if(force<2.2)canShake=true;
    if(phase==='cook'&&inverted&&canShake&&force>=5.2&&now-lastShake>=370){
      canShake=false;lastShake=now;sprinkle();armed=true;
      if(navigator.vibrate)navigator.vibrate(18);
    }
  }
  button.onclick=async()=>{
    if(enabled){stop('已切到点按模式。点瓶身也能撒料。');return}
    if(!isSecureContext){
      showMode('点按模式','请在 Safari 中打开受信任的 HTTPS 体感地址。');
      return;
    }
    if(!window.DeviceOrientationEvent||!window.DeviceMotionEvent){showMode('点按模式','这个浏览器没有提供体感，可点瓶身撒料。');return}
    button.disabled=true;
    try{
      const apis=[window.DeviceOrientationEvent,window.DeviceMotionEvent];
      const grants=await Promise.all(apis.map(api=>api.requestPermission?api.requestPermission():'granted'));
      if(grants.some(state=>state!=='granted')){stop('未获得动作权限，可以继续点按玩。');return}
      resetPose();seenPose=false;seenMotion=false;enabled=true;
      addEventListener('deviceorientation',orientation);addEventListener('devicemotion',motion);
      showMode('体感已授权','正在接收手机动作…');
      button.textContent='关闭体感';button.setAttribute('aria-pressed','true');
      $('hint').textContent='将手机顶端朝下，轻抖一下。撒好后扶正。';
      probe=setTimeout(()=>{if(!seenMotion||!seenPose)stop('还没有收到传感器数据，可重试或点瓶身撒料。')},5000);
    }catch{stop('浏览器未开放动作权限，可点瓶身撒料。')}
    finally{button.disabled=false}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetPose()});
  $('tapJar').addEventListener('click',e=>{if(e.target!==$('bottle'))sprinkle()});
})();
