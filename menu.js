// A menu contains one visit from each regular. The same local calendar day has the same menu.
const dailyMenu = (() => {
  const guests=[[0,1,2],[1,2,0],[2,0,1],[0,2,1],[2,1,0],[1,0,2]];
  const portions=['一下','两下','三下'];
  const dishes=['拉面','烤串','煎饺'];
  const labels=[['加葱','多葱','葱满满'],['孜然','多孜然','浓孜然'],['微辣','中辣','重辣']];
  const praise=['葱香刚刚好！','孜然真香！','这个辣度正好！'];
  const origin=Date.UTC(2026,10,27);
  function forDate(date=new Date()){
    const day=Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-origin)/86400000);
    const menuId=((day%300)+300)%300;
    // 197 is coprime with 324: the first 300 entries are all different.
    let code=(menuId*197+1)%324;
    const quantityCode=code%27;
    code=Math.floor(code/27);
    const visitors=guests[code%6];
    const courses=code<6?[0,1,2]:[0,2,1];
    return courses.map((dishId,i)=>{
      const id=visitors[i],count=1+Math.floor(quantityCode/(3**i))%3;
      return {dish:dishes[dishId],dishId,id,count,short:labels[id][count-1],word:portions[count-1],good:praise[id],menuId:menuId+1};
    });
  }
  return forDate;
})();
