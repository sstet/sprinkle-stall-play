// All sprites are drawn on small integer grids and scaled with nearest-neighbour sampling.
const Art = (() => {
  const ink='#433043', jade=['#40674b','#83b85f','#d6ee91'], spice=['#975536','#d79950','#ffe19a'], red=['#9d3e49','#ed6c60','#ffb77d'];
  const palettes=[jade,spice,red];
  function pen(c){
    const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
    const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
    function ellipse(x,y,rx,ry,color){for(let j=-ry;j<=ry;j++){const reach=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/(ry*ry))));box(x-reach,y+j,reach*2+1,1,color)}}
    function line(x,y,ex,ey,color,size=1){const n=Math.max(1,Math.abs(ex-x),Math.abs(ey-y));for(let k=0;k<=n;k++)box(x+(ex-x)*k/n,y+(ey-y)*k/n,size,size,color)}
    return {box,poly,ellipse,line};
  }
  function star(c,x,y,s,color){const {box}=pen(c);box(x-s,y,2*s+1,1,color);box(x,y-s,1,2*s+1,color);if(s>2)box(x-1,y-1,3,3,color)}
  function face(c,x,y,gap=7){const {box}=pen(c);box(x-gap,y,2,3,ink);box(x+gap,y,2,3,ink);box(x-2,y+4,2,1,ink);box(x,y+5,3,1,ink);box(x+3,y+4,1,1,ink);box(x-gap-4,y+4,4,2,'#ed9c98');box(x+gap+3,y+4,4,2,'#ed9c98')}
  function noodle(c){
    const {box,poly,ellipse,line}=pen(c);
    // Chopsticks behind the rim.
    line(45,33,75,4,'#a7593e',3);line(46,32,75,4,'#ffe2a5');line(52,35,83,10,'#ba6b48',3);line(53,34,83,10,'#ffe9af');
    poly([[7,31],[88,31],[85,44],[79,52],[67,60],[60,61],[59,65],[36,65],[34,61],[25,58],[16,51],[10,42]],ink);
    poly([[9,32],[86,32],[82,44],[76,51],[66,57],[57,60],[37,60],[23,54],[15,46]],'#9ebbc7');
    poly([[10,33],[81,33],[77,43],[70,49],[58,55],[37,56],[24,51],[16,45]],'#f8e9ce');
    poly([[13,39],[22,44],[37,47],[57,47],[75,42],[82,37],[79,43],[73,47],[60,51],[36,51],[23,48],[16,44]],'#5493ab');
    box(37,60,21,3,'#dbe3d6');ellipse(47,32,41,12,ink);ellipse(47,31,39,11,'#e5caa8');ellipse(47,32,36,8,'#a9533e');ellipse(46,32,34,7,'#d58a44');
    for(let i=0;i<5;i++){const x=23+i*4,y=30+(i%3)*2;line(x,y+4,x+6,y,'#ffda76',2);line(x+7,y,x+14,y+3,'#ffe594',2);line(x+15,y+3,x+21,y,'#f7c363',2)}
    // A sheet of nori, a soft egg and pink narutomaki.
    poly([[15,28],[13,16],[24,12],[30,27],[24,31]],'#354e45');line(16,17,21,15,'#78a273',2);line(18,20,22,18,'#50745c',2);
    ellipse(62,24,9,9,'#ceac86');ellipse(62,23,8,9,'#fff1c9');ellipse(62,24,5,5,'#ffa649');box(60,21,3,2,'#ffd16d');
    ellipse(35,25,7,6,'#f9e0c6');line(31,23,36,22,'#ed91a1',2);line(37,23,38,26,'#ed91a1',2);line(37,27,33,27,'#ed91a1');box(34,25,2,1,'#ed91a1');
  }
  function plate(c){const {ellipse}=pen(c);ellipse(48,48,41,12,ink);ellipse(48,46,40,11,'#86a6ba');ellipse(48,44,39,10,'#e5e7d6');ellipse(48,44,33,7,'#b6c3b9')}
  function food(c,id){
    if(!id){noodle(c);return}plate(c);const {box,poly,line}=pen(c);
    if(id===1){for(let j=0;j<3;j++){const x=13+j*12,y=39+j*4;line(x,y+11,x+42,y-26,'#ad7851',3);line(x,y+10,x+42,y-27,'#ffdd93');for(let i=0;i<3;i++){const u=x+9*i+8,v=y-8*i;poly([[u-4,v-5],[u+2,v-9],[u+10,v-6],[u+11,v],[u+5,v+5],[u-3,v+2]],'#723f3d');poly([[u-3,v-4],[u+2,v-7],[u+8,v-5],[u+9,v],[u+4,v+2],[u-2,v]],'#d57d49');box(u,v-4,5,2,'#f4b469');box(u+4,v,3,2,'#9b4f3e')}}}
    else{for(const [x,y] of [[35,36],[60,34],[46,47]]){poly([[x-14,y],[x-10,y-9],[x-4,y-13],[x+1,y-11],[x+5,y-12],[x+11,y-7],[x+15,y+1],[x+10,y+5],[x-8,y+6]],'#9a644b');poly([[x-12,y],[x-9,y-8],[x-4,y-11],[x,y-9],[x+5,y-10],[x+10,y-6],[x+13,y],[x+7,y+3],[x-8,y+3]],'#f4cd8c');for(let i=0;i<4;i++)line(x-8+i*5,y-6-(i%2)*2,x-5+i*5,y-2,'#c99762');box(x-7,y+1,13,2,'#e0a767')}}
  }
  function bottle(c,id){
    const {box,poly,ellipse}=pen(c),p=palettes[id];ellipse(32,66,20,3,'#b8c5a2');
    const body=[[12,27],[17,22],[19,19],[45,19],[47,23],[52,27],[52,59],[49,62],[46,64],[18,64],[12,59]];
    poly(body,ink);poly([[14,28],[20,23],[21,21],[43,21],[47,25],[50,28],[50,58],[46,62],[19,62],[14,58]],'#d0e1ce');
    box(17,29,30,27,'#eff2d9');box(16,35,33,21,p[1]);box(18,32,8,5,p[1]);box(34,33,11,4,p[1]);box(18,57,27,3,p[0]);
    for(let i=0;i<32;i++){let x=17+(i*17)%31,y=36+(i*11)%21;box(x,y,3,2,i%2?p[0]:p[2])}
    poly([[20,38],[44,38],[47,41],[47,52],[44,55],[20,55],[17,52],[17,41]],p[0]);box(19,40,26,12,'#fff3c7');
    c.save();c.translate(20,39);c.scale(.8,.72);token(c,id);c.restore();
    box(15,14,34,9,ink);box(16,7,32,13,ink);box(19,5,26,3,ink);box(18,9,28,10,p[1]);box(20,7,24,2,p[2]);for(let x=21;x<46;x+=5)box(x,10,2,7,p[0]);
    box(17,20,30,2,p[0]);box(16,28,3,7,'#fffce9');box(46,29,2,6,'#fffce9');
  }
  function token(c,id){const {box,line,ellipse}=pen(c);if(id===0){for(const [x,y] of [[10,9],[18,12],[15,6]]){ellipse(x,y,4,3,jade[0]);ellipse(x,y-1,3,2,jade[1]);box(x,y-1,2,1,'#d5edac')}}else if(id===1){for(let i=0;i<6;i++){const x=6+(i*7)%16,y=4+i*2;line(x,y,x+3,y-2,spice[0],2);box(x+1,y-1,2,1,spice[2])}}else{line(8,13,13,13,red[0],3);line(13,13,20,6,red[1],4);line(20,7,22,3,jade[0],2);box(8,12,5,1,red[2])}}
  const coats=[
    {fur:'#fff0d8',shade:'#e7c6a6',shirt:'#81b49b',trim:'#d9efc2'},
    {fur:'#b78662',shade:'#976647',shirt:'#8198be',trim:'#e8c48c'},
    {fur:'#f4e1df',shade:'#d5afae',shirt:'#ba819a',trim:'#f3c992'}
  ];
  function guest(c,id){
    const {box,ellipse,poly}=pen(c),{fur,shade,shirt,trim}=coats[id];
    // Clothing and ears sit behind the shared head silhouette.
    ellipse(94,64,17,11,ink);ellipse(94,64,14,9,shirt);
    box(85,59,18,4,trim);box(96,61,4,6,trim);
    if(id===0){
      for(const x of [74,99]){
        poly([[x,39],[x,23],[x+4,23],[x+14,35],[x+14,40]],ink);
        poly([[x+3,37],[x+3,27],[x+10,35]],fur);
        box(x+4,30,3,5,'#e6aaa1');
      }
    }else if(id===1){
      for(const x of [78,109]){ellipse(x,33,8,8,ink);ellipse(x,33,6,6,fur);ellipse(x,34,3,3,shade)}
    }else{
      for(const [x,y] of [[84,22],[101,19]]){ellipse(x,y,5,13,ink);ellipse(x,y,3,11,fur);box(x-1,y-7,2,13,'#dfaaa9')}
    }
    ellipse(94,46,21,16,ink);ellipse(94,46,19,14,fur);
    if(id===1){ellipse(94,51,8,5,'#dfbb95');box(92,47,5,2,ink)}
    if(id===0){for(const x of [85,91,97])box(x,32,3,3,shade)}
    if(id===2){box(106,30,9,4,'#7f5866');box(107,29,3,5,'#e48c99');box(112,29,3,5,'#e48c99');box(110,31,2,2,'#ffe5b1')}
    face(c,93,43,8);
  }
  function portrait(c,id){
    c.save();c.scale(.88,.88);c.translate(-68,-7);guest(c,id);c.restore();
  }
  function paddle(c,score,rise,id){
    const {box,ellipse}=pen(c),{fur,shade,shirt}=coats[id];
    const drop=Math.round(7*(1-rise));
    // Short sleeve and rounded paw are tucked against the shoulder.
    ellipse(108,59,7,6,ink);ellipse(108,59,5,4,shirt);
    c.save();c.translate(0,drop);
    box(114,43,4,14,ink);box(115,43,2,13,'#d19b69');
    box(110,21,40,23,ink);box(112,19,36,27,ink);
    box(112,22,36,20,score===10?'#ffda7a':'#ffe9c9');
    box(113,22,34,2,'#fff8df');box(113,40,34,2,'#e5b581');
    c.textAlign='right';c.fillStyle=ink;c.font='bold 16px monospace';
    c.fillText(String(score),133,38);c.textAlign='left';c.font='bold 8px monospace';c.fillText('/10',134,37);
    ellipse(114,55,5,5,ink);ellipse(114,55,3,3,fur);box(113,57,3,1,shade);
    if(score===10){star(c,154,24,3,'#fff4b8');star(c,152,42,1,'#fff4b8')}
    c.restore();
  }
  function room(c,t,serving,progress,meal,grains,eating,guestId,score,rise){
    const {box,line}=pen(c);box(0,0,200,96,'#eed4bd');for(let x=0;x<200;x+=14)box(x,0,2,63,'#e5b9ad');
    box(9,12,40,35,'#795c71');box(12,15,34,29,'#a1d6db');box(14,17,30,23,'#bbdfe3');box(27,15,3,29,'#fff1d0');box(12,28,34,3,'#fff1d0');
    c.save();c.translate(0,eating?Math.floor(t/450)%2:0);
    guest(c,guestId);
    if(score!==null)paddle(c,score,rise,guestId);
    if(eating)line(101,57,106,50+Math.floor(t/450)%2*2,'#9c6a48',1);
    c.restore();
    box(0,66,200,30,'#bf7e67');box(0,66,200,4,'#ffe2ac');box(0,72,200,2,'#9a625b');for(let x=3;x<200;x+=30)box(x,82,15,1,'#a8695d');
    if(serving){c.save();c.translate(70+(1-progress)*130,49);c.scale(.53,.53);food(c,meal);drawGrains(c,grains,1,meal);c.restore()}
  }
  function drawGrains(c,grains,amount,meal){
    const {box}=pen(c);
    for(const grain of grains){
      const y=(meal===0?32:41)+grain.dy-(1-amount*amount)*65;
      const x=grain.x+Math.sin(amount*Math.PI)*(grain.dy*.4);
      c.save();c.translate(x,y);c.rotate(grain.angle||0);
      if(grain.id===0){
        box(-2,-1,4,1,'#7d993c');box(-2,0,1,2,'#587235');
        box(1,0,1,2,'#4d7332');box(-1,1,2,1,'#9cb754');
      }else if(grain.id===1){
        box(-1,0,3,1,'#92532c');box(0,-1,2,1,'#dbac56');
      }else{
        box(-1,-1,3,2,'#ad3e29');box(0,-1,2,1,'#ee7752');
      }
      c.restore();
    }
  }
  function sky(c,w,h){const {box,ellipse,line}=pen(c);
    box(0,0,w,h,'#c7c6ee');for(let y=0;y<h*.63;y+=5)box(0,y,w,1,'#ded8f282');
    const floor=Math.round(h*.67);const cloud=(x,y,s)=>{c.save();c.translate(x,y);c.scale(s,s);const {box}=pen(c);box(0,10,53,7,'#aaa6d3');box(4,6,45,10,'#eee5ee');box(10,2,11,12,'#eee5ee');box(23,-4,14,17,'#eee5ee');box(32,1,9,12,'#eee5ee');box(5,14,46,3,'#dacfe5');c.restore()};
    [[.04,.32,1],[.40,.17,.83],[.76,.31,1.05],[.93,.11,.7]].forEach(([x,y,s])=>cloud(Math.floor(x*w),Math.floor(y*h),s));
    for(let i=0;i<18;i++)star(c,Math.floor((i*73+25)%w),9+(i*29)%Math.max(12,floor-24),i%4===0?3:1,i%3?'#fdf0cc':'#9c91c8');
    // Distant tiled rooftops and a quiet checked countertop.
    for(let x=-8,i=0;x<w;x+=20,i++){let ht=7+(i*17)%18;box(x,floor-ht,19,ht,'#aaa6ce');box(x+2,floor-ht-2,15,2,'#aaa6ce');for(let n=0;n<3;n++)box(x+4+n*5,floor-ht+4,2,3,'#cec6df')}
    box(0,floor-2,w,3,'#837698');box(0,floor+1,w,4,'#eed4dc');box(0,floor+5,w,h-floor,'#dec5db');
    for(let y=floor+5,r=0;y<h;y+=10,r++){for(let x=-14;x<w;x+=28){box(x+(r%2)*14,y,14,10,'#e9d9e4')}}
    // Paper lanterns, intentionally outside the simulated devices.
    for(const [x,length] of [[Math.round(w*.06),12],[Math.round(w*.94),8]]){
      line(x,0,x,length,'#745d7b');box(x-5,length,11,3,'#71546a');ellipse(x,length+12,9,10,'#9c607d');ellipse(x,length+11,8,9,'#f29bb4');box(x-4,length+4,2,15,'#ffccd0');box(x+2,length+4,1,15,'#d67f9e');box(x-5,length+21,11,2,'#79596b');box(x,length+23,2,5,'#ac7583')}
  }
  function order(c){const {box,line}=pen(c);box(4,3,18,24,ink);box(5,4,16,21,'#ffe6a7');box(8,1,11,5,ink);box(9,2,9,2,'#d39db1');for(let y=10;y<21;y+=4){box(8,y,2,2,'#9a6981');line(12,y,18,y,'#a87d72')}}
  return {food,bottle,token,sky,room,portrait,order,drawGrains,star};
})();
