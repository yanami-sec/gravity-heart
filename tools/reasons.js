// Kept inline in the standalone HTML. These are editable example qualities.
const defaultReasons = `温柔
善良
真诚
体贴
细腻
耐心
宽容
亲切
热心
随和
谦逊
礼貌
正直
诚恳
可靠
忠诚
厚道
坦荡
友善
重情
可爱
灵动
俏皮
活泼
开朗
阳光
甜美
纯真
烂漫
率真
机灵
聪慧
伶俐
风趣
幽默
讨喜
明媚
俏丽
清秀
灵秀
勇敢
坚定
坚韧
独立
自信
自律
勤奋
上进
乐观
豁达
沉稳
果断
执着
专注
认真
踏实
勤勉
进取
坚毅
自强
优雅
大方
得体
端庄
文雅
娴静
温婉
秀丽
清丽
温润
俊秀
出众
清新
脱俗
精致
雅致
知性
感性
理性
睿智
善解人意
通情达理
表里如一
言而有信
光明磊落
坦率
贴心
暖心
包容
聪颖
敏锐
博学
谦和
从容
洒脱
磊落
爽朗
热忱
温雅
成熟`.split('\n');

let reasonNodes=[],reasonClock=0,reasonTick=0,reasonHover=false,reasonHoverIndex=-1,currentReason=0,reasonVisible=false,reasonRevealAt=Infinity,reasonOrbitFrame=[],reasonOrbitStrength=0,reasonOrbitGeometry=null;
const reasonGroups=['温柔品格','明亮性格','向上力量','独特气质','珍贵内在'];
function normalizeReasons(value){
 const list=Array.isArray(value)?value.map(s=>String(s).trim().slice(0,40)).filter(Boolean).slice(0,100):[];
 return list.length?list:[...defaultReasons];
}
function reasonNumber(i){return String(i+1).padStart(3,'0');}
function makeReasonParticles(text){
 const chars=Array.from(text),lines=[];for(let i=0;i<chars.length;i+=8)lines.push(chars.slice(i,i+8).join(''));
 const mask=document.createElement('canvas');mask.width=Math.max(1,Math.min(chars.length,8))*40+24;mask.height=lines.length*48+20;
 const m=mask.getContext('2d',{willReadFrequently:true});m.font='600 40px "Heart WenKai","KaiTi",serif';m.fillStyle='#fff';m.textAlign='center';m.textBaseline='middle';
 lines.forEach((line,i)=>m.fillText(line,mask.width/2,34+i*48));
 const pixels=m.getImageData(0,0,mask.width,mask.height).data,dots=[],texture=document.createElement('canvas');texture.width=mask.width;texture.height=mask.height;const c=texture.getContext('2d');c.globalAlpha=.13;c.drawImage(mask,0,0);c.globalAlpha=1;c.shadowColor='#ffd2e7';c.shadowBlur=2.2;
 // The letters themselves are sampled light points, cached once for smooth rendering.
 for(let y=2;y<mask.height;y+=2)for(let x=2;x<mask.width;x+=2){const alpha=pixels[(y*mask.width+x)*4+3]/255;if(alpha<.3)continue;const noise=(Math.sin(x*12.9898+y*78.233)*43758.5453)%1,light=.75+Math.abs(noise)*.25;c.fillStyle=`rgba(250,225,239,${alpha*light})`;c.fillRect(x-.85,y-.85,1.8,1.8);dots.push({x:x-mask.width/2,y:y-mask.height/2,phase:(x*7+y*13)%(Math.PI*2)});}
 return {texture,dots,width:mask.width,height:mask.height};
}
function renderReasons(){
 const field=$('reason-field');field.replaceChildren();reasonNodes=[];
 gift.reasons.forEach((text,i)=>{
  const button=document.createElement('button');button.type='button';button.className='reason-star';button.tabIndex=-1;button.hidden=true;
  const label=document.createElement('span');label.textContent=text;
  button.append(label);button.setAttribute('aria-label',`读一读：${text}`);
  button.addEventListener('pointerdown',event=>{if(event.button!==undefined&&event.button!==0)return;reasonHover=true;reasonHoverIndex=i;try{button.setPointerCapture(event.pointerId);}catch{}});button.addEventListener('click',()=>showReason(i));button.addEventListener('pointerenter',()=>{reasonHover=true;reasonHoverIndex=i;});button.addEventListener('pointerleave',()=>{reasonHover=false;reasonHoverIndex=-1;});
  field.append(button);reasonNodes.push({button,index:i,ring:i%3,slot:Math.floor(i/3),visible:false,opacity:0,letters:Array.from(text).length,particles:makeReasonParticles(text)});
 });
 $('reasons-count').textContent=gift.reasons.length;
 $('reason-total').textContent=gift.reasons.length;
 $('reason-all-count').textContent=`全部 ${gift.reasons.length} 个优点`;
 $('reason-list').replaceChildren();
 gift.reasons.forEach((text,i)=>{
  const b=document.createElement('button');b.type='button';b.className='reason-entry';
  const t=document.createElement('span');t.textContent=text;b.append(t);
  b.addEventListener('click',()=>{selectReason(i);$('reason-detail').scrollIntoView({block:'nearest',behavior:reduce?'instant':'smooth'});});$('reason-list').append(b);
 });
 reasonClock=0;reasonTick=0;reasonHover=false;reasonHoverIndex=-1;reasonVisible=false;reasonRevealAt=Infinity;reasonOrbitFrame=[];reasonOrbitStrength=0;$('reason-field').hidden=true;$('reasons-door').hidden=true;
}
function reasonOrbitPoint(angle,ring){
 const g=reasonOrbitGeometry,rx=Math.min(g.base*(1.5+ring*.1),g.w*.43,g.w/2-(g.mobile?60:78)),ry=Math.min(g.base*(.49+ring*.045),g.h*.155),tilt=[-.58,.42,.08][ring];
 const x=Math.cos(angle)*rx,y=(Math.sin(angle)+Math.cos(angle)*tilt)*ry;
 return {x:g.cx+x*reasonOrbitStrength,y:g.cy+(g.mobile?14:20)+y*reasonOrbitStrength,z:Math.sin(angle)};
}
function reasonOrbitSpin(ring){return reasonClock*(.17+ring*.022)*(ring===1?-1:1);}
function drawReasons(now,dt,base,cx,cy){
 const active=state==='open'&&morphPhase==='heart'&&!root.dataset.ending&&!root.dataset.rose;
 if(active!==reasonVisible){
  reasonVisible=active;reasonRevealAt=active?Math.max(now,openedAt+(reduce?800:3000)):Infinity;
  reasonOrbitFrame=[];reasonOrbitStrength=0;reasonHover=false;reasonHoverIndex=-1;
  for(const item of reasonNodes){item.opacity=0;item.visible=false;item.button.hidden=true;}
  $('reason-field').hidden=true;$('reasons-door').hidden=!active;
 }
 if(!active||now-reasonTick<16)return;
 const step=Math.min((now-reasonTick)/1000,.05);reasonTick=now;
 if(document.querySelector('dialog[open]'))return;
 const age=now-reasonRevealAt;
 if(age<0)return;
 if(!reduce&&!reasonHover&&!root.dataset.journey)reasonClock+=step;
 reasonOrbitStrength=.68+ease(age/1400)*.32;
 reasonOrbitGeometry={base,cx,cy,w,h,mobile};
 $('reason-field').hidden=age<1000;$('reasons-door').hidden=false;
 const candidates=[];
 for(const item of reasonNodes){
  const count=Math.ceil((reasonNodes.length-item.ring)/3),angle=item.slot/count*Math.PI*2+item.ring*.73+reasonOrbitSpin(item.ring),p=reasonOrbitPoint(angle,item.ring),depth=(p.z+1)/2;
  const size=.64+depth*.43,fontScale=Math.min(mobile?.38:.48,(mobile?104:160)/item.particles.width),gate=ease((age-1000-item.index/reasonNodes.length*1700)/1100);
  const frameWidth=Math.max(mobile?64:76,item.particles.width*fontScale+24),frameHeight=Math.max(mobile?56:64,item.particles.height*fontScale+28);
  candidates.push({item,angle,...p,depth,size,fontScale,gate,frameWidth,frameHeight,width:frameWidth*size,height:frameHeight*size,score:item.index===reasonHoverIndex?10:Math.sin(item.index*2.399963+reasonClock*.13)*.4+depth*.23,selected:false});
 }
 // Fade competing labels rather than displacing them off their circular paths.
 const chosen=[],budget=mobile?10:24;
 for(const record of [...candidates].sort((a,b)=>b.score-a.score)){
  if(record.gate<=0||chosen.length>=budget)continue;
  if(chosen.some(other=>Math.abs(other.x-record.x)<(other.width+record.width)/2+9&&Math.abs(other.y-record.y)<(other.height+record.height)/2+8))continue;
  record.selected=true;chosen.push(record);
 }
 reasonOrbitFrame=[];
 for(const record of candidates){
  const item=record.item,target=record.selected?1:0;
  item.opacity+=(target-item.opacity)*(reduce?1:Math.min(1,step*4));
  record.alpha=item.opacity*record.gate*(.4+record.depth*.58)*(1-hold*.7);
  const visible=record.alpha>.012,interactive=record.alpha>.18;
  if(item.visible!==visible){item.visible=visible;item.button.hidden=!visible;}
  item.button.style.pointerEvents=interactive?'auto':'none';item.button.style.zIndex=String(Math.round(record.alpha*100));
  if(!visible)continue;
  const tilt=Math.sin(record.angle)*4;
  item.button.style.width=`${record.frameWidth}px`;item.button.style.height=`${record.frameHeight}px`;
  item.button.style.transform=`translate3d(${record.x}px,${record.y}px,0) translate(-50%,-50%) rotate(${tilt}deg) scale(${record.size})`;
  item.button.style.opacity=String(record.alpha);item.button.dataset.readable=String(interactive);
  record.tilt=tilt;reasonOrbitFrame.push(record);
 }
}
function paintReasonOrbit(front){
 if(!reasonVisible||!reasonOrbitGeometry||!reasonOrbitStrength)return;
 const worldFade=typeof heartJourney!=='undefined'&&heartJourney.active?1-ease(heartJourney.pose.focus*4):1;const age=performance.now()-reasonRevealAt,strength=ease(age/1400)*(1-hold*.7)*worldFade,g=reasonOrbitGeometry;
 if(strength<=0)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let ring=0;ring<3;ring++){
  const count=g.mobile?115:210,spin=reasonOrbitSpin(ring),dir=ring===1?-1:1;
  for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2+spin+ring*.73,p=reasonOrbitPoint(angle,ring);
   if((p.z>=0)!==front)continue;
   const sparkle=.55+Math.sin(reasonClock*1.7+i*2.4)*.35,size=(i%19===0?5:i%5===0?3.2:2)*(g.mobile?.8:1);
   ctx.globalAlpha=strength*(front?.67:.27)*sparkle;
   ctx.drawImage(sprites[(i+ring)%sprites.length],p.x-size/2,p.y-size/2,size,size);if(i%3===0){ctx.fillStyle='#ffe2f0';ctx.fillRect(p.x-.4,p.y-.4,.8,.8);}
  }
  // Moving knots of light leave short, curved comet tails on the same rings.
  for(let j=0;j<24;j++){
   const angle=spin+ring*2.1-j*.019*dir,p=reasonOrbitPoint(angle,ring);
   if((p.z>=0)!==front)continue;
   const size=(5.5-j*.17)*(g.mobile?.8:1);
   ctx.globalAlpha=strength*Math.pow(1-j/24,2)*(front?.9:.38);
   ctx.drawImage(sprites[3],p.x-size/2,p.y-size/2,size,size);
  }
 }
 for(const record of reasonOrbitFrame){
  if((record.z>=0)!==front)continue;
  const {item}=record,drawAlpha=record.alpha*worldFade,scale=record.fontScale*record.size,texture=item.particles.texture,width=item.particles.width*scale,height=item.particles.height*scale;
  // Each particle word shares its orbit with a tiny trail of stardust.
  for(let j=1;j<=8;j++){
   const p=reasonOrbitPoint(record.angle-j*.012*(item.ring===1?-1:1),item.ring),size=(2.6-j*.2)*(g.mobile?.8:1);
   ctx.globalAlpha=drawAlpha*(1-j/9)*.45;
   ctx.drawImage(sprites[(j+item.index)%sprites.length],p.x-size/2,p.y-size/2,size,size);
  }
  ctx.save();ctx.translate(record.x,record.y);ctx.rotate(record.tilt*Math.PI/180);
  const frame=reasonHeartFrame(record.frameWidth,record.frameHeight),frameScale=record.size*(.92+record.gate*.08);
  ctx.globalAlpha=drawAlpha*record.gate*.7;ctx.drawImage(frame.texture,-frame.width*frameScale/2,-frame.height*frameScale/2,frame.width*frameScale,frame.height*frameScale);
  for(let k=0;k<2;k++){const a=reasonClock*.62+item.index*.7+k*Math.PI,p=reasonHeartPoint(a,record.frameWidth,record.frameHeight),s=(g.mobile?10:12)*record.size;ctx.globalAlpha=drawAlpha*.75;ctx.drawImage(galaxyHearts[k],p.x*record.size-s/2,p.y*record.size-s/2,s,s);}
  ctx.globalAlpha=Math.min(1,drawAlpha*record.gate*1.18);
  ctx.drawImage(texture,-width/2,-height/2,width,height);
  if(record.gate<.995){
   const dots=item.particles.dots,stride=Math.max(1,Math.floor(dots.length/32)),spread=(1-record.gate)*25;
   for(let j=0;j<dots.length;j+=stride){const dot=dots[j],x=dot.x*scale+Math.cos(dot.phase)*spread,y=dot.y*scale+Math.sin(dot.phase)*spread;ctx.globalAlpha=drawAlpha*(1-record.gate)*.8;ctx.drawImage(sprites[3],x-1,y-1,2,2);}
  }
  ctx.restore();
 }
 ctx.restore();
}
function selectReason(i){
 currentReason=(i+gift.reasons.length)%gift.reasons.length;
 $('reason-index').textContent=reasonNumber(currentReason);
 $('reason-group').textContent=reasonGroups[Math.min(4,Math.floor(currentReason/20))];
 $('reason-quote').textContent=gift.reasons[currentReason];
 $('reason-dedication').textContent=`这些微小的闪光，让${gift.to}成为特别的存在。`;
 [...$('reason-list').children].forEach((b,index)=>b.setAttribute('aria-current',String(index===currentReason)));
}
function showReason(i,all=false){
 selectReason(i);$('reason-catalog').open=all;
 if(!$('reason-dialog').open)$('reason-dialog').showModal();
 holding=false;hold=0;reasonHover=false;reasonHoverIndex=-1;
 $('close-reasons').focus({preventScroll:true});
}
function updateReasonEditor(){const n=$('reasons-input').value.split('\n').filter(s=>s.trim()).length;$('reasons-editor-count').textContent=`${n} / 100 个`;}
$('reasons-door').addEventListener('click',()=>showReason(currentReason,true));
$('close-reasons').addEventListener('click',()=>{$('reason-dialog').close();$('reasons-door').focus({preventScroll:true});});
$('previous-reason').addEventListener('click',()=>selectReason(currentReason-1));
$('next-reason').addEventListener('click',()=>selectReason(currentReason+1));
$('reasons-input').addEventListener('input',updateReasonEditor);
$('reset-reasons').addEventListener('click',()=>{$('reasons-input').value=defaultReasons.join('\n');updateReasonEditor();});
