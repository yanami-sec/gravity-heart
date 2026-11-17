// An optional camera journey. The inner scene uses cached nebula and particle text.
const heartJourney={active:false,clock:0,paused:false,returning:false,returnClock:0,storyOffset:0,gallerySkip:null,from:null,pose:{zoom:1,inside:0,focus:0,reveal:0},name:null,sky:null,cacheKey:'',focusBefore:null};
const innerStars=Array.from({length:850},(_,i)=>{const a=galaxySeed(i,12)*Math.PI*2,r=.35+Math.sqrt(galaxySeed(i,13))*11;return{x:Math.cos(a)*r,y:Math.sin(a)*r*.78,z:galaxySeed(i,14)*18,speed:.55+galaxySeed(i,15)*.55,size:.8+galaxySeed(i,16)*1.5,phase:galaxySeed(i,17)*Math.PI*2,color:i%4};});
function buildJourneyName(text){
 const chars=Array.from(text),lines=[];for(let i=0;i<chars.length;i+=8)lines.push(chars.slice(i,i+8).join(''));
 const mask=document.createElement('canvas'),measure=mask.getContext('2d');measure.font='600 150px "Heart WenKai","KaiTi",serif';
 mask.width=Math.ceil(Math.max(...lines.map(line=>measure.measureText(line).width),1)+56);mask.height=lines.length*174+48;
 const m=mask.getContext('2d',{willReadFrequently:true});m.font='600 150px "Heart WenKai","KaiTi",serif';m.textAlign='center';m.textBaseline='middle';m.fillStyle='#fff';lines.forEach((line,i)=>m.fillText(line,mask.width/2,111+i*174));
 const pixels=m.getImageData(0,0,mask.width,mask.height).data,c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;const p=c.getContext('2d'),dots=[];
 p.globalAlpha=.07;p.drawImage(mask,0,0);p.globalAlpha=1;p.shadowColor=themes[palette].accent;p.shadowBlur=3;
 for(let y=2;y<c.height;y+=2.5)for(let x=2;x<c.width;x+=2.5){const xx=Math.floor(x),yy=Math.floor(y),alpha=pixels[(yy*c.width+xx)*4+3]/255;if(alpha<.35)continue;const light=.65+galaxySeed(xx,yy)*.35;p.fillStyle=`rgba(255,229,242,${alpha*light})`;p.fillRect(x-.75,y-.75,1.65,1.65);dots.push({x:x-c.width/2,y:y-c.height/2,phase:(x*11+y*7)%(Math.PI*2)});}
 return {texture:c,dots,width:c.width,height:c.height};
}
function buildJourneyAssets(){
 const key=gift.to+'\0'+palette;if(heartJourney.cacheKey===key&&heartJourney.name&&heartJourney.sky)return;
 heartJourney.cacheKey=key;heartJourney.name=buildJourneyName(gift.to);
 const c=document.createElement('canvas');c.width=1024;c.height=768;const p=c.getContext('2d'),base=p.createLinearGradient(0,0,1024,768);base.addColorStop(0,'#070b1b');base.addColorStop(.5,'#121024');base.addColorStop(1,'#050912');p.fillStyle=base;p.fillRect(0,0,1024,768);
 p.globalCompositeOperation='lighter';
 const clouds=[{x:220,y:460,r:360,color:'69,91,175'},{x:700,y:210,r:350,color:themes[palette].rgb[0]},{x:810,y:650,r:300,color:'100,60,140'}];
 for(const cloud of clouds){const g=p.createRadialGradient(cloud.x,cloud.y,0,cloud.x,cloud.y,cloud.r);g.addColorStop(0,`rgba(${cloud.color},.14)`);g.addColorStop(.4,`rgba(${cloud.color},.06)`);g.addColorStop(1,`rgba(${cloud.color},0)`);p.fillStyle=g;p.fillRect(cloud.x-cloud.r,cloud.y-cloud.r,cloud.r*2,cloud.r*2);}
 p.globalAlpha=.6;p.save();p.translate(530,400);p.rotate(-.55);p.drawImage(galaxyCloud,-500,-350,1000,700);p.restore();
 // A dense, distant galaxy band sits behind the sparse moving foreground stars.
 for(let i=0;i<2900;i++){
  const r=.12+Math.sqrt(galaxySeed(i,31))*.98,a=(i%4)*Math.PI/2+r*4.6+(galaxySeed(i,32)-.5)*.44;
  const xx=Math.cos(a)*r*560+(galaxySeed(i,33)-.5)*38,yy=Math.sin(a)*r*175+(galaxySeed(i,34)-.5)*26,x=512+xx*.94+yy*.34,y=390-xx*.34+yy*.94,size=.45+galaxySeed(i,35)*.85,alpha=.055+Math.pow(galaxySeed(i,36),2)*.3;
  p.globalAlpha=alpha;p.fillStyle=`rgb(${themes[palette].rgb[i%4]})`;p.fillRect(x,y,size,size);
  if(i%103===0){p.globalAlpha=.35;p.drawImage(sprites[1],x-3,y-3,6,6);}
 }
 heartJourney.sky=c;
 $('journey-person').textContent=gift.to;
}
function journeyCanStart(){return state==='open'&&!stardustRose.active&&root.dataset.arrival!=='forming'&&morphPhase==='heart'&&!root.dataset.ending&&!document.querySelector('dialog[open]');}
function syncJourneyButton(){const disabled=heartJourney.active||!journeyCanStart();if($('enter-heart').disabled!==disabled)$('enter-heart').disabled=disabled;}
function startHeartJourney(){
 if(heartJourney.active||!journeyCanStart())return;
 buildJourneyAssets();prepareMemoryCorridor();resetJourneyButterflies();heartJourney.storyOffset=0;heartJourney.gallerySkip=null;heartJourney.active=true;heartJourney.clock=0;heartJourney.paused=false;heartJourney.returning=false;heartJourney.returnClock=0;heartJourney.from=null;heartJourney.pose={zoom:1,inside:0,focus:0,reveal:0};heartJourney.focusBefore=$('enter-heart');
 holding=false;hold=0;reasonHover=false;reasonHoverIndex=-1;motion.tx=motion.ty=0;root.dataset.journey='approach';document.querySelector('main').inert=true;
 $('journey-view').hidden=false;$('journey-view').dataset.phase='approach';$('journey-caption').style.opacity='0';$('journey-exit').textContent='← 返回爱心';syncRelayPause();$('journey-exit').focus({preventScroll:true});syncJourneyButton();
}
function syncRelayPause(){const button=$('journey-pause');button.textContent=heartJourney.paused?'继续':'暂停';button.setAttribute('aria-pressed',String(heartJourney.paused));button.setAttribute('aria-label',heartJourney.paused?'继续流星接力':'暂停流星接力');button.disabled=heartJourney.returning;}
function toggleRelayPause(){
 if(!heartJourney.active||heartJourney.returning)return;
 if(!heartJourney.paused){const timing=corridorTiming(),story=heartJourney.clock+heartJourney.storyOffset,frame=corridorFrames[corridorActiveIndex];if(story>=timing.final)heartJourney.clock=Math.max(heartJourney.clock,timing.final+.7-heartJourney.storyOffset);else if(frame?.butterflyPose?.alpha>.55)heartJourney.clock=Math.max(heartJourney.clock,timing.first+frame.index*timing.interval+timing.flight+.48-heartJourney.storyOffset);}
 heartJourney.paused=!heartJourney.paused;syncRelayPause();
}
function returnFromHeart(){
 if(!heartJourney.active||heartJourney.returning)return;
 heartJourney.returning=true;heartJourney.paused=false;heartJourney.returnClock=0;heartJourney.from={...heartJourney.pose};root.dataset.journey='return';$('journey-view').dataset.phase='return';$('journey-exit').textContent='正在回到爱心…';syncRelayPause();
}
function finishHeartJourney(){
 heartJourney.active=false;heartJourney.paused=false;heartJourney.returning=false;heartJourney.pose={zoom:1,inside:0,focus:0,reveal:0};delete root.dataset.journey;document.querySelector('main').inert=false;$('journey-view').hidden=true;$('journey-caption').style.opacity='0';hideMemoryCorridor();motion.tx=motion.ty=0;syncRelayPause();syncJourneyButton();$('bloom-rose').disabled=!roseCanStart();
 const target=heartJourney.focusBefore?.isConnected?heartJourney.focusBefore:$('enter-heart');target.focus({preventScroll:true});
}
function updateHeartJourney(dt){
 syncJourneyButton();if(!heartJourney.active)return {active:false,...heartJourney.pose};
 if(heartJourney.returning){
  heartJourney.returnClock+=dt;const duration=reduce?.45:heartJourney.from.inside<.1?.55:1.05,t=ease(heartJourney.returnClock/duration),from=heartJourney.from;
  heartJourney.pose={zoom:Math.exp(Math.log(from.zoom)*(1-t)),inside:from.inside*(1-t),focus:from.focus*(1-t),reveal:from.reveal*(1-t)};
  if(t>=1){finishHeartJourney();return {active:false,...heartJourney.pose};}
 }else{
  if(!heartJourney.paused)heartJourney.clock+=dt;const t=heartJourney.clock,story=t+heartJourney.storyOffset,final=corridorTiming().final;
  if(reduce){const inside=ease(t/.4);heartJourney.pose={zoom:1,inside,focus:inside,reveal:ease((story-final)/.5)};if(story>=final+2.25)returnFromHeart();}
  else{const focus=ease(t/.78),inside=ease((t-.02)/.58);heartJourney.pose={zoom:1+focus*.75,inside,focus,reveal:ease((story-final)/.65)};if(story>=final+2.5)returnFromHeart();}
  if(!heartJourney.returning&&heartJourney.pose.inside>.98){root.dataset.journey='inside';$('journey-view').dataset.phase='inside';}
 }
 return {active:true,...heartJourney.pose};
}
function paintHeartJourney(now,pose){
 if(!pose.active||pose.inside<=0||!heartJourney.sky)return;
 const blend=pose.inside,clock=reduce?0:heartJourney.clock+(heartJourney.returning?heartJourney.returnClock*.2:0),cx=w/2,cy=h*.44,focal=Math.min(w,h)*.84;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=blend;ctx.drawImage(heartJourney.sky,0,0,w,h);
 ctx.globalCompositeOperation='lighter';ctx.save();ctx.translate(cx,cy);ctx.rotate(clock*.009);ctx.globalAlpha=blend*.22;ctx.drawImage(galaxyCloud,-w*.7,-h*.7,w*1.4,h*1.4);ctx.restore();
 const count=mobile?430:innerStars.length,travel=reduce?0:heartJourney.clock*.32-(heartJourney.returning?heartJourney.returnClock*.32:0);
 for(let i=0;i<count;i++){
  const star=innerStars[i],z=1+((star.z-travel*star.speed)%18+18)%18,depth=focal/z,x=cx+(star.x+motion.x*.18)*depth,y=cy+(star.y+motion.y*.12)*depth;
  if(x< -35||x>w+35||y< -35||y>h+35||z<3.4)continue;
  const edge=Math.min(1,(z-1)*1.5,(19-z)*1.2),light=(.4+.6*(1-z/19))*edge,size=clamp(star.size*(.7+3.3/z),1,9),dim=Math.abs(x-cx)<w*.24&&Math.abs(y-cy)<h*.13?.38:1;
  ctx.globalAlpha=blend*light*dim;
  if(!reduce&&z<5){const previous=focal/(z+.025),dx=(star.x+motion.x*.18)*previous-(x-cx),dy=(star.y+motion.y*.12)*previous-(y-cy),length=Math.hypot(dx,dy),scale=length>15?15/length:1;ctx.strokeStyle=`rgba(${themes[palette].rgb[star.color]},.45)`;ctx.lineWidth=Math.max(.5,size*.25);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx*scale,y+dy*scale);ctx.stroke();}
  if(i%89===0){const s=12+10/z;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(clock*.22+star.phase)*.2);ctx.drawImage(galaxyHearts[i%2],-s/2,-s/2,s,s);ctx.restore();}
  else{ctx.drawImage(sprites[star.color],x-size/2,y-size/2,size,size);if(i%2===0){ctx.fillStyle='#f5e8ff';ctx.fillRect(x-.45,y-.45,.9,.9);}}
 }
 const name=heartJourney.name,reveal=pose.reveal,nameWidth=Math.min(w*.78,mobile?340:640)*(reduce?.9:(.84+ease((heartJourney.clock+heartJourney.storyOffset-corridorTiming().final)/2.5)*.16)*(.82+pose.focus*.18)),scale=nameWidth/name.width,nameHeight=name.height*scale,nx=cx+motion.x*4,ny=h*.44+motion.y*3;
 ctx.globalAlpha=blend*reveal;ctx.drawImage(name.texture,nx-nameWidth/2,ny-nameHeight/2,nameWidth,nameHeight);
 if(reveal>0&&reveal<1&&!reduce){const stride=Math.max(1,Math.floor(name.dots.length/70)),spread=(1-reveal)*48;for(let i=0;i<name.dots.length;i+=stride){const dot=name.dots[i],x=nx+dot.x*scale+Math.cos(dot.phase)*spread,y=ny+dot.y*scale+Math.sin(dot.phase)*spread;ctx.globalAlpha=blend*reveal*(1-reveal)*.9;ctx.drawImage(sprites[1],x-1.5,y-1.5,3,3);}}
 ctx.restore();
 paintMemoryCorridor(pose);paintMeteorBackdrop();paintJourneyForeground(blend,clock,travel,focal,cx,cy);
 const caption=$('journey-caption'),captionY=Math.min(h*.76,Math.max(h*.58,ny+nameHeight/2+27));heartJourney.nameBounds={x:nx,y:ny,width:nameWidth,height:nameHeight,captionY};caption.style.opacity=String(blend*reveal);caption.style.top=`${captionY}px`;
}
$('enter-heart').addEventListener('click',startHeartJourney);$('journey-exit').addEventListener('click',returnFromHeart);$('journey-pause').addEventListener('click',toggleRelayPause);
document.addEventListener('keydown',event=>{if(!heartJourney.active)return;if(event.key==='Escape'){event.preventDefault();returnFromHeart();}else if(event.code==='Space'&&event.target===document.body){event.preventDefault();toggleRelayPause();}else if(event.key==='Tab'){event.preventDefault();const buttons=[$('journey-pause'),$('journey-exit'),$('journey-skip')].filter(button=>!button.hidden&&!button.disabled),index=buttons.indexOf(document.activeElement),next=(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length;buttons[next].focus({preventScroll:true});}});
