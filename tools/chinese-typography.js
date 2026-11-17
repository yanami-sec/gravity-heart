// Refresh sampled lettering after the embedded Chinese web font is ready.
const literaryFontReady=document.fonts?Promise.all([document.fonts.load('400 40px "Heart WenKai"','心意'),document.fonts.load('600 40px "Heart WenKai"','心意')]).then(()=>{
 rebuildTextShapes();heartJourney.cacheKey='';if(heartJourney.active)buildJourneyAssets();
 const nodes=[...reasonNodes];let index=0;
 const refresh=()=>{const started=performance.now();while(index<nodes.length){const item=nodes[index++];if(reasonNodes.includes(item))item.particles=makeReasonParticles(gift.reasons[item.index]);if(performance.now()-started>=4)break;}if(index<nodes.length)requestAnimationFrame(refresh);};
 refresh();
}).catch(()=>{}):Promise.resolve();
// End embedded Chinese typography.
