// Incoming stardust ribbons become the heart; no separate heart models appear.
let arrivalClock=0;
function stardustArrival(now){
 if(state!=='open')return {progress:0,age:0,active:true,forming:true};
 const duration=reduce?650:2900,age=(now-openedAt)/1000,progress=ease((now-openedAt)/duration);
 if(now-openedAt>=duration&&root.dataset.arrival==='forming'){
  root.dataset.arrival='ready';$('hold-heart').disabled=false;$('memory-orbit').hidden=false;
 }
 return {progress,age:reduce?age*(2900/650):age,active:now-openedAt<duration,forming:now-openedAt<duration};
}
function stardustPosition(p,index,arrival,cx,cy,base,targetX,targetY){
 const side=index%2===0?-1:1,clock=state==='open'?arrivalClock:time;
 const start=(p.phase/(Math.PI*2)+clock*.085)%1;
 const travel=state==='open'?ease((arrival.age-.1-(1-start)*.5)/(1.9+(1-start)*.3)):0,u=start+(1-start)*travel,a=1-u;
 const formation=state==='open'?ease((arrival.age-.1)/2.5):0;
 const nucleusX=cx+Math.sin(p.phase*3)*base*.055,nucleusY=cy+Math.cos(p.phase*4)*base*.045,endX=nucleusX+(targetX-nucleusX)*formation,endY=nucleusY+(targetY-nucleusY)*formation,originX=side<0?-w*.12:w*1.12,originY=side<0?h*.15:h*.85,c1X=cx+side*base*1.8,c1Y=cy+side*base*1.1,c2X=cx-side*base*.2,c2Y=cy+side*base*.4;
 const width=base*(.014+Math.sin(u*Math.PI)*.08)*(1-travel);
 return {x:a*a*a*originX+3*a*a*u*c1X+3*a*u*u*c2X+u*u*u*endX+p.dx*width,y:a*a*a*originY+3*a*a*u*c1Y+3*a*u*u*c2Y+u*u*u*endY+p.dy*width,size:.5+u*.5,alpha:.22+u*.78,color:formation>p.phase/(Math.PI*2)?p.color:side<0?0:3};
}
