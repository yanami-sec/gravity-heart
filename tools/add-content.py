from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
p=root/'dist/index.html'
s=p.read_text(encoding='utf-8')
if 'id="memory-orbit"' in s:
    raise SystemExit('Content is already installed; edit dist/index.html directly.')

def replace(old,new):
    global s
    if old not in s:
        raise RuntimeError('Source changed near: '+old[:80])
    s=s.replace(old,new,1)

replace('</style>',(root/'tools/content.css').read_text(encoding='utf-8')+'\n</style>')
replace('<footer class="bottom">',(root/'tools/content-markup.html').read_text(encoding='utf-8')+'\n<footer class="bottom">')
replace('<dialog class="editor"', (root/'tools/content-dialogs.html').read_text(encoding='utf-8')+'\n<dialog class="editor"')
replace('<div class="editor-actions">','''<section class="memory-editor"><h3>藏在星星里的心动碎片</h3><p class="editor-tip">下面先放了三段示例心事。可以换成你们的小事，也可以加自己的照片。</p><div id="memory-editor-list"></div><button id="add-memory" class="add-memory" type="button">再加一颗星星 ＋（最多五颗）</button></section><label for="closing-input">读完信后，最后想说的一句</label><textarea id="closing-input" maxlength="80"></textarea><div class="editor-actions">''')
replace('<button class="paper-button replay" id="replay-heart">再看一次心动 ↗</button>', '<button class="paper-button replay" id="replay-heart">再看一次心动 ↗</button><button class="paper-button finish" id="finish-letter">读完了，把这份心意收好 ↗</button>')
replace("if(!points.length||wasMobile!==mobile)makePoints();", "if(!points.length||wasMobile!==mobile){makePoints();rebuildTextShapes();}")
replace("ctx.globalCompositeOperation='source-over';for(const s of stars)","const shape=morphState(now);ctx.globalCompositeOperation='source-over';for(const s of stars)")
replace('for(const p of points){const drift=', 'for(let pointIndex=0;pointIndex<points.length;pointIndex++){const p=points[pointIndex],home=morphPoint(p,pointIndex,shape),drift=')
replace('project(p.x+(p.dx*burst+', 'project(home.x+(p.dx*burst*(1-shape.amount)+')
replace('p.y+p.dy*burst+drift,p.z+p.dz*burst+', 'home.y+p.dy*burst*(1-shape.amount)+drift,home.z+p.dz*burst*(1-shape.amount)+')
replace("frame=requestAnimationFrame(draw);}", "drawEnding(now,cx,cy);frame=requestAnimationFrame(draw);}")
replace("state='open';openedAt=performance.now();", "state='open';$('memory-orbit').hidden=false;openedAt=performance.now();")
replace("if(state!=='open'||$('letter-dialog').open||$('editor').open)return;", "if(state!=='open'||document.querySelector('dialog[open]')||root.dataset.ending||morphPhase!=='heart')return;")
replace("$('hold-label').textContent='按住压缩 · 松手释放星光';if(soundOn)chime();", "$('hold-label').textContent='按住压缩 · 松手释放星光';releaseName();if(soundOn)chime();")
replace("el.addEventListener('pointercancel',()=>{holding=false});", "el.addEventListener('pointercancel',endHold);el.addEventListener('contextmenu',e=>e.preventDefault());")
replace("setPalette(gift.palette||'rose');}", "gift.memories=normalizeMemories(gift.memories);gift.closing=String(gift.closing||'往后的风景，我想和你一起看。').trim().slice(0,80);setPalette(gift.palette||'rose');renderMemories();rebuildTextShapes();}")
replace('function showLetter(){openHeart();', 'function showLetter(){openHeart();resetEnding();')
replace("burstPower=.8;});", "burstPower=.8;releaseName();});")
replace("$('editor-error').textContent='';$('editor').showModal()", "$('editor-error').textContent='';openContentEditor();$('editor').showModal()")
replace("function readEditor(){const message=", "function readEditor(){if(photoJobs){$('editor-error').textContent='照片还在整理中，请稍等一下。';return false;}const message=")
replace("gift={to:$('to-input').value.trim()", "gift={...gift,memories:readMemoryEditor(),closing:$('closing-input').value.trim(),to:$('to-input').value.trim()")
replace("doc.querySelector('.heart-actions').setAttribute('inert','');", "doc.querySelector('.heart-actions').setAttribute('inert','');cleanExport(doc);")
fragment=(root/'tools/content-fragment.js').read_text(encoding='utf-8')
cleanup='''
function cleanExport(doc){delete doc.dataset.ending;doc.dataset.morph='heart';doc.classList.remove('morphing');doc.querySelector('#ending-panel').hidden=true;doc.querySelector('#closing-words').textContent='';doc.querySelectorAll('.letter-echo').forEach(e=>e.remove());doc.querySelector('#memory-editor-list').replaceChildren();doc.querySelector('#memory-orbit').replaceChildren();doc.querySelector('#memory-orbit').hidden=true;doc.querySelector('#memory-orbit').inert=false;for(const id of ['memory-photo','reply-preview']){const image=doc.querySelector('#'+id);image.removeAttribute('src');image.hidden=true;}doc.querySelector('#reply-message').textContent='';doc.querySelector('#reply-name').removeAttribute('value');doc.querySelector('#reply-result').textContent='';doc.querySelector('#reply-error').textContent='';doc.querySelector('#hold-heart').disabled=false;doc.querySelector('#hold-heart').classList.remove('pressed');doc.querySelector('#hold-label').textContent='按住压缩 · 松手释放星光';doc.querySelector('.scene-title').setAttribute('aria-hidden','true');}
'''
replace("root.dataset.state='sealed';applyGift();resize();start();", fragment+cleanup+"\nroot.dataset.state='sealed';root.dataset.morph='heart';delete root.dataset.ending;$('ending-panel').hidden=true;$('memory-orbit').hidden=true;applyGift();resize();start();")
p.write_text(s,encoding='utf-8')
print('Added particle names, memory stars, ending and reply to the local page.')
