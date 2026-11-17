// Photographic wing texture, cached hinge poses, and a stationary body/antennae.
const starlightButterflies={sprites:[],spriteCache:{},spritePalette:null,texture:null,loading:false,clock:0,outer:[],inner:[],width:0,height:0,pointer:{x:-1000,y:-1000,active:false,touch:false,until:0}};
function makeButterflyVeil(source,tone){
 const edge=source.width,c=document.createElement('canvas');c.width=c.height=edge;
 const p=c.getContext('2d'),raw=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,edge,edge),pixels=raw.data;
 const veil=p.createImageData(edge,edge),rim=p.createImageData(edge,edge),accent=themes[palette].rgb[tone?1:0],light=accent.map(v=>Math.round(v*.54+255*.46));
 const alphaAt=(x,y)=>x<0||y<0||x>=edge||y>=edge?0:pixels[(y*edge+x)*4+3]/255;
 const luminanceAt=(x,y)=>{const i=(clamp(y,0,edge-1)*edge+clamp(x,0,edge-1))*4;return (pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;};
 for(let y=0;y<edge;y++)for(let x=0;x<edge;x++){
  const i=(y*edge+x)*4,a=pixels[i+3]/255;if(a<.025)continue;
  const luminance=luminanceAt(x,y),shine=clamp(luminance*1.8,0,1),boundary=Math.max(0,a-Math.min(alphaAt(x-2,y),alphaAt(x+2,y),alphaAt(x,y-2),alphaAt(x,y+2)));
  const neighbors=(luminanceAt(x-2,y)+luminanceAt(x+2,y)+luminanceAt(x,y-2)+luminanceAt(x,y+2))/4,vein=clamp((neighbors-luminance)*4,0,1);
  for(let channel=0;channel<3;channel++){veil.data[i+channel]=light[channel]*(.84+shine*.16);rim.data[i+channel]=light[channel]*.64+255*.36;}
  // Keep the real anatomy, but let the galaxy remain visible through the wing membrane.
  veil.data[i+3]=Math.round(a*(.12+shine*.24)*255);
  rim.data[i+3]=Math.round(clamp(boundary*.52+vein*a*.22,0,.65)*255);
 }
 p.putImageData(veil,0,0);const edgeLight=document.createElement('canvas');edgeLight.width=edgeLight.height=edge;edgeLight.getContext('2d').putImageData(rim,0,0);
 p.save();p.globalCompositeOperation='lighter';p.globalAlpha=.58;p.shadowBlur=3;p.shadowColor=`rgb(${light})`;p.drawImage(edgeLight,0,0);p.restore();
 // Fixed grains stay attached to the wing, rather than flickering to new positions every frame.
 p.save();p.globalCompositeOperation='lighter';
 for(let y=19;y<174;y+=3.2)for(let x=7;x<185;x+=3.2){
  const px=Math.floor(x),py=Math.floor(y),i=(py*edge+px)*4,a=pixels[i+3]/255,seed=galaxySeed(px,py+71);
  if(a<.6||seed>.25||luminanceAt(px,py)<.12)continue;
  const radius=seed<.025?1.15:.6;p.globalAlpha=seed<.025?.68:.2;p.fillStyle=`rgb(${light})`;p.beginPath();p.arc(x,y,radius,0,Math.PI*2);p.fill();
 }
 p.restore();return c;
}
function buildButterflySprites(){
 const world=starlightButterflies;
 if(world.spritePalette===palette&&world.sprites.length)return;
 if(world.spriteCache[palette]){world.sprites=world.spriteCache[palette];world.spritePalette=palette;return;}
 if(!world.texture){
  if(world.loading)return;
  const data=document.getElementById('butterfly-texture-data');if(!data)return;
  world.loading=true;const image=new Image();
  image.onload=()=>{world.texture=image;world.loading=false;buildButterflySprites();};
  image.onerror=()=>{world.loading=false;};image.src=JSON.parse(data.textContent).src;return;
 }
 const edge=192,hinge=95,source=document.createElement('canvas');source.width=source.height=edge;
 const s=source.getContext('2d',{willReadFrequently:true});s.imageSmoothingQuality='high';s.drawImage(world.texture,0,0,edge,edge);
 const anatomy=document.createElement('canvas');anatomy.width=anatomy.height=edge;const a=anatomy.getContext('2d');
 // The central body and the antennae do not fold with the wings.
 a.save();a.beginPath();a.moveTo(60,24);a.lineTo(132,24);a.lineTo(101,72);a.lineTo(103,79);a.lineTo(101,109);a.lineTo(98,138);a.lineTo(95,149);a.lineTo(91,139);a.lineTo(88,109);a.lineTo(88,80);a.lineTo(91,71);a.closePath();a.clip();a.drawImage(source,0,0);a.globalCompositeOperation='source-in';a.fillStyle=`rgba(${themes[palette].rgb[1]},.56)`;a.fillRect(0,0,edge,edge);a.restore();
 // A quiet rim keeps the slender body legible against the dark star field.
 a.strokeStyle=`rgba(${themes[palette].rgb[1]},.42)`;a.lineWidth=.55;a.beginPath();a.moveTo(91,80);a.quadraticCurveTo(86,100,92,130);a.moveTo(100,80);a.quadraticCurveTo(105,100,98,130);a.stroke();
 const atlas=[];
 for(let tone=0;tone<2;tone++){
  const frames=[],material=makeButterflyVeil(source,tone);
  for(let frame=0;frame<24;frame++){
   const phase=frame/24*Math.PI*2,c=document.createElement('canvas');c.width=c.height=edge;const p=c.getContext('2d');p.imageSmoothingQuality='high';
   for(const side of [-1,1]){
    const wingPhase=phase+side*.075*Math.sin(phase),spread=.14+.86*(.5+.5*Math.cos(wingPhase)),bend=Math.sin(wingPhase)*.105;
    p.save();p.translate(hinge,94);p.transform(spread,side*bend,0,.97+.03*spread,0,0);
    // Clip the open space above the thorax, so antennae cannot hitch a ride on a wing.
    p.beginPath();p.moveTo(0,-3);p.lineTo(side*39,-52);p.lineTo(side*82,-81);p.lineTo(side*100,-85);p.lineTo(side*100,88);p.lineTo(0,88);p.closePath();p.clip();
    p.globalAlpha=.86+.14*(.5+.5*Math.sin(wingPhase));
    p.drawImage(material,-hinge,-94);p.restore();
   }
   p.drawImage(anatomy,0,0);frames.push(c);
  }
  atlas.push(frames);
 }
 world.spriteCache[palette]=atlas;world.sprites=atlas;world.spritePalette=palette;
}
function butterflyCount(inner){if(reduce)return mobile?5:8;return inner?(mobile?8:14):(mobile?10:20);}
function makeButterfly(index,inner){
 const side=index%2===0?-1:1,depth=index%5===0?.9:.12+galaxySeed(index,64)*.56;
 const openX=.08+.84*((index*.61803398875+.17)%1);const startX=!inner&&state==='sealed'&&!mobile?.53+galaxySeed(index,38)*.38:inner?(index<2?(side<0?.2:.8):openX):openX,startY=inner?(index<2?.2+galaxySeed(index,40)*.1:.48+galaxySeed(index,40)*.16):state==='sealed'&&mobile?.5+galaxySeed(index,41)*.18:.34+galaxySeed(index,41)*.34;
 return {id:index,x:w*startX,y:h*startY,vx:side*15,vy:-6,targetX:w*.5,targetY:h*.5,mode:'wander',timer:0,cooldown:0,nextPerch:.35+index*.7,frameIndex:-1,rosePetal:-1,corner:side,phase:galaxySeed(index,42)*Math.PI*2,wingPhase:galaxySeed(index,62)*Math.PI*2,bank:0,size:(mobile?42:50)*(.8+galaxySeed(index,43)*.25),depth,visualDepth:depth,canPerch:index%3===0||index===1,tone:index%2,angle:0,alpha:0,trail:[],trailClock:0,spooked:0};
}
function ensureButterflyFlocks(){
 if(starlightButterflies.width===w&&starlightButterflies.height===h&&starlightButterflies.outer.length)return;
 starlightButterflies.width=w;starlightButterflies.height=h;
 starlightButterflies.outer=Array.from({length:butterflyCount(false)},(_,i)=>makeButterfly(i,false));
 starlightButterflies.inner=Array.from({length:butterflyCount(true)},(_,i)=>makeButterfly(i,true));
}
function resetJourneyButterflies(){ensureButterflyFlocks();starlightButterflies.inner=Array.from({length:butterflyCount(true)},(_,i)=>makeButterfly(i,true));}
function butterflyAnchor(frame,corner){
 const pose=frame?.butterflyPose;if(!pose||pose.alpha<.55||pose.scale<.4||pose.scale>1.4)return null;
 const lx=corner*(pose.width/2-22)*pose.scale,ly=(-pose.height/2+3)*pose.scale,roll=pose.roll*Math.PI/180,yaw=pose.yaw*Math.PI/180;
 const rx=lx*Math.cos(roll)-ly*Math.sin(roll),ry=lx*Math.sin(roll)+ly*Math.cos(roll),z=-rx*Math.sin(yaw),perspective=1000/(1000-z),x=pose.x+rx*Math.cos(yaw)*perspective,y=pose.y+ry*perspective;
 if(x<22||x>w-22||y<85||y>h-95)return null;for(const other of corridorFrames){const front=other.butterflyPose;if(other!==frame&&front&&front.alpha>.7&&front.depth<pose.depth&&Math.abs(x-front.x)<front.width*front.scale*.47&&Math.abs(y-front.y)<front.height*front.scale*.47)return null;}
 return {x,y,angle:roll,scale:pose.scale,alpha:pose.alpha};
}
function butterflyPointerNear(b,radius){const p=starlightButterflies.pointer;return p.active&&Math.hypot(b.x-p.x,b.y-p.y)<radius;}
function letButterflyFly(b,anchor){
 const p=starlightButterflies.pointer,dx=p.active?b.x-p.x:b.corner*55,dy=p.active?b.y-p.y:-60,d=Math.hypot(dx,dy)||1;
 b.mode='flee';b.timer=1.05;b.cooldown=3.3;b.nextPerch=3.3;b.frameIndex=-1;b.rosePetal=-1;b.spooked=.9;b.vx=dx/d*115;b.vy=dy/d*95-22;b.targetX=clamp(b.x+dx/d*150,30,w-30);b.targetY=clamp(b.y+dy/d*120-35,h*.18,h*.74);
}
function chooseButterflyPerch(b){
 let choice=null,score=Infinity;
 for(let i=0;i<corridorFrames.length;i++)for(const corner of [-1,1]){
  if(starlightButterflies.inner.some(other=>other!==b&&other.frameIndex===i&&other.corner===corner&&(other.mode==='approach'||other.mode==='perched')))continue;
  const anchor=butterflyAnchor(corridorFrames[i],corner);if(!anchor)continue;
  if(starlightButterflies.pointer.active&&Math.hypot(anchor.x-starlightButterflies.pointer.x,anchor.y-starlightButterflies.pointer.y)<85)continue;
  const d=Math.hypot(anchor.x-b.x,anchor.y-b.y);if(d<score){score=d;choice={index:i,corner,anchor};}
 }
 if(choice&&score<Math.max(300,w*.4)){b.mode='approach';b.frameIndex=choice.index;b.corner=choice.corner;b.timer=3.2;return true;}return false;
}
function butterflyFreeTarget(b,inner){
 const left=(!inner&&state==='sealed'&&!mobile)?.48:.08,right=.94;
 let x=0,y=0,found=false;
 for(let attempt=0;attempt<9;attempt++){
  x=w*(left+galaxySeed(b.id+attempt*17,starlightButterflies.clock*.37+45)*(right-left));y=h*((inner?.23:.32)+galaxySeed(b.id+attempt*23,starlightButterflies.clock*.19+46)*(inner?.48:.38));
  const blocked=inner?corridorFrames.some(frame=>{const p=frame.butterflyPose;return p&&p.alpha>.55&&Math.abs(x-p.x)<p.width*p.scale/2+24&&Math.abs(y-p.y)<p.height*p.scale/2+24;}):reasonOrbitFrame.some(word=>word.alpha>.3&&Math.abs(x-word.x)<word.width/2+24&&Math.abs(y-word.y)<word.height/2+24);
  if(!blocked){found=true;break;}
 }
 if(!found&&inner){x=w*(.08+galaxySeed(b.id,52)*.84);y=h*(b.id%2?.74:.2);}
 b.targetX=x;b.targetY=y;b.timer=2.5+galaxySeed(b.id,starlightButterflies.clock+47)*3;
}
function advanceButterfly(b,dt,inner){
 const world=starlightButterflies;b.timer-=dt;b.cooldown=Math.max(0,b.cooldown-dt);b.nextPerch-=dt;b.spooked=Math.max(0,b.spooked-dt);
 const targetDepth=b.mode==='perched'||b.mode==='approach'?.92:clamp(b.depth+(reduce?0:Math.sin(world.clock*.3+b.phase)*.09),0,1);b.visualDepth+=(targetDepth-b.visualDepth)*(1-Math.exp(-dt*2));
 if(!reduce){
  if(b.mode==='wander'&&Math.sin(world.clock*.88+b.phase)>.68)b.wingPhase+=Math.atan2(Math.sin(-b.wingPhase),Math.cos(-b.wingPhase))*Math.min(1,dt*8);
  else b.wingPhase+=dt*Math.PI*2*(3.8+galaxySeed(b.id,63)*1.5)*(b.mode==='flee'?1.25:1);
 }
 let anchor=b.rosePetal>=0?roseButterflyAnchor(b.rosePetal):b.frameIndex>=0?butterflyAnchor(corridorFrames[b.frameIndex],b.corner):null;
 if(reduce){
  b.mode='wander';b.frameIndex=-1;
  if(inner&&b.id<2&&corridorActiveIndex>=0){anchor=butterflyAnchor(corridorFrames[corridorActiveIndex],b.corner);if(anchor){b.mode='perched';b.frameIndex=corridorActiveIndex;b.x=anchor.x;b.y=anchor.y;b.angle=anchor.angle;}}
  else if(!inner&&stardustRose.active&&b.id<2&&(anchor=roseButterflyAnchor(b.id))){b.mode='perched';b.rosePetal=b.id;b.x=anchor.x;b.y=anchor.y;b.angle=anchor.angle;}
  else{b.mode='wander';b.x=w*(.08+.84*((b.id*.61803398875+.17)%1));b.y=h*(.3+galaxySeed(b.id,57)*.41);}
  b.alpha+=(butterflyPointerNear(b,70)?.1-b.alpha:.8-b.alpha)*Math.min(1,dt*4);return;
 }
 if(b.mode==='perched'){
  if(!anchor||b.timer<=0||butterflyPointerNear(b,mobile?75:100)){letButterflyFly(b,anchor);}
  else{b.x=anchor.x;b.y=anchor.y;b.angle=anchor.angle;b.vx=b.vy=0;b.alpha+=(anchor.alpha-b.alpha)*Math.min(1,dt*5);return;}
 }
 if(b.mode==='approach'){
  if(!anchor||b.timer<=0||butterflyPointerNear(b,65)){letButterflyFly(b,anchor);}
  else{b.targetX=anchor.x;b.targetY=anchor.y;if(Math.hypot(b.x-anchor.x,b.y-anchor.y)<16){b.mode='perched';b.timer=1.2+galaxySeed(b.id,world.clock)*1.2;b.x=anchor.x;b.y=anchor.y;return;}}
 }
 if(b.mode==='flee'&&b.timer<=0){b.mode='wander';b.timer=0;}
 if(inner&&b.canPerch&&b.mode==='wander'&&b.nextPerch<=0&&b.cooldown<=0){if(!chooseButterflyPerch(b))b.nextPerch=.7;}
 if(!inner&&stardustRose.active&&b.canPerch&&b.mode==='wander'&&b.nextPerch<=0&&b.cooldown<=0){if(!chooseRoseButterflyPerch(b))b.nextPerch=.7;}
 if(b.mode==='wander'&&(b.timer<=0||Math.hypot(b.targetX-b.x,b.targetY-b.y)<24))butterflyFreeTarget(b,inner);
 const dx=b.targetX-b.x,dy=b.targetY-b.y,d=Math.hypot(dx,dy)||1,speed=b.mode==='approach'?195:b.mode==='flee'?115:(32+galaxySeed(b.id,49)*17)*(.85+.15*Math.sin(world.clock*3+b.phase));
 let vx=dx/d*speed*Math.min(1,d/38),vy=dy/d*speed*Math.min(1,d/38);
 if(b.mode==='wander'){const drift=Math.sin(world.clock*2.3+b.phase)*11;vx+=-dy/d*drift;vy+=dx/d*drift;}
 if(world.pointer.active){const px=b.x-world.pointer.x,py=b.y-world.pointer.y,pd=Math.hypot(px,py)||1;if(pd<95){const push=(1-pd/95)*105;vx+=px/pd*push;vy+=py/pd*push;}}
 if(!inner){for(const word of reasonOrbitFrame){if(word.alpha<.25)continue;const ax=b.x-word.x,ay=b.y-word.y,rx=word.width/2+22,ry=word.height/2+22;if(Math.abs(ax)<rx&&Math.abs(ay)<ry){if(Math.abs(ax)/rx>Math.abs(ay)/ry)vx+=Math.sign(ax||1)*38;else vy+=Math.sign(ay||1)*38;}}}
 else if(b.mode==='wander'||b.mode==='flee'){
  for(const frame of corridorFrames){const p=frame.butterflyPose;if(!p||p.alpha<.55)continue;const ax=b.x-p.x,ay=b.y-p.y,rx=p.width*p.scale/2+18,ry=p.height*p.scale/2+18;if(Math.abs(ax)<rx&&Math.abs(ay)<ry){if(Math.abs(ax)/rx>Math.abs(ay)/ry)vx+=Math.sign(ax||b.corner)*48;else vy+=Math.sign(ay||-1)*48;}}
  if(heartJourney.pose.reveal>.1&&Math.abs(b.x-w/2)<w*.28&&Math.abs(b.y-h*.44)<h*.14)vy+=b.y<h*.44?-45:45;
 }
 if(b.mode==='wander'||b.mode==='flee')for(const other of (inner?world.inner:world.outer)){if(other===b)continue;const dx=b.x-other.x,dy=b.y-other.y,distance=Math.hypot(dx,dy)||1;if(distance<30){const push=(1-distance/30)*36;vx+=dx/distance*push;vy+=dy/distance*push;}}
 const response=1-Math.exp(-dt*(b.mode==='approach'?5:2.2));b.vx+=(vx-b.vx)*response;b.vy+=(vy-b.vy)*response;
 b.x+=b.vx*dt+Math.sin(world.clock*2+b.phase)*dt*3;b.y+=b.vy*dt+Math.cos(world.clock*1.6+b.phase)*dt*3;
 b.x=clamp(b.x,18,w-18);b.y=clamp(b.y,h*.17,h*.77);
 const angle=b.mode==='approach'&&anchor&&d<60?anchor.angle:Math.atan2(b.vy,b.vx)+Math.PI/2,turn=Math.atan2(Math.sin(angle-b.angle),Math.cos(angle-b.angle));b.angle+=turn*Math.min(1,dt*3);
 b.bank+=(clamp(turn*1.3,-.65,.65)-b.bank)*Math.min(1,dt*4);
 b.alpha+=(.96-b.alpha)*Math.min(1,dt*3);b.trailClock+=dt;if(b.trailClock>.11){b.trailClock=0;b.trail.unshift({x:b.x,y:b.y,born:world.clock,phase:galaxySeed(b.id,world.clock)*Math.PI*2});b.trail.length=Math.min(b.trail.length,7);}
}
function updateStarlightButterflies(dt){
 ensureButterflyFlocks();starlightButterflies.clock+=dt;const p=starlightButterflies.pointer;if(p.touch&&performance.now()>p.until)p.active=false;
 if(heartJourney.active){if(heartJourney.pose.inside>.1)for(const b of starlightButterflies.inner)advanceButterfly(b,dt,true);}
 else for(const b of starlightButterflies.outer)advanceButterfly(b,dt,false);
}
function paintStarlightButterflies(context,inner,opacity){
 if(!starlightButterflies.sprites.length||opacity<=.01)return;
 const flock=inner?starlightButterflies.inner:starlightButterflies.outer,clock=starlightButterflies.clock;context.save();
 for(const b of flock){
  
  const depth=b.visualDepth;
  let x=b.x,y=b.y,angle=b.angle,size=b.size*(.55+depth*.55),alpha=b.alpha*opacity*(.38+depth*.62);
  if(b.mode==='perched'){const anchor=b.rosePetal>=0?roseButterflyAnchor(b.rosePetal):butterflyAnchor(corridorFrames[b.frameIndex],b.corner);if(anchor){x=anchor.x;y=anchor.y;angle=anchor.angle;size*=clamp(anchor.scale,.65,1.2);}}
  if(!inner){for(const word of reasonOrbitFrame){if(word.alpha>.3&&Math.abs(x-word.x)<word.width*.45&&Math.abs(y-word.y)<word.height*.35){alpha*=.2;break;}}}
  if(inner&&b.mode!=='perched'){for(const frame of corridorFrames){const p=frame.butterflyPose;if(p&&p.alpha>.65&&Math.abs(x-p.x)<p.width*p.scale*.43&&Math.abs(y-p.y)<p.height*p.scale*.37){alpha*=.25;break;}}const name=heartJourney.nameBounds;if(heartJourney.pose.reveal>.2&&name&&((Math.abs(x-name.x)<name.width/2+size/2&&Math.abs(y-name.y)<name.height/2+size/2)||(Math.abs(x-w/2)<w*.42&&Math.abs(y-name.captionY-14)<24+size/2)))alpha*=.18;}
  context.globalCompositeOperation='lighter';
  if(!reduce&&b.mode!=='perched')for(const q of b.trail){const age=clock-q.born;if(age<0||age>.8)continue;const fade=1-age/.8,s=(1.4+depth*.9)*fade,px=q.x+Math.sin(q.phase)*age*5,py=q.y+Math.cos(q.phase)*age*4;context.globalAlpha=alpha*fade*.2;context.drawImage(sprites[b.tone?1:0],px-s/2,py-s/2,s,s);}
  context.globalAlpha=alpha*.075;context.drawImage(sprites[1],x-size*.52,y-size*.52,size*1.04,size*1.04);
  const phase=reduce?.45:b.mode==='perched'?.22+(Math.sin(clock*1.1+b.phase)+1)*.9:b.wingPhase,frame=((Math.round(phase/(Math.PI*2)*24)%24)+24)%24;
  context.save();context.globalCompositeOperation='source-over';context.translate(x,y+(reduce||b.mode==='perched'?0:Math.sin(b.wingPhase)*.65));context.rotate(angle);context.transform(1-Math.abs(b.bank)*.23,0,b.bank*.12,1,0,0);context.globalAlpha=alpha;context.drawImage(starlightButterflies.sprites[b.tone][frame],-size/2,-size/2,size,size);context.restore();
 }
 context.restore();
}
function rememberButterflyPointer(event){
 const p=starlightButterflies.pointer,r=canvas.getBoundingClientRect();p.x=event.clientX-r.left;p.y=event.clientY-r.top;p.touch=event.pointerType==='touch';p.active=true;p.until=performance.now()+1400;
}
window.addEventListener('pointermove',rememberButterflyPointer,{passive:true});window.addEventListener('pointerdown',rememberButterflyPointer,{passive:true});document.documentElement.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')starlightButterflies.pointer.active=false;});window.addEventListener('blur',()=>{starlightButterflies.pointer.active=false;});
