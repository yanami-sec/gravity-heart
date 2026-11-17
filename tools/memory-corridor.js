// The photos are embedded data URLs; the corridor works without a server or account.
const journeyPhotos=JSON.parse($('journey-gallery-data').textContent).filter(photo=>typeof photo.src==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(photo.src));
let corridorFrames=[],corridorLoaded=false,corridorActiveIndex=-1;
const journeyFront=$('journey-front'),journeyFrontContext=journeyFront.getContext('2d');
function resizeJourneyFront(){journeyFront.width=Math.round(w*dpr);journeyFront.height=Math.round(h*dpr);journeyFrontContext.setTransform(dpr,0,0,dpr,0,0);}
function clearJourneyFront(){journeyFrontContext.clearRect(0,0,w,h);}
const meteorRelay={flight:null,impacts:[],renderTime:0,fade:0,glows:[],flare:null,palette:''};
function corridorTiming(){const first=reduce?.22:.08,interval=reduce?1.62:1.72,flight=reduce?0:.58;return {first,interval,flight,final:first+journeyPhotos.length*interval+flight};}
function buildRelayGlows(){
 if(meteorRelay.palette===palette&&meteorRelay.glows.length)return;
 meteorRelay.palette=palette;meteorRelay.glows=[];
 for(const rgb of [[112,195,255],themes[palette].rgb[0],themes[palette].rgb[1],[255,248,253]]){
  const c=document.createElement('canvas');c.width=c.height=64;const p=c.getContext('2d'),g=p.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,`rgba(${rgb},1)`);g.addColorStop(.1,`rgba(${rgb},.94)`);g.addColorStop(.3,`rgba(${rgb},.3)`);g.addColorStop(1,`rgba(${rgb},0)`);p.fillStyle=g;p.fillRect(0,0,64,64);meteorRelay.glows.push(c);
 }
 const flare=document.createElement('canvas');flare.width=256;flare.height=128;const f=flare.getContext('2d');f.globalCompositeOperation='lighter';f.drawImage(meteorRelay.glows[0],68,4,120,120);f.drawImage(meteorRelay.glows[1],88,24,80,80);
 const beam=f.createLinearGradient(0,0,256,0);beam.addColorStop(0,'#b3cfff00');beam.addColorStop(.34,'#a7c5ff30');beam.addColorStop(.5,'#fff9ffff');beam.addColorStop(.66,'#f4bde930');beam.addColorStop(1,'#f4bde900');f.fillStyle=beam;f.shadowColor='#c6d9ff';f.shadowBlur=8;f.fillRect(0,62,256,4);f.shadowBlur=0;
 f.fillStyle='#fff7ff';f.beginPath();f.moveTo(128,38);f.lineTo(130,61);f.lineTo(145,64);f.lineTo(130,67);f.lineTo(128,90);f.lineTo(126,67);f.lineTo(109,64);f.lineTo(126,61);f.closePath();f.fill();meteorRelay.flare=flare;
}
function relayStation(index){
 if(index>=corridorFrames.length)return {x:w/2,y:h*.44,width:0,height:0,final:true};
 const frame=corridorFrames[index],key=`${w}:${h}:${mobile}`;if(frame.stationKey===key)return frame.station;
 const ratio=frame.photo.width/frame.photo.height,caption=mobile?54:56,padding=18;
 let width=Math.min(w*(mobile?.84:.42),mobile?420:560),height=(width-padding)/ratio+caption+padding;
 const maxHeight=Math.max(150,Math.min(h*(mobile?.47:.57),h-(mobile?104:100)-(mobile?116:112)-18));if(height>maxHeight){height=maxHeight;width=(height-caption-padding)*ratio+padding;}
 const positions=mobile?[[.48,.43],[.52,.55],[.47,.39],[.53,.53],[.48,.44],[.52,.56],[.47,.4],[.53,.54],[.48,.42],[.52,.55],[.49,.46]]:[[.29,.43],[.72,.49],[.45,.39],[.70,.56],[.29,.48],[.66,.39],[.34,.57],[.71,.45],[.39,.4],[.69,.54],[.33,.47]],position=positions[index%positions.length];
 const x=clamp(w*position[0],width/2+20,w-width/2-20),y=clamp(h*position[1],height/2+(mobile?104:100),h-height/2-(mobile?116:112));
 frame.stationKey=key;frame.station={x,y,width,height,final:false};return frame.station;
}
function relayPath(index){
 const to=relayStation(index),previous=index>0?relayStation(index-1):null,from=previous?{x:previous.x-Math.sign(to.x-previous.x||index%2-.5)*(previous.width/2-16),y:previous.y-Math.sign(to.y-previous.y||1)*(previous.height/2-16)}:{x:w*1.08,y:h*.1},dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
 const bend=(index%2?-1:1)*Math.min(mobile?145:240,Math.max(mobile?95:125,length*.32)),nx=-dy/length,ny=dx/length;
 return {from,to,c1:{x:from.x+dx*.28+nx*bend,y:from.y+dy*.28+ny*bend},c2:{x:to.x-dx*.22+nx*bend*.65,y:to.y-dy*.22+ny*bend*.65}};
}
function relayBezier(path,t){const u=1-t;return{x:u*u*u*path.from.x+3*u*u*t*path.c1.x+3*u*t*t*path.c2.x+t*t*t*path.to.x,y:u*u*u*path.from.y+3*u*u*t*path.c1.y+3*u*t*t*path.c2.y+t*t*t*path.to.y};}
function relayTravel(t){return 1-Math.pow(1-clamp(t,0,1),1.4);}
function prepareMemoryCorridor(){
 if(!corridorLoaded){
  const host=$('journey-gallery');host.replaceChildren();
  journeyPhotos.forEach((photo,index)=>{
   const figure=document.createElement('figure');figure.className='corridor-frame';figure.dataset.photo=photo.id;figure.hidden=true;
   const image=document.createElement('img');image.alt=photo.caption;image.width=photo.width;image.height=photo.height;image.decoding='async';image.draggable=false;image.addEventListener('load',()=>image.classList.add('is-ready'));
   const caption=document.createElement('figcaption');caption.textContent=photo.caption;figure.append(image,caption);host.append(figure);
   corridorFrames.push({figure,image,photo,index,loaded:false,station:null,stationKey:''});
  });corridorLoaded=true;
 }
 buildRelayGlows();meteorRelay.flight=null;meteorRelay.impacts=[];meteorRelay.fade=0;
 corridorActiveIndex=-1;for(const frame of corridorFrames){frame.figure.hidden=true;frame.figure.style.opacity='0';frame.butterflyPose=null;frame.stationKey='';if(frame.index<3&&!frame.loaded){frame.image.src=frame.photo.src;frame.loaded=true;}}
 $('journey-title').textContent='流星接力';$('journey-subtitle').textContent='星光落下，回忆亮起';$('journey-skip-name').textContent=gift.to;$('journey-memory-description').textContent='';$('journey-skip').hidden=!journeyPhotos.length;
 resizeJourneyFront();
}
function skipMemoryCorridor(){
 if(!heartJourney.active||heartJourney.returning||heartJourney.storyOffset)return;
 const timing=corridorTiming(),story=heartJourney.clock+heartJourney.storyOffset;
 if(story>=timing.final)return;heartJourney.paused=false;syncRelayPause();
 heartJourney.gallerySkip={clock:heartJourney.clock,story};heartJourney.storyOffset=Math.max(0,timing.final-heartJourney.clock);
 $('journey-skip').hidden=true;$('journey-exit').focus({preventScroll:true});
}
function paintMemoryCorridor(pose){
 const timing=corridorTiming(),story=heartJourney.clock+heartJourney.storyOffset,skip=heartJourney.gallerySkip,skipAge=skip?heartJourney.clock-skip.clock:0;
 const renderTime=skip?skip.story+skipAge:story,skipFade=skip?1-ease(skipAge/(reduce?.3:.4)):1;
 const final=story>=timing.final,inside=pose.inside,eligible=!heartJourney.returning&&!final;
 $('journey-skip').hidden=!eligible||!journeyPhotos.length||Boolean(skip);
 const step=final?'星光抵达的地方':'流星接力';if($('journey-title').textContent!==step)$('journey-title').textContent=step;
 const subtitle=heartJourney.paused?'这一刻，先停一停':final?'所有星光，都在奔向你':'星光落下，回忆亮起';if($('journey-subtitle').textContent!==subtitle)$('journey-subtitle').textContent=subtitle;
 meteorRelay.renderTime=renderTime;meteorRelay.fade=inside*skipFade*(heartJourney.returning?1-ease(heartJourney.returnClock/.75):1);meteorRelay.impacts=[];meteorRelay.flight=null;
 const flightIndex=Math.floor((renderTime-timing.first)/timing.interval);
 if(!reduce&&flightIndex>=0&&flightIndex<=corridorFrames.length){const local=renderTime-timing.first-flightIndex*timing.interval;if(local>=0&&local<timing.flight+.36)meteorRelay.flight={index:flightIndex,local,path:relayPath(flightIndex)};if(flightIndex===corridorFrames.length&&local>=timing.flight&&local<timing.flight+.68)meteorRelay.impacts.push({station:relayStation(flightIndex),age:local-timing.flight,index:flightIndex});}
 let best=-1,bestScore=-Infinity;
 for(const frame of corridorFrames){
  const {photo,index}=frame,launch=timing.first+index*timing.interval,local=renderTime-launch,age=local-timing.flight;
  if(!frame.loaded&&launch-renderTime<timing.interval*3){frame.image.src=photo.src;frame.loaded=true;}
  if(!reduce&&age>=0&&age<.68)meteorRelay.impacts.push({station:relayStation(index),age,index});
  const reveal=ease(age/(reduce?.2:.2)),exit=ease((local-(timing.interval-.18))/.24),alpha=reveal*(1-exit)*meteorRelay.fade;
  const visible=alpha>.012;
  frame.figure.hidden=!visible;if(!visible){frame.butterflyPose=null;continue;}
  const station=relayStation(index),side=index%2?-1:1,{width,height}=station,jolt=reduce?0:Math.sin(age*58)*Math.exp(-Math.max(0,age)*17)*(mobile?1.2:2.5),x=station.x+jolt,y=station.y+(reduce?0:12*(1-reveal)-exit*7+Math.sin(heartJourney.clock*.5+index)*1.7-jolt*.5),settle=reduce?0:Math.sin(clamp(age/.36,0,1)*Math.PI)*.025,scale=reduce?1:.86+reveal*.14+settle+exit*.02,depth=6+exit,yaw=reduce?0:side*7*(1-reveal),roll=reduce?0:side*.8*(1-reveal);
  frame.butterflyPose={x,y,width,height,scale,alpha,depth,yaw,roll};
  frame.figure.querySelector('figcaption').style.opacity=String(ease((age-.06)/.15));frame.figure.style.width=`${width}px`;frame.figure.style.height=`${height}px`;frame.figure.style.opacity=String(alpha);frame.figure.style.zIndex=String(100+index);frame.figure.style.clipPath=reduce?'none':`circle(${(reveal*112).toFixed(1)}% at 50% 48%)`;frame.figure.style.setProperty('--relay-hit',String(Math.max(0,1-age/.55)));
  frame.figure.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) perspective(1000px) rotateY(${yaw}deg) rotateZ(${roll}deg) scale(${scale})`;
  if(alpha>bestScore){bestScore=alpha;best=index;}
 }
 if(best!==corridorActiveIndex){corridorActiveIndex=best;$('journey-memory-description').textContent=best>=0?journeyPhotos[best].caption:'';}
}
function hideMemoryCorridor(){for(const frame of corridorFrames){frame.figure.hidden=true;frame.butterflyPose=null;frame.image.removeAttribute('src');frame.image.classList.remove('is-ready');frame.loaded=false;}meteorRelay.flight=null;meteorRelay.impacts=[];meteorRelay.fade=0;$('journey-skip').hidden=true;clearJourneyFront();}
function paintMeteorBackdrop(){
 if(reduce||meteorRelay.fade<=.005)return;
 const p=ctx,strength=meteorRelay.fade,flight=meteorRelay.flight,timing=corridorTiming(),glows=meteorRelay.glows;p.save();p.globalCompositeOperation='lighter';p.lineCap='round';
 if(flight&&flight.local<timing.flight){
  const u=relayTravel(flight.local/timing.flight),head=relayBezier(flight.path,u),previous=relayBezier(flight.path,Math.max(0,u-.02)),angle=Math.atan2(head.y-previous.y,head.x-previous.x),dx=Math.cos(angle),dy=Math.sin(angle),surge=Math.sin(clamp(flight.local/timing.flight,0,1)*Math.PI);
  for(let i=0;i<(mobile?18:34);i++){const phase=(meteorRelay.renderTime*(1.1+galaxySeed(i,130))+galaxySeed(i,131))%1,x=galaxySeed(i,132)*w+dx*(phase-.5)*w*.4,y=galaxySeed(i,133)*h+dy*(phase-.5)*h*.3,length=(mobile?16:28)+galaxySeed(i,134)*(mobile?65:120);p.globalAlpha=strength*surge*(.045+galaxySeed(i,135)*.09);p.strokeStyle=`rgb(${i%2?[150,201,255]:themes[palette].rgb[1]})`;p.lineWidth=.5+galaxySeed(i,136)*.8;p.beginPath();p.moveTo(x,y);p.lineTo(x-dx*length,y-dy*length);p.stroke();}
 }
 for(const impact of meteorRelay.impacts){
  const {station,age,index}=impact,life=clamp(age/.65,0,1),fade=Math.pow(1-life,1.5),reach=Math.max(mobile?150:250,station.width*.73),radius=15+Math.pow(life,.67)*reach*.65,halo=Math.max(mobile?235:360,station.width*1.35);
  p.globalAlpha=strength*fade*.5;p.drawImage(glows[index%2?0:1],station.x-halo/2,station.y-halo/2,halo,halo);p.globalAlpha=strength*fade*.18;p.drawImage(glows[0],station.x-halo*.83,station.y-halo*.83,halo*1.66,halo*1.66);
  for(let ring=0;ring<2;ring++){const t=clamp((age-ring*.075)/.58,0,1);if(t<=0||t>=1)continue;const base=station.width?station.width*(ring?.49:.52):12,r=base+Math.pow(t,.7)*reach*(ring?.48:.7),aspect=station.width?clamp(station.height/station.width,.45,.9):.7,a=strength*Math.pow(1-t,1.3);p.globalAlpha=a;p.beginPath();p.ellipse(station.x,station.y,r,r*aspect,ring?-.12:.12,0,Math.PI*2);p.strokeStyle=ring?`rgba(${themes[palette].rgb[0]},.13)`:'rgba(136,198,255,.15)';p.lineWidth=mobile?8:12;p.stroke();p.strokeStyle=ring?`rgba(${themes[palette].rgb[1]},.65)`:'rgba(180,226,255,.7)';p.lineWidth=mobile?1:1.6;p.stroke();}
  for(let i=0;i<(mobile?28:48);i++){const angle=i/(mobile?28:48)*Math.PI*2+galaxySeed(i,index+141)*.18,dx=Math.cos(angle),dy=Math.sin(angle),edge=station.width?Math.min((station.width/2+8)/Math.max(.001,Math.abs(dx)),(station.height/2+8)/Math.max(.001,Math.abs(dy))):0,r=edge+radius*(.65+galaxySeed(i,index+142)*.5),length=(12+galaxySeed(i,index+143)*(mobile?35:65))*(.4+life),x=station.x+dx*r,y=station.y+dy*r;p.globalAlpha=strength*fade*(.24+galaxySeed(i,index+144)*.5);p.strokeStyle=i%3?'#c8ddff':`rgb(${themes[palette].rgb[1]})`;p.lineWidth=.6+galaxySeed(i,index+145)*1.2;p.beginPath();p.moveTo(x-dx*length,y-dy*length);p.lineTo(x,y);p.stroke();const size=2+galaxySeed(i,index+146)*5;p.drawImage(glows[i%3],x-size/2,y-size/2,size,size);}
  const span=Math.min(w*1.05,Math.max(mobile?380:700,station.width*2));p.globalAlpha=strength*Math.pow(1-clamp(age/.33,0,1),2)*.55;p.drawImage(meteorRelay.flare,station.x-span/2,station.y-span/4,span,span/2);
 }
 p.restore();
}
function paintRelayRibbon(p,trail,width,rgb,opacity,clock){
 if(trail.length<2)return;p.beginPath();
 for(const side of [1,-1])for(let step=0;step<trail.length;step++){
  const i=side>0?step:trail.length-1-step,point=trail[i],before=trail[Math.max(0,i-1)],after=trail[Math.min(trail.length-1,i+1)],angle=Math.atan2(after.y-before.y,after.x-before.x),q=point.light,r=width*.5*Math.pow(q,1.4)*(1+Math.sin(q*19-clock*22)*.08),x=point.x-Math.sin(angle)*r*side,y=point.y+Math.cos(angle)*r*side;
  if(side>0&&step===0)p.moveTo(x,y);else p.lineTo(x,y);
 }
 p.closePath();const first=trail[0],last=trail[trail.length-1],g=p.createLinearGradient(first.x,first.y,last.x,last.y);g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(.35,`rgba(${rgb},${opacity*.17})`);g.addColorStop(.8,`rgba(${rgb},${opacity*.65})`);g.addColorStop(1,`rgba(${rgb},${opacity})`);p.fillStyle=g;p.fill();
}
function paintMeteorRelay(){
 if(reduce||meteorRelay.fade<=.005)return;
 const p=journeyFrontContext,strength=meteorRelay.fade,timing=corridorTiming(),glows=meteorRelay.glows,flight=meteorRelay.flight;p.save();p.globalCompositeOperation='lighter';p.lineCap='round';p.lineJoin='round';
 if(flight){
  const burn=1-ease((flight.local-timing.flight)/.28),trail=[],samples=mobile?32:42;
  for(let i=samples;i>=0;i--){const past=flight.local-i*(.42/samples);if(past<0)continue;const u=relayTravel(past/timing.flight),point=relayBezier(flight.path,u),q=1-i/(samples+1),last=trail[trail.length-1];if(last&&Math.hypot(last.x-point.x,last.y-point.y)<.1)last.light=q;else trail.push({...point,light:q});}
  for(let i=0;i<trail.length;i+=2){const b=trail[i],q=b.light,angle=Math.atan2(b.y-trail[Math.max(0,i-1)].y,b.x-trail[Math.max(0,i-1)].x),wave=Math.sin(q*17-flight.local*23)*(1-q)*(mobile?8:13),size=(mobile?17:26)+Math.pow(q,1.3)*(mobile?36:56);p.globalAlpha=strength*burn*Math.pow(q,1.3)*.13;p.drawImage(glows[(i/2)%2],b.x-Math.sin(angle)*wave-size/2,b.y+Math.cos(angle)*wave-size/2,size,size);}
  p.globalAlpha=strength*burn;paintRelayRibbon(p,trail,mobile?29:48,[116,183,255],.24,flight.local);paintRelayRibbon(p,trail,mobile?14:25,[142,188,255],.55,flight.local);paintRelayRibbon(p,trail,mobile?6:10,themes[palette].rgb[0],.85,flight.local);paintRelayRibbon(p,trail,mobile?1.9:2.8,[255,241,251],.98,flight.local);
  for(const side of [-1,1]){
   p.beginPath();for(let i=0;i<trail.length;i++){const q=trail[i],previous=trail[Math.max(0,i-1)],angle=Math.atan2(q.y-previous.y,q.x-previous.x),offset=side*Math.sin(q.light*12-flight.local*14)*(1-q.light)*(mobile?4:7),x=q.x-Math.sin(angle)*offset,y=q.y+Math.cos(angle)*offset;if(i===0)p.moveTo(x,y);else p.lineTo(x,y);}
   const first=trail[0],last=trail[trail.length-1],rgb=side<0?[137,216,255]:themes[palette].rgb[0],gradient=p.createLinearGradient(first.x,first.y,last.x,last.y);gradient.addColorStop(0,`rgba(${rgb},0)`);gradient.addColorStop(.5,`rgba(${rgb},.25)`);gradient.addColorStop(1,`rgba(${rgb},.6)`);p.globalAlpha=strength*burn;p.lineWidth=.55;p.strokeStyle=gradient;p.stroke();
  }
  for(let i=0;i<(mobile?72:126);i++){
   const lag=galaxySeed(i,111)*.4,past=flight.local-lag;if(past<0)continue;const u=relayTravel(past/timing.flight),point=relayBezier(flight.path,u),previous=relayBezier(flight.path,Math.max(0,u-.01)),angle=Math.atan2(point.y-previous.y,point.x-previous.x),scatter=(galaxySeed(i,112)-.5)*(9+lag*(mobile?130:210));
   const x=point.x-Math.sin(angle)*scatter,y=point.y+Math.cos(angle)*scatter,s=1.8+galaxySeed(i,113)*4.5;p.globalAlpha=strength*burn*(1-lag/.44)*(.45+galaxySeed(i,114)*.5);p.drawImage(glows[i%3],x-s/2,y-s/2,s,s);if(i%11===0){const length=5+galaxySeed(i,150)*14;p.strokeStyle=i%2?'#c9e5ff':'#ffe5fb';p.lineWidth=.65;p.beginPath();p.moveTo(x,y);p.lineTo(x-Math.cos(angle)*length,y-Math.sin(angle)*length);p.stroke();}
  }
  for(let i=0;i<(mobile?3:5);i++){const lag=.055+i*.037,past=flight.local-lag;if(past<0)continue;const u=relayTravel(past/timing.flight),point=relayBezier(flight.path,u),previous=relayBezier(flight.path,Math.max(0,u-.12)),angle=Math.atan2(point.y-previous.y,point.x-previous.x),offset=(i%2?-1:1)*(16+i*(mobile?8:12)),nx=-Math.sin(angle)*offset,ny=Math.cos(angle)*offset;p.globalAlpha=strength*burn*.5;p.strokeStyle=i%2?`rgb(${themes[palette].rgb[0]})`:'#94d3ff';p.lineWidth=.8;p.beginPath();p.moveTo(previous.x+nx,previous.y+ny);p.lineTo(point.x+nx,point.y+ny);p.stroke();p.drawImage(glows[i%3],point.x+nx-5,point.y+ny-5,10,10);}
  const u=relayTravel(flight.local/timing.flight),head=relayBezier(flight.path,u),before=relayBezier(flight.path,Math.max(0,u-.01)),angle=Math.atan2(head.y-before.y,head.x-before.x),halo=mobile?64:104;
  p.globalAlpha=strength*burn*.82;p.drawImage(glows[0],head.x-halo*.65,head.y-halo*.65,halo*1.3,halo*1.3);p.drawImage(glows[1],head.x-halo*.45,head.y-halo*.45,halo*.9,halo*.9);
  p.save();p.translate(head.x,head.y);p.rotate(angle);const size=mobile?135:210;p.globalAlpha=strength*burn*.75;p.drawImage(meteorRelay.flare,-size/2,-size/4,size,size/2);p.globalAlpha=strength*burn;p.fillStyle='#fffaff';p.beginPath();p.ellipse(0,0,mobile?7:10,mobile?2.7:3.8,0,0,Math.PI*2);p.fill();p.restore();
 }
 for(const impact of meteorRelay.impacts){
  const {station,age,index}=impact,fade=1-ease(age/.6),radius=12+ease(age/.6)*Math.max(mobile?120:190,station.width*.49),halo=(mobile?95:160)*(1+age*.6);p.globalAlpha=strength*Math.pow(1-clamp(age/.24,0,1),2)*.65;p.drawImage(glows[index%2?0:1],station.x-halo/2,station.y-halo/2,halo,halo);
  for(let i=0;i<(mobile?28:46);i++){const angle=i/(mobile?28:46)*Math.PI*2+galaxySeed(i,index+117)*.25,r=radius*(.55+galaxySeed(i,index+118)*.55),x=station.x+Math.cos(angle)*r,y=station.y+Math.sin(angle)*r,s=2.4+galaxySeed(i,index+119)*4.5,overPhoto=station.width&&age>.14&&Math.abs(x-station.x)<station.width*.48&&Math.abs(y-station.y)<station.height*.46;p.globalAlpha=strength*fade*(overPhoto?.13:.8);p.drawImage(glows[i%3],x-s/2,y-s/2,s,s);}
 }
 p.restore();
}
function paintJourneyForeground(blend,clock,travel,focal,cx,cy){
 clearJourneyFront();if(blend<=0)return;
 const p=journeyFrontContext,count=mobile?430:innerStars.length;p.save();p.globalCompositeOperation='lighter';
 for(let i=0;i<count;i++){
  const star=innerStars[i],z=1+((star.z-travel*star.speed)%18+18)%18;if(z>=3.4)continue;
  const depth=focal/z,x=cx+(star.x+motion.x*.18)*depth,y=cy+(star.y+motion.y*.12)*depth;if(x< -30||x>w+30||y< -30||y>h+30)continue;
  const alpha=blend*Math.min(1,(z-1)*1.5)*(.3+.3*(1-z/19)),size=clamp(star.size*(1+3.3/z),2,10);p.globalAlpha=alpha;
  if(!reduce){const prev=focal/(z+.025),dx=(star.x+motion.x*.18)*prev-(x-cx),dy=(star.y+motion.y*.12)*prev-(y-cy),length=Math.hypot(dx,dy),s=length>13?13/length:1;p.strokeStyle=`rgba(${themes[palette].rgb[star.color]},.5)`;p.lineWidth=Math.max(.6,size*.25);p.beginPath();p.moveTo(x,y);p.lineTo(x+dx*s,y+dy*s);p.stroke();}
  p.drawImage(sprites[star.color],x-size/2,y-size/2,size,size);
 }
 p.restore();paintStarlightButterflies(journeyFrontContext,true,blend*.62);paintMeteorRelay();
}
$('journey-skip').addEventListener('click',skipMemoryCorridor);
function openGalleryCaptionEditor(){$('gallery-caption-editor').open=false;$('gallery-caption-list').replaceChildren();}
function buildGalleryCaptionEditor(){
 if($('gallery-caption-list').children.length)return;
 journeyPhotos.forEach((photo,index)=>{
  const row=document.createElement('label');row.className='gallery-edit-row';
  const image=document.createElement('img');image.src=photo.src;image.alt='';image.loading='lazy';
  const input=document.createElement('input');input.type='text';input.maxLength=80;input.value=photo.caption;input.setAttribute('aria-label',`第 ${index+1} 张图片的配文`);row.append(image,input);$('gallery-caption-list').append(row);
 });
}
function saveGalleryCaptionEditor(){
 [...$('gallery-caption-list').children].forEach((row,index)=>{journeyPhotos[index].caption=row.querySelector('input').value.trim().slice(0,80);});
 for(const frame of corridorFrames){frame.figure.querySelector('figcaption').textContent=frame.photo.caption;frame.image.alt=frame.photo.caption;}
}
$('gallery-caption-editor').addEventListener('toggle',()=>{if($('gallery-caption-editor').open)buildGalleryCaptionEditor();});
