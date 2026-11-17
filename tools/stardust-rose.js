// A continuous heart-to-rose scene. Geometry and star samples stay in the offline HTML.
const stardustRose={active:false,clock:0,returning:false,returnClock:0,from:0,amount:0,petals:[],targets:[],anchors:[],view:null,focusBefore:null,stage:'',variant:0,replayQueued:false,surface:null,bloom:null,surfaceKey:'',surfaceTime:-Infinity,orbit:{yaw:0,pitch:.78,targetYaw:0,targetPitch:.78,vx:0,vy:0,pointer:null,x:0,y:0,at:0,moved:0,idle:0,lastTap:-Infinity,tapX:0,tapY:0}};
function roseOrbitScale(){return Math.min(1,Math.cos(.78)/Math.max(.28,Math.cos(stardustRose.orbit.pitch)));}
function resetRoseOrbit(){
 const o=stardustRose.orbit;o.targetYaw=o.yaw+Math.atan2(Math.sin(-o.yaw),Math.cos(-o.yaw));o.targetPitch=.78;o.vx=o.vy=0;o.idle=0;
}
function cancelRoseDrag(){
 const surface=$('rose-orbit'),o=stardustRose.orbit,id=o.pointer;o.pointer=null;o.vx=o.vy=0;surface.classList.remove('is-dragging');
 if(id!==null)try{surface.releasePointerCapture(id);}catch{}
}
function advanceRoseOrbit(dt){
 const rose=stardustRose,o=rose.orbit;
 if(o.pointer===null){
  o.idle+=dt;
  if(!rose.returning){o.targetYaw+=o.vx*dt;o.targetPitch=clamp(o.targetPitch+o.vy*dt,.28,1.35);if(!reduce&&rose.stage==='open'&&o.idle>3)o.targetYaw+=dt*.055;}
  o.vx*=Math.exp(-dt*4.2);o.vy*=Math.exp(-dt*4.8);
 }
 const smooth=1-Math.exp(-dt*13);o.yaw+=(o.targetYaw-o.yaw)*smooth;o.pitch+=(o.targetPitch-o.pitch)*smooth;
}
function startRoseDrag(event){
 const rose=stardustRose,o=rose.orbit;if(!rose.active||rose.returning||o.pointer!==null||(event.button!==undefined&&event.button!==0))return;
 o.pointer=event.pointerId;o.x=event.clientX;o.y=event.clientY;o.at=performance.now();o.moved=0;o.vx=o.vy=0;o.idle=0;
 $('rose-orbit').classList.add('is-dragging');try{$('rose-orbit').setPointerCapture(event.pointerId);}catch{}event.preventDefault();
}
function moveRoseDrag(event){
 const o=stardustRose.orbit;if(o.pointer!==event.pointerId)return;
 const now=performance.now(),dt=Math.max(.008,(now-o.at)/1000),dx=event.clientX-o.x,dy=event.clientY-o.y,turn=dx/(Math.max(360,Math.min(w,900)))*Math.PI*2,tilt=-dy/Math.max(h,400)*Math.PI*.8;
 o.targetYaw+=turn;o.targetPitch=clamp(o.targetPitch+tilt,.28,1.35);o.vx=o.vx*.35+clamp(turn/dt,-2.8,2.8)*.65;o.vy=o.vy*.35+clamp(tilt/dt,-1.3,1.3)*.65;o.moved+=Math.hypot(dx,dy);o.x=event.clientX;o.y=event.clientY;o.at=now;o.idle=0;event.preventDefault();
}
function finishRoseDrag(event){
 const o=stardustRose.orbit;if(o.pointer!==event.pointerId)return;
 o.pointer=null;$('rose-orbit').classList.remove('is-dragging');try{$('rose-orbit').releasePointerCapture(event.pointerId);}catch{}
 if(event.type!=='pointerup'){o.vx=o.vy=0;return;}
 if(o.moved<5){
  o.vx=o.vy=0;const now=performance.now();if(now-o.lastTap<340&&Math.hypot(event.clientX-o.tapX,event.clientY-o.tapY)<28){resetRoseOrbit();o.lastTap=-Infinity;}else{o.lastTap=now;o.tapX=event.clientX;o.tapY=event.clientY;}
 }else if(reduce||performance.now()-o.at>90)o.vx=o.vy=0;
}
function rosePetalPosition(petal,u,v,opening){
 const width=.13+.87*Math.sin(v*Math.PI/2),theta=petal.angle+u*petal.span*width+v*petal.twist;
 const radial=.035+petal.radius*Math.pow(Math.sin(v*Math.PI/2),1.25)*(1-.13*u*u)-petal.radius*.08*Math.sin(v*Math.PI);
 const edge=Math.pow(v,6),y=petal.base+petal.height*Math.sin(v*Math.PI/2)-petal.droop*edge-.09*u*u*v*v+.035*Math.cos(u*5+petal.angle)*edge;
 const closedTheta=petal.angle+u*.2*width+v*.48,closedRadius=.025+(.13+petal.ring*.022)*Math.pow(v,.8);
 const x0=Math.cos(closedTheta)*closedRadius,z0=Math.sin(closedTheta)*closedRadius,y0=-.6+1.29*v-.03*u*u;
 return {x:x0+(Math.cos(theta)*radial-x0)*opening,y:y0+(y-y0)*opening,z:z0+(Math.sin(theta)*radial-z0)*opening};
}
function buildStardustRose(){
 const rose=stardustRose;rose.petals=[];rose.targets=[];rose.anchors=[];rose.surfaceKey='';rose.surfaceTime=-Infinity;
 const rings=[{count:3,radius:.11,height:1.08,base:-.32,droop:.02,span:1.28,twist:1.4,delay:.25},{count:5,radius:.25,height:1.13,base:-.37,droop:.03,span:1.05,twist:.92,delay:.75},{count:7,radius:.47,height:1.08,base:-.41,droop:.07,span:.81,twist:.65,delay:1.45},{count:8,radius:.71,height:1.04,base:-.48,droop:.1,span:.69,twist:.4,delay:2.2},{count:9,radius:.94,height:.96,base:-.55,droop:.15,span:.61,twist:.2,delay:3.1}];
 rings.forEach((ring,layer)=>{for(let j=0;j<ring.count;j++)rose.petals.push({...ring,ring:layer,outer:layer===rings.length-1,angle:j/ring.count*Math.PI*2+layer*.73+rose.variant*.09,id:rose.petals.length,open:0});});
 for(let i=0;i<points.length;i++){
  const seed=galaxySeed(i,80),kind=seed<.035?'stem':seed<.085?'leaf':'petal';
  if(kind==='petal'){
   const petal=rose.petals[Math.floor(galaxySeed(i,81)*rose.petals.length)],edge=galaxySeed(i,82)<.38;
   const u=galaxySeed(i,83)*2-1,v=edge?.94+galaxySeed(i,84)*.06:Math.pow(galaxySeed(i,84),.52),closed=rosePetalPosition(petal,u,v,0),open=rosePetalPosition(petal,u,v,1);
   rose.targets.push({kind,petal:petal.id,closed,open,edge,alpha:edge?1:.68});
  }else if(kind==='stem'){
   const t=galaxySeed(i,85),a=galaxySeed(i,86)*Math.PI*2,r=.008+galaxySeed(i,87)*.013;
   const p={x:Math.sin(t*3)*.065+Math.cos(a)*r,y:-.57-t*1.08,z:Math.sin(a)*r-.025};rose.targets.push({kind,closed:p,open:p,alpha:.72});
  }else{
   const side=i%2?-1:1,t=galaxySeed(i,85),across=galaxySeed(i,86)*2-1,p=roseLeafPosition(side,t,across);rose.targets.push({kind,closed:p,open:p,alpha:.6});
  }
 }
}
function roseLeafPosition(side,t,across){return{x:Math.sin(t*2)*.035+side*(.025+t*.46),y:(side<0?-1.14:-.92)+t*.25+Math.sin(t*Math.PI)*.035,z:-.025+across*Math.sin(t*Math.PI)*.14+Math.sin(t*Math.PI)*.07};}
function roseCanStart(){return state==='open'&&!heartJourney.active&&!stardustRose.active&&root.dataset.arrival!=='forming'&&morphPhase==='heart'&&!root.dataset.ending&&!holding&&!document.querySelector('dialog[open]');}
function startStardustRose(replay=false){
 const rose=stardustRose;if(!replay&&!roseCanStart())return;
 if(replay&&(!rose.active||rose.returning||rose.stage!=='open'))return;
 if(replay){returnStardustRose();rose.replayQueued=true;return;}
 if(!replay)rose.focusBefore=$('bloom-rose');
 rose.variant+=1;buildStardustRose();rose.active=true;rose.clock=0;rose.returning=false;rose.returnClock=0;rose.amount=0;rose.stage='';rose.view=null;
 cancelRoseDrag();Object.assign(rose.orbit,{yaw:0,pitch:.78,targetYaw:0,targetPitch:.78,idle:0,lastTap:-Infinity});
 holding=false;hold=0;burstAt=-Infinity;reasonHover=false;reasonHoverIndex=-1;motion.tx=motion.ty=0;
 root.dataset.rose='gather';document.querySelector('main').inert=true;$('rose-view').hidden=false;$('rose-person').textContent=`${gift.to}，这朵星河玫瑰送给你`;$('rose-replay').disabled=true;$('bloom-rose').setAttribute('aria-expanded','true');$('hold-heart').disabled=true;$('rose-exit').textContent='← 回到爱心';
 $('rose-exit').focus({preventScroll:true});syncJourneyButton();
}
function returnStardustRose(){
 const rose=stardustRose;rose.replayQueued=false;if(!rose.active||rose.returning)return;
 cancelRoseDrag();
 rose.returning=true;rose.returnClock=0;rose.from=rose.amount;root.dataset.rose='return';$('rose-replay').disabled=true;$('rose-exit').textContent='正在回到爱心…';
}
function finishStardustRose(){
 const rose=stardustRose;cancelRoseDrag();rose.active=false;rose.returning=false;rose.amount=0;rose.anchors=[];rose.view=null;delete root.dataset.rose;
 document.querySelector('main').inert=false;$('rose-view').hidden=true;$('rose-view').style.removeProperty('--rose-caption');$('bloom-rose').setAttribute('aria-expanded','false');$('bloom-rose').disabled=!roseCanStart();$('hold-heart').disabled=false;motion.tx=motion.ty=0;syncJourneyButton();
 const target=rose.focusBefore?.isConnected?rose.focusBefore:$('bloom-rose');target.focus({preventScroll:true});
 if(rose.replayQueued){rose.replayQueued=false;startStardustRose();}
}
function updateStardustRose(dt){
 const rose=stardustRose,disabled=!roseCanStart();if($('bloom-rose').disabled!==disabled)$('bloom-rose').disabled=disabled;
 if(!rose.active)return {active:false,amount:0,clock:0};
 advanceRoseOrbit(dt);
 if(rose.targets.length!==points.length)buildStardustRose();
 if(rose.returning){rose.returnClock+=dt;rose.amount=rose.from*(1-ease(rose.returnClock/(reduce?.65:1.8)));if(rose.amount<.001){finishStardustRose();return {active:false,amount:0,clock:0};}}
 else{
  rose.clock+=dt;rose.amount=ease(rose.clock/(reduce?.8:2));
  for(const petal of rose.petals)petal.open=reduce?1:ease((rose.clock-petal.delay)/2.7);
  const stage=rose.clock>=(reduce?1:6.2)?'open':rose.clock>1.8?'bloom':'gather';
  if(stage!==rose.stage){rose.stage=stage;root.dataset.rose=stage;$('rose-stage').textContent=stage==='open'?'愿你被温柔与偏爱，长久包围。':stage==='bloom'?'把心意，慢慢开成花。':'这一刻，星光只为你而来。';$('rose-replay').disabled=stage!=='open';}
 }
 const caption=(reduce?rose.amount:ease((rose.clock-4.5)/1.6)*rose.amount).toFixed(3);if(rose.caption!==caption){rose.caption=caption;$('rose-view').style.setProperty('--rose-caption',caption);}
 return {active:true,amount:rose.amount,clock:rose.clock};
}
function roseMorphPoint(home,p,i,pose){
 if(!pose.active||pose.amount<=0)return home;
 const target=stardustRose.targets[i],opening=target.kind==='petal'?stardustRose.petals[target.petal].open:1;
 const to={x:target.closed.x+(target.open.x-target.closed.x)*opening,y:target.closed.y+(target.open.y-target.closed.y)*opening,z:target.closed.z+(target.open.z-target.closed.z)*opening};
 if(reduce)return pose.amount<.5?home:to;
 const a=pose.amount,arc=Math.sin(a*Math.PI)*.14;return{x:home.x+(to.x-home.x)*a+Math.sin(p.phase)*arc,y:home.y+(to.y-home.y)*a,z:home.z+(to.z-home.z)*a+Math.cos(p.phase)*arc};
}
function rosePointLight(i,pose){
 if(!pose.active)return 1;
 const target=stardustRose.targets[i],opening=target.kind==='petal'?stardustRose.petals[target.petal].open:1,amount=pose.amount,fade=reduce?Math.abs(amount-.5)*2:1;
 return (1-amount+amount*target.alpha*(.3+.7*opening))*fade;
}
function roseProject(p,view){const v=project(p.x,p.y,p.z,view.yaw,view.pitch);return {x:view.cx+v.x*view.size*v.f,y:view.cy-v.y*view.size*v.f,z:v.z};}
const roseStarTracks=[{radius:1.24,height:.13,tilt:.28,roll:-.34,speed:.21,color:3},{radius:1.43,height:-.13,tilt:-.38,roll:.43,speed:-.16,color:1}];
function roseTrackPoint(track,angle,fit){
 const radius=track.radius*fit,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*Math.sin(track.tilt),z=Math.sin(angle)*radius*Math.cos(track.tilt);
 return {x:x*Math.cos(track.roll)-y*Math.sin(track.roll),y:track.height+x*Math.sin(track.roll)+y*Math.cos(track.roll),z};
}
function paintRoseStarTracks(front,view,pose){
 if(!pose.active)return;
 const strength=reduce?ease((pose.amount-.5)*2):pose.amount*ease((pose.clock-1.6)/3.2);if(strength<.005)return;
 const clock=reduce?0:pose.clock,fit=Math.min(1,w*.43/(view.size*1.7),h*.39/(view.size*1.7)),count=mobile?80:160,rgb=themes[palette].rgb;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 for(let ring=0;ring<roseStarTracks.length;ring++){
  const track=roseStarTracks[ring],middle=project(0,track.height,0,view.yaw,view.pitch).z,color=rgb[track.color];
  const onSide=p=>(p.z>=middle)===front;ctx.beginPath();let drawing=false;
  for(let i=0;i<=count;i++){
   const p=roseProject(roseTrackPoint(track,i/count*Math.PI*2,fit),view);
   if(!onSide(p)){drawing=false;continue;}if(!drawing){ctx.moveTo(p.x,p.y);drawing=true;}else ctx.lineTo(p.x,p.y);
  }
  ctx.globalAlpha=strength;ctx.strokeStyle=`rgba(${color},${front?.045:.018})`;ctx.lineWidth=3.2;ctx.stroke();ctx.strokeStyle=`rgba(${color},${front?.22:.075})`;ctx.lineWidth=.55;ctx.stroke();
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2+clock*track.speed,local=roseTrackPoint(track,a,fit);local.x+=(galaxySeed(i,ring+103)-.5)*.04*fit;local.y+=(galaxySeed(i,ring+104)-.5)*.035*fit;local.z+=(galaxySeed(i,ring+105)-.5)*.04*fit;const p=roseProject(local,view);if(!onSide(p))continue;
   const shine=.3+galaxySeed(i,ring+101)*.7,s=(2.2+galaxySeed(i,ring+102)*3.2)*(front?1:.8);ctx.globalAlpha=strength*shine*(front?.5:.22);ctx.drawImage(sprites[track.color],p.x-s/2,p.y-s/2,s,s);
  }
  // Short luminous tails travel around the same 3D ellipse as the quiet beads.
  for(let comet=0;comet<2;comet++){
   const head=clock*track.speed*(comet?1.13:1)+comet*Math.PI+ring*.7;
   for(let i=14;i>=0;i--){const a=head-i*.025*Math.sign(track.speed),p=roseProject(roseTrackPoint(track,a,fit),view);if(!onSide(p))continue;const fade=1-i/15,s=2+fade*2.2;ctx.globalAlpha=strength*fade*(front?.7:.28);ctx.drawImage(sprites[track.color],p.x-s/2,p.y-s/2,s,s);}
   const p=roseProject(roseTrackPoint(track,head,fit),view);if(onSide(p)){ctx.globalAlpha=strength*(front?.72:.3);const s=front?12:8;ctx.drawImage(sprites[1],p.x-s/2,p.y-s/2,s,s);ctx.strokeStyle=`rgba(${rgb[1]},.65)`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x-2.8,p.y);ctx.lineTo(p.x+2.8,p.y);ctx.moveTo(p.x,p.y-3.5);ctx.lineTo(p.x,p.y+3.5);ctx.stroke();}
  }
 }
 const hearts=mobile?3:5;
 for(let i=0;i<hearts;i++){
  const track=roseStarTracks[i%2],angle=i/hearts*Math.PI*2+clock*track.speed*.8,local=roseTrackPoint(track,angle,fit),p=roseProject(local,view),middle=project(0,track.height,0,view.yaw,view.pitch).z;if((p.z>=middle)!==front)continue;
  const size=(mobile?11:15)*(front?1:.8);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(angle)*.3);ctx.globalAlpha=strength*(front?.7:.3);ctx.drawImage(galaxyHearts[i%2],-size/2,-size/2,size,size);ctx.restore();
 }
 ctx.restore();
}
function paintStardustRose(view,pose){
 const rose=stardustRose;if(!pose.active||pose.amount<=0)return;rose.view=view;
 const amount=reduce?ease((pose.amount-.5)*2):pose.amount,rgb=themes[palette].rgb,leafAlpha=amount*(reduce?1:ease((pose.clock-2)/2));
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 // Two light leaves and a slender stem keep the silhouette recognizably a rose.
 ctx.beginPath();for(let k=0;k<=18;k++){const t=k/18,p=roseProject({x:Math.sin(t*3)*.065,y:-.57-t*1.08,z:-.025},view);if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle=`rgba(${rgb[3]},${leafAlpha*.06})`;ctx.lineWidth=2.6;ctx.stroke();ctx.strokeStyle=`rgba(${rgb[3]},${leafAlpha*.35})`;ctx.lineWidth=.9;ctx.stroke();
 for(const side of [-1,1]){
  ctx.beginPath();for(const across of [-1,1])for(let k=0;k<=14;k++){const t=across<0?k/14:1-k/14,p=roseProject(roseLeafPosition(side,t,across),view);if(across<0&&k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.closePath();ctx.fillStyle=`rgba(${rgb[2]},${leafAlpha*.055})`;ctx.fill();ctx.strokeStyle=`rgba(${rgb[1]},${leafAlpha*.2})`;ctx.lineWidth=.6;ctx.stroke();
 }
 paintRoseSilk(view,amount,pose);
 ctx.globalCompositeOperation='lighter';
 const centerLight=amount*(reduce?1:ease((pose.clock-1.1)/1.5)),center=roseProject({x:0,y:.7,z:0},view),halo=view.size*.42;
 ctx.globalAlpha=centerLight*.35;ctx.drawImage(sprites[0],center.x-halo/2,center.y-halo/2,halo,halo);ctx.globalAlpha=centerLight*.24;ctx.drawImage(sprites[1],center.x-halo*.18,center.y-halo*.18,halo*.36,halo*.36);ctx.beginPath();
 for(let i=0;i<100;i++){const t=i/99,a=t*Math.PI*5+rose.variant*.09,r=.012+t*.105,p=roseProject({x:Math.cos(a)*r,y:.78-t*.11,z:Math.sin(a)*r},view);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);if(i%3===0){ctx.globalAlpha=centerLight*.65;ctx.drawImage(sprites[1],p.x-1.4,p.y-1.4,2.8,2.8);}}
 ctx.globalAlpha=1;ctx.strokeStyle=`rgba(${rgb[1]},${centerLight*.52})`;ctx.lineWidth=.9;ctx.stroke();
 if(!reduce)for(let i=0;i<(mobile?45:95);i++){
  const phase=(pose.clock*(.04+galaxySeed(i,90)*.025)+galaxySeed(i,91))%1,a=galaxySeed(i,92)*Math.PI*2+pose.clock*.04,r=.3+galaxySeed(i,93)*.95,p=roseProject({x:Math.cos(a)*r,y:-.3+phase*1.7,z:Math.sin(a)*r*.6},view),fade=Math.sin(phase*Math.PI),s=2+galaxySeed(i,94)*3;
  ctx.globalAlpha=amount*fade*.36;ctx.drawImage(sprites[i%4],p.x-s/2,p.y-s/2,s,s);
 }
 ctx.restore();
 rose.anchors=rose.petals.filter(p=>p.outer).map(petal=>{const p=roseProject(rosePetalPosition(petal,petal.id%2?.22:-.22,1,petal.open),view);return{x:p.x,y:p.y,angle:Math.sin(petal.angle)*.25,scale:.82,alpha:amount,ready:petal.open>.94&&amount>.98&&!rose.returning};});
}
// Cache the translucent surfaces; stars and butterflies keep their full animation rate.
function paintRoseSilk(view,amount,pose){
 const rose=stardustRose,tick=reduce||pose.clock>=5.85?'full':Math.floor(pose.clock*24),key=`${palette}:${Math.round(view.yaw*250)}:${Math.round(view.pitch*250)}:${Math.round(view.size)}:${tick}`;
 if(!rose.surface)rose.surface=document.createElement('canvas');
 if(rose.surfaceKey!==key&&time-rose.surfaceTime>.028){
  const c=rose.surface,width=Math.ceil(view.size*2.9/16)*16,height=Math.ceil(view.size*2.4/16)*16;
  if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;
  const p=c.getContext('2d');p.clearRect(0,0,width,height);p.globalAlpha=1;p.globalCompositeOperation='source-over';
  drawRoseSilk(p,{...view,cx:width/2,cy:height*.55});rose.surfaceKey=key;rose.surfaceTime=time;
  if(!rose.bloom)rose.bloom=document.createElement('canvas');const b=rose.bloom;b.width=Math.ceil(width/2);b.height=Math.ceil(height/2);const glow=b.getContext('2d');glow.globalCompositeOperation='lighter';
  // Small cached blur taps work in WebKit without per-frame Canvas filters.
  const weights=[1,2,1];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){glow.globalAlpha=weights[x+1]*weights[y+1]*1.2/16;glow.drawImage(c,x*3,y*3,b.width,b.height);}
 }
 ctx.globalAlpha=amount;ctx.drawImage(rose.surface,view.cx-rose.surface.width/2,view.cy-rose.surface.height*.55);ctx.globalAlpha=1;
 if(rose.bloom){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=amount*.9;ctx.drawImage(rose.bloom,view.cx-rose.surface.width/2,view.cy-rose.surface.height*.55,rose.surface.width,rose.surface.height);ctx.restore();}
}
function drawRoseSilk(context,view){
 const ctx=context,amount=1,rgb=themes[palette].rgb;
 const petals=stardustRose.petals.map(petal=>({petal,depth:project(Math.cos(petal.angle)*petal.radius*.6,0,Math.sin(petal.angle)*petal.radius*.6,view.yaw,view.pitch).z})).sort((a,b)=>a.depth-b.depth);
 const acrossSteps=mobile?8:12;
 for(const {petal,depth} of petals){
  const glow=amount*(.35+.65*petal.open),light=.72+Math.sin(petal.angle+.7)*.16;
  ctx.beginPath();for(let j=0;j<=acrossSteps;j++){const p=roseProject(rosePetalPosition(petal,-1,j/acrossSteps,petal.open),view);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
  for(let j=1;j<=acrossSteps*2;j++){const p=roseProject(rosePetalPosition(petal,-1+j/acrossSteps,1,petal.open),view);ctx.lineTo(p.x,p.y);}
  for(let j=acrossSteps-1;j>=0;j--){const p=roseProject(rosePetalPosition(petal,1,j/acrossSteps,petal.open),view);ctx.lineTo(p.x,p.y);}ctx.closePath();
  const base=roseProject(rosePetalPosition(petal,0,0,petal.open),view),rim=roseProject(rosePetalPosition(petal,0,1,petal.open),view),silk=ctx.createLinearGradient(base.x,base.y,rim.x,rim.y);
  silk.addColorStop(0,`rgba(${rgb[2]},${glow*.025})`);silk.addColorStop(.65,`rgba(${rgb[0]},${glow*.09*light})`);silk.addColorStop(1,`rgba(${rgb[1]},${glow*.1*light})`);ctx.fillStyle=silk;ctx.fill();
  ctx.beginPath();for(let j=0;j<=acrossSteps*2;j++){const p=roseProject(rosePetalPosition(petal,-1+j/acrossSteps,1,petal.open),view);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
  ctx.strokeStyle=`rgba(${rgb[0]},${glow*.12})`;ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle=`rgba(${rgb[1]},${glow*(.48+Math.max(0,depth)*.08)})`;ctx.lineWidth=mobile?.9:1.1;ctx.stroke();
 }
}

function roseButterflyAnchor(index){const anchor=stardustRose.active?stardustRose.anchors[index]:null;return anchor?.ready?anchor:null;}
function chooseRoseButterflyPerch(b){
 const rose=stardustRose,flock=starlightButterflies.outer;if(!rose.active||rose.returning||rose.stage!=='open'||flock.filter(other=>other.rosePetal>=0).length>=(mobile?2:3))return false;
 let index=-1,distance=Infinity;
 for(let i=0;i<rose.anchors.length;i++){
  const anchor=roseButterflyAnchor(i);if(!anchor||flock.some(other=>other!==b&&other.rosePetal===i))continue;
  const p=starlightButterflies.pointer;if(p.active&&Math.hypot(anchor.x-p.x,anchor.y-p.y)<85)continue;
  const d=Math.hypot(anchor.x-b.x,anchor.y-b.y);if(d<distance){index=i;distance=d;}
 }
 if(index<0||distance>Math.max(320,w*.4))return false;
 b.rosePetal=index;b.frameIndex=-1;b.mode='approach';b.timer=3.2;return true;
}
$('bloom-rose').addEventListener('click',()=>startStardustRose());$('rose-exit').addEventListener('click',returnStardustRose);$('rose-replay').addEventListener('click',()=>startStardustRose(true));
const roseOrbitSurface=$('rose-orbit');roseOrbitSurface.addEventListener('pointerdown',startRoseDrag);roseOrbitSurface.addEventListener('pointermove',moveRoseDrag,{passive:false});for(const type of ['pointerup','pointercancel','lostpointercapture'])roseOrbitSurface.addEventListener(type,finishRoseDrag);
roseOrbitSurface.addEventListener('keydown',event=>{const o=stardustRose.orbit;if(!stardustRose.active||stardustRose.returning)return;if(event.key==='Home'){event.preventDefault();resetRoseOrbit();return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();o.vx=o.vy=0;o.idle=0;const step=event.shiftKey?.3:.15;if(event.key==='ArrowLeft')o.targetYaw-=step;if(event.key==='ArrowRight')o.targetYaw+=step;if(event.key==='ArrowUp')o.targetPitch=clamp(o.targetPitch+step,.28,1.35);if(event.key==='ArrowDown')o.targetPitch=clamp(o.targetPitch-step,.28,1.35);});
window.addEventListener('blur',cancelRoseDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelRoseDrag();});
document.addEventListener('keydown',event=>{if(!stardustRose.active)return;if(event.key==='Escape'){event.preventDefault();returnStardustRose();}else if(event.key==='Tab'){event.preventDefault();const controls=[$('rose-exit'),$('rose-orbit'),$('rose-replay')].filter(b=>!b.disabled),i=controls.indexOf(document.activeElement);controls[(i+(event.shiftKey?-1:1)+controls.length)%controls.length].focus({preventScroll:true});}});
// End stardust rose scene.
