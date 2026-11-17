// Procedural assets stay inside the exported HTML and require no image downloads.
const galaxyHearts=[],galaxyFrameCache=new Map(),galaxyDust=[];
let galaxyCloud=null;
function galaxySeed(i,k){const x=Math.sin((i+1)*127.1+k*311.7)*43758.5453;return x-Math.floor(x);}
function heartRadianceStrength(shape,rose,arrival){
 if(state!=='open')return 0;
 return (1-rose.amount)*(1-shape.amount)*ease((arrival.age-1.5)/1.4)*(root.dataset.ending?.5:1);
}
function paintHeartRadiance(view,light,burst){
 const strength=light*(1-hold*.65)*(1-clamp(burst/.8,0,1));if(strength<.005)return;
 const rgb=themes[palette].rgb;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength;
 ctx.beginPath();for(let i=0;i<=160;i++){
  const a=i/160*Math.PI*2,x=16*Math.pow(Math.sin(a),3)/18,y=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)+1.8)/18,p=project(x,y,0,view.yaw,view.pitch),px=view.cx+p.x*view.size*p.f,py=view.cy-p.y*view.size*p.f;
  if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
 }
 ctx.closePath();const mist=ctx.createRadialGradient(view.cx,view.cy,view.size*.05,view.cx,view.cy,view.size*1.1);
 mist.addColorStop(0,`rgba(${rgb[0]},.045)`);mist.addColorStop(.65,`rgba(${rgb[0]},.025)`);mist.addColorStop(1,`rgba(${rgb[0]},0)`);ctx.fillStyle=mist;ctx.fill();
 ctx.lineJoin='round';ctx.strokeStyle=`rgba(${rgb[0]},.025)`;ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle=`rgba(${rgb[0]},.065)`;ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=`rgba(${rgb[1]},.18)`;ctx.lineWidth=.9;ctx.stroke();ctx.restore();
}
function traceSmallHeart(c,x,y,scale){
 c.moveTo(x,y+scale*.86);
 c.bezierCurveTo(x-scale*.23,y+scale*.65,x-scale*.95,y+scale*.1,x-scale*.75,y-scale*.42);
 c.bezierCurveTo(x-scale*.57,y-scale*.98,x-scale*.12,y-scale*.83,x,y-scale*.45);
 c.bezierCurveTo(x+scale*.12,y-scale*.83,x+scale*.57,y-scale*.98,x+scale*.75,y-scale*.42);
 c.bezierCurveTo(x+scale*.95,y+scale*.1,x+scale*.23,y+scale*.65,x,y+scale*.86);
 c.closePath();
}
function buildGalaxyAssets(){
 galaxyHearts.length=0;galaxyFrameCache.clear();
 for(let style=0;style<2;style++){
  const c=document.createElement('canvas');c.width=c.height=80;const p=c.getContext('2d');
  p.beginPath();traceSmallHeart(p,40,38,24);p.shadowColor=themes[palette].accent;p.shadowBlur=10;
  const glow=p.createLinearGradient(20,12,58,62);glow.addColorStop(0,'#fff2f8');glow.addColorStop(.45,themes[palette].accent);glow.addColorStop(1,`rgb(${themes[palette].rgb[2]})`);
  p.strokeStyle=glow;p.lineWidth=style?2.3:1.2;if(style)p.stroke();else{p.fillStyle=glow;p.fill();}galaxyHearts.push(c);
 }
 galaxyCloud=document.createElement('canvas');galaxyCloud.width=galaxyCloud.height=768;const nebula=galaxyCloud.getContext('2d');nebula.globalCompositeOperation='lighter';
 for(let arm=0;arm<4;arm++)for(let j=0;j<17;j++){
  const r=.18+j/19,angle=arm*Math.PI/2+r*4.9,px=384+Math.cos(angle)*r*310,py=384+Math.sin(angle)*r*310,radius=35+r*32;
  const color=themes[palette].rgb[(arm+j)%themes[palette].rgb.length],fog=nebula.createRadialGradient(px,py,0,px,py,radius);
  fog.addColorStop(0,`rgba(${color},.075)`);fog.addColorStop(.42,`rgba(${color},.025)`);fog.addColorStop(1,`rgba(${color},0)`);
  nebula.fillStyle=fog;nebula.fillRect(px-radius,py-radius,radius*2,radius*2);
 }
 if(!galaxyDust.length)for(let i=0;i<720;i++){
  const r=.28+Math.pow(galaxySeed(i,0),.65)*1.12;
  galaxyDust.push({r,angle:(i%4)*Math.PI/2+r*4.9+(galaxySeed(i,1)-.5)*.46,scatter:(galaxySeed(i,2)-.5)*.24,size:.8+galaxySeed(i,3)*2.1,phase:galaxySeed(i,4)*Math.PI*2,color:i%4,heart:i%26===0});
 }
}
function paintGalaxy(front,base,cx,cy,yaw,pitch,shape){
 if(!galaxyCloud||!galaxyHearts.length)return;
 const presence=state==='sealed'?.22:ease((performance.now()-openedAt)/2200),clarity=(1-shape.amount*.94)*(root.dataset.ending?.52:1)*(1-hold*.6),intensity=presence*clarity*(stardustRose.active?1-stardustRose.amount*.5:1);
 if(intensity<.008)return;
 const rx=Math.min(base*1.55,w*.46),ry=Math.min(base*.83,h*.29),clock=reduce?0:time;
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(!front){
  ctx.save();ctx.translate(cx,cy+10);ctx.rotate(-.16+motion.x*.05);ctx.scale(rx/300,ry/330);ctx.rotate(clock*.025);ctx.globalAlpha=intensity*.8;ctx.drawImage(galaxyCloud,-384,-384);ctx.restore();
 }
 const count=mobile?360:galaxyDust.length;
 for(let i=0;i<count;i++){
  const d=galaxyDust[i],angle=d.angle+clock*.048,depth=Math.sin(angle),x=Math.cos(angle)*d.r,y=Math.sin(angle)*d.r,z=depth*.3+d.scatter;
  if((depth>=0)!==front)continue;
  const p=project(x,y*.62+d.scatter,z,yaw*.22,pitch*.28),px=cx+p.x*rx,py=cy+10+p.y*ry;
  const twinkle=.62+Math.sin(clock*1.3+d.phase)*.28,alpha=intensity*(front?.28:.16)*twinkle;
  if(d.heart){
   const size=(mobile?16:21)*(1+depth*.17);
   ctx.save();ctx.translate(px,py);ctx.rotate(Math.sin(clock*.32+d.phase)*.32);ctx.globalAlpha=intensity*(front?.72:.3);ctx.drawImage(galaxyHearts[i%2],-size/2,-size/2,size,size);ctx.restore();
  }else{
   const size=d.size*(front?2.2:1.5);ctx.globalAlpha=alpha;ctx.drawImage(sprites[d.color],px-size/2,py-size/2,size,size);
   if(i%23===0){ctx.globalAlpha=alpha*1.5;ctx.fillStyle='#ffe7f3';ctx.fillRect(px-.55,py-.55,1.1,1.1);}
  }
 }
 ctx.restore();
}
function reasonHeartPoint(angle,width,height){
 const x=16*Math.pow(Math.sin(angle),3),y=13*Math.cos(angle)-5*Math.cos(2*angle)-2*Math.cos(3*angle)-Math.cos(4*angle);
 return {x:x/16*width/2,y:-(y+2.5)/15*height/2};
}
function reasonHeartFrame(width,height){
 const key=`${palette}:${Math.round(width)}:${Math.round(height)}`;if(galaxyFrameCache.has(key))return galaxyFrameCache.get(key);
 const pad=18,c=document.createElement('canvas');c.width=Math.ceil((width+pad*2)*2);c.height=Math.ceil((height+pad*2)*2);
 const p=c.getContext('2d');p.scale(2,2);p.translate(width/2+pad,height/2+pad);
 const dots=mobile?34:44;
 for(let i=0;i<dots;i++){
  const a=i/dots*Math.PI*2,point=reasonHeartPoint(a,width,height);
  if(i%3===0){const size=mobile?6.5:7.5;p.globalAlpha=.85;p.save();p.translate(point.x,point.y);p.rotate(Math.sin(a)*.12);p.drawImage(galaxyHearts[0],-size/2,-size/2,size,size);p.restore();}
  else{p.globalAlpha=.5;p.fillStyle=themes[palette].accent;p.shadowColor=themes[palette].accent;p.shadowBlur=3;p.beginPath();p.arc(point.x,point.y,.6,0,Math.PI*2);p.fill();}
 }
 const frame={texture:c,width:width+pad*2,height:height+pad*2};galaxyFrameCache.set(key,frame);return frame;
}
