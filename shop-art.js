// The illustrations are separate from the controls so the same art can be used
// for a customer's order, meal, and stamp on the receipt.
const ShopArt = (() => {
  function picture(name){
    const image=new Image();
    image.src='art/'+name+'.webp';
    return image;
  }
  const jars=['scallion','cumin','chili'].map(picture);
  const guestNames=['tabby','bear','rabbit'];
  const guests=guestNames.map(picture);
  const expressionSheets=[];
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function prepareGuest(id){
    expressionSheets[id]??=picture(guestNames[id]+'-reactions');
  }
  const meals=['ramen','skewers','dumplings'].map(picture);
  const ready=Promise.allSettled([...jars,...guests,...meals].map(image=>image.decode()));

  function contain(c,image,x,y,width,height,alignY=.5){
    if(!image.naturalWidth)return false;
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
    const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    c.drawImage(image,x+(width-w)/2,y+(height-h)*alignY,w,h);
    return true;
  }
  function jar(canvas,id){
    const c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);
    if(!contain(c,jars[id],0,0,canvas.width,canvas.height,1)){
      c.save();c.scale(canvas.width/64,canvas.height/72);Art.bottle(c,id);c.restore();
    }
  }
  function portrait(c,id){
    if(!contain(c,guests[id],0,0,c.canvas.width,c.canvas.height,1))Art.portrait(c,id);
  }
  function scoreSign(c,x,y,w,score,rise,handX,handY){
    c.save();
    c.translate(x,y+(1-rise)*w*.2);
    c.rotate((1-rise)*.13-.055);
    const h=w*.61;
    c.lineCap='round';c.lineJoin='round';
    c.lineWidth=w*.075;c.strokeStyle='#55392c';
    c.beginPath();c.moveTo(handX-x,handY-y);c.lineTo(w*.37,h*.77);c.stroke();
    c.lineWidth=w*.035;c.strokeStyle='#cb9559';c.stroke();
    c.beginPath();c.moveTo(0,h*.12);c.quadraticCurveTo(0,0,w*.12,0);
    c.lineTo(.9*w,.015*w);c.quadraticCurveTo(w,.015*w,w,h*.15);
    c.lineTo(w*.99,h*.88);c.quadraticCurveTo(w*.99,h,w*.9,h);c.lineTo(w*.1,h);
    c.quadraticCurveTo(0,h,0,h*.88);c.closePath();
    c.fillStyle=score===10?'#ffe19b':'#fff1cc';c.fill();
    c.strokeStyle='#54392c';c.lineWidth=Math.max(1.5,w*.035);c.stroke();
    c.fillStyle='#664330';c.textBaseline='middle';c.textAlign='center';
    c.font='800 '+w*.39+'px Georgia, serif';c.fillText(String(score),w*.39,h*.50);
    c.font='700 '+w*.17+'px Georgia, serif';c.fillText('/10',w*.76,h*.58);
    c.restore();
  }
  function meal(c,id,x,y,w,grains,time=Infinity){
    const img=meals[id];
    const ratio=img.naturalWidth?img.naturalHeight/img.naturalWidth:.62;
    const h=w*Math.min(.86,ratio);
    c.save();c.translate(x,y);
    c.fillStyle='rgba(89,54,31,.18)';c.beginPath();c.ellipse(0,h*.41,w*.41,h*.09,0,0,2*Math.PI);c.fill();
    if(!contain(c,img,-w/2,-h/2,w,h)){
      c.save();c.scale(w/96,h/72);c.translate(-48,-36);Art.food(c,id);c.restore();
    }
    // Keep the hand-sprinkled portions on the edible surface of the new plate.
    const garnishY=id===0?-.015:-.07;
    for(const g of grains){
      if(time<g.at)continue;
      const fall=Math.min(1,(time-g.at)/430);
      const px=(g.x-48)*w/95,py=garnishY*h+g.dy*h*.019-(1-fall*fall)*h*.87;
      c.save();c.translate(px,py);c.rotate(g.angle||0);
      c.beginPath();
      if(g.id===0){
        c.fillStyle='#a2c665';c.strokeStyle='#466b34';c.lineWidth=Math.max(.8,w*.005);
        c.ellipse(0,0,w*.020,w*.013,0,0,Math.PI*2);c.fill();c.stroke();
        c.beginPath();c.ellipse(w*.001,0,w*.009,w*.005,0,0,Math.PI*2);
        c.fillStyle='#e0e6a5';c.fill();
      }else{
        c.fillStyle=g.id===1?'#98602d':'#b9402e';
        c.ellipse(0,0,w*.014,w*.006,0,0,Math.PI*2);c.fill();
      }c.restore();
    }c.restore();
  }

  function room(c,t,serving,progress,dish,grains,eating,guestId,reaction,score,rise,missProgress=1){
    const {width:w,height:h}=c.canvas;
    c.clearRect(0,0,w,h);
    const scale=Math.max(w/16,h/9);
    const backdropH=9*scale;
    const tableY=(h-backdropH)*.70+backdropH*.75;
    const image=guests[guestId];
    const gh=Math.min(h*.60,w*.66);
    const gw=gh*(image.naturalWidth?image.naturalWidth/image.naturalHeight:.87);
    const center=w*.49;
    const bob=reducedMotion.matches?0:eating?Math.sin(t/104)*Math.min(3,gh*.018):Math.sin(t/810)*gh*.004;
    const foot=tableY+gh*.037+bob;
    c.save();
    c.translate(center,foot);
    if(reaction&&!reducedMotion.matches){
      const p=Math.min(1,reaction.elapsed/740);
      const pulse=Math.sin(Math.PI*p);
      switch(reaction.tier){
        case 0: c.translate(0,-Math.abs(Math.sin(2*Math.PI*p))*pulse*gh*.085);break;
        case 1: c.scale(1,1-.058*pulse);break;
        case 2: c.rotate(pulse*.09);break;
        case 3: c.translate(Math.sin(4*Math.PI*p)*pulse*gw*.05,-pulse*gh*.024);break;
      }
    }
    if(score!==null){
      scoreSign(c,gw*.53,-gh*.63,Math.min(gh*.46,w*.22),score,reducedMotion.matches?1:rise,
        gw*.27,-gh*.09);
    }
    const sheet=expressionSheets[guestId];
    if(reaction&&sheet?.naturalWidth){
      const tw=sheet.naturalWidth/2,th=sheet.naturalHeight/2;
      const i=reaction.tier;
      c.drawImage(sheet,(i%2)*tw,Math.floor(i/2)*th,tw,th,-gw/2,-gh,gw,gh);
    }else if(!contain(c,image,-gw/2,-gh,gw,gh,1)){
      c.translate(-gw/2,-gh);c.scale(gw/46,gh/54);Art.portrait(c,guestId);
    }
    c.restore();
    if(missProgress<1&&!reducedMotion.matches){
      const mw=Math.min(gh*.55,w*.28);
      meal(c,dish,w*(1.03-.33*missProgress),tableY+gh*.08+(h-tableY+mw)*missProgress**2,mw,grains);
    }
    if(serving){
      const mw=Math.min(gh*.67,w*.40);
      const dx=(1-progress)*(w*.56+mw);
      meal(c,dish,center+dx,Math.min(tableY+gh*.04,h-mw*.43-h*.025),mw,grains);
    }
  }
  let paintedPreview=null;
  function orderPreview(canvas,id,grains,time){
    const last=grains[grains.length-1];
    const settled=!last||time>=last.at+430;
    const imageWidth=meals[id].naturalWidth;
    if(settled&&paintedPreview?.canvas===canvas&&paintedPreview.id===id&&
      paintedPreview.last===last&&paintedPreview.imageWidth===imageWidth)return;
    paintedPreview=settled?{canvas,id,last,imageWidth}:null;
    const c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);
    meal(c,id,canvas.width/2,canvas.height*.53,canvas.width*.86,grains,time);
  }
  function counterDish(c,id){
    if(!contain(c,meals[id],4,0,88,66,1))Art.food(c,id);
  }
  return {ready,prepareGuest,jar,portrait,room,orderPreview,counterDish};
})();
