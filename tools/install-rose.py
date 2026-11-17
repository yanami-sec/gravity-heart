"""Synchronize the optional star-rose scene into the standalone local page."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
page = ROOT / 'dist/index.html'
s = page.read_text(encoding='utf-8')
module = (ROOT / 'tools/stardust-rose.js').read_text(encoding='utf-8')
marker = '// A continuous heart-to-rose scene. Geometry and star samples stay in the offline HTML.'
end_marker = '// End stardust rose scene.'
if marker in s:
    a = s.index(marker)
    b = s.index(end_marker, a) + len(end_marker)
    s = s[:a] + module.strip() + s[b:]
else:
    s = s.replace('// An optional camera journey.', module + '\n// An optional camera journey.', 1)
css = '/* Star-rose scene styles. */\n' + (ROOT / 'tools/stardust-rose.css').read_text(encoding='utf-8') + '\n/* End star-rose scene styles. */'
if '/* Star-rose scene styles. */' in s:
    a = s.index('/* Star-rose scene styles. */')
    b = s.index('/* End star-rose scene styles. */', a) + len('/* End star-rose scene styles. */')
    s = s[:a] + css + s[b:]
else:
    s = s.replace('</style>', css + '\n</style>', 1)
markup = (ROOT / 'tools/stardust-rose-markup.html').read_text(encoding='utf-8').strip()
if 'id="rose-view"' not in s:
    s = s.replace('</main>', '</main>\n' + markup, 1)
else:
    a = s.index('<section id="rose-view"')
    b = s.index('</section>', a) + len('</section>')
    s = s[:a] + markup + s[b:]
if 'id="bloom-rose"' not in s:
    old = '<span aria-hidden="true">↗</span></button></div><button class="hold"'
    new = '<span aria-hidden="true">↗</span></button><button class="rose-button" id="bloom-rose" type="button" aria-controls="rose-view" aria-expanded="false" disabled>让心意开花 <span aria-hidden="true">✧</span></button></div><button class="hold"'
    assert old in s
    s = s.replace(old, new, 1)
    # Integrate geometry into the existing particle heart rather than replacing the canvas.
    replacements = [
        ('const journey=updateHeartJourney(dt);ctx.clearRect', 'const rose=updateStardustRose(dt),journey=updateHeartJourney(dt);ctx.clearRect'),
        ("cy=(mobile?h*.59:h*.49)+((mobile?h*.47:h*.5)-(mobile?h*.59:h*.49))*progress;", "heartCy=(mobile?h*.59:h*.49)+((mobile?h*.47:h*.5)-(mobile?h*.59:h*.49))*progress,cy=heartCy+(h*.43-heartCy)*rose.amount;"),
        ('size=base*(1-hold*.8)*', 'size=base*(1-hold*.8)*(1-rose.amount*.16)*'),
        ('yaw=cameraYaw*(1-shape.amount)*(1-journey.focus),pitch=cameraPitch*(1-shape.amount)*(1-journey.focus);', 'yaw=cameraYaw*(1-shape.amount)*(1-journey.focus)*(1-rose.amount)+rose.amount*((reduce?0:Math.sin(rose.clock*.13)*.12)+motion.x*.22),pitch=cameraPitch*(1-shape.amount)*(1-journey.focus)*(1-rose.amount)+rose.amount*(.78+motion.y*.14);'),
        ("ctx.globalAlpha=(i%5===0?.17:.065)*(1-hold);", "ctx.globalAlpha=(i%5===0?.17:.065)*(1-hold)*(1-rose.amount);"),
        ('for(let pointIndex=0;pointIndex<points.length;pointIndex++){', 'paintStardustRose({cx,cy,size,yaw,pitch},rose);\nfor(let pointIndex=0;pointIndex<points.length;pointIndex++){'),
        ('home=morphPoint(p,pointIndex,shape),', 'home=roseMorphPoint(morphPoint(p,pointIndex,shape),p,pointIndex,rose),'),
        ('*(stream?stream.size:1);ctx.globalAlpha=p.alpha', '*(stream?stream.size:1)*(1-rose.amount*.3);ctx.globalAlpha=p.alpha'),
        ('*(stream?stream.alpha:1);ctx.drawImage', '*(stream?stream.alpha:1)*rosePointLight(pointIndex,rose);ctx.drawImage'),
        ("if(state!=='open'||root.dataset.journey||root.dataset.arrival", "if(state!=='open'||root.dataset.rose||root.dataset.journey||root.dataset.arrival"),
        ('function cleanExport(doc){', "function cleanExport(doc){delete doc.dataset.rose;doc.querySelector('#rose-view').hidden=true;doc.querySelector('#rose-view').style.removeProperty('--rose-caption');doc.querySelector('#rose-person').textContent='';doc.querySelector('#rose-stage').textContent='';doc.querySelector('#rose-replay').disabled=true;doc.querySelector('#rose-exit').textContent='← 回到爱心';doc.querySelector('#bloom-rose').disabled=true;doc.querySelector('#bloom-rose').setAttribute('aria-expanded','false');"),
        ("root.dataset.state='sealed';delete root.dataset.journey;", "root.dataset.state='sealed';delete root.dataset.journey;delete root.dataset.rose;$('rose-view').hidden=true;")
    ]
    for old, new in replacements:
        assert old in s, old
        s = s.replace(old, new, 1)
# Synchronize the two small integration guards without replacing unrelated modules.
galaxy_start = s.index('// Procedural assets stay inside the exported HTML and require no image downloads.')
galaxy_end = s.index('// Kept inline in the standalone HTML. These are editable example qualities.', galaxy_start)
s = s[:galaxy_start] + (ROOT / 'tools/galaxy.js').read_text(encoding='utf-8').strip() + '\n\n' + s[galaxy_end:]
s = s.replace('arrival=stardustArrival(now),yaw=', 'arrival=stardustArrival(now),heartLight=heartRadianceStrength(shape,rose,arrival),yaw=', 1)
s = s.replace('paintStardustRose({cx,cy,size,yaw,pitch},rose);', 'paintHeartRadiance({cx,cy,size,yaw,pitch},heartLight,burst);paintRoseStarTracks(false,{cx,cy,size,yaw,pitch},rose);paintStardustRose({cx,cy,size,yaw,pitch},rose);', 1) if 'paintRoseStarTracks(false,' not in s else s
s = s.replace('paintGalaxy(true,base,cx,cy,yaw,pitch,shape);paintReasonOrbit(true);', 'paintGalaxy(true,base,cx,cy,yaw,pitch,shape);paintRoseStarTracks(true,{cx,cy,size,yaw,pitch},rose);paintReasonOrbit(true);', 1) if 'paintRoseStarTracks(true,' not in s else s
s = s.replace('*(1-rose.amount*.3);ctx.globalAlpha=', '*(1-rose.amount*.1);ctx.globalAlpha=', 1)
s = s.replace('*(1-rose.amount*.1);ctx.globalAlpha=', '*(1-rose.amount*.1)*(1+heartLight*.2);ctx.globalAlpha=', 1)
s = s.replace('ctx.globalAlpha=p.alpha*(.62+(v.z+.7)*.22)', 'ctx.globalAlpha=Math.min(1,p.alpha*(.62+(v.z+.7)*.22)', 1)
s = s.replace('*rosePointLight(pointIndex,rose);ctx.drawImage', '*rosePointLight(pointIndex,rose)*(1+heartLight*.5));ctx.drawImage', 1)
s = s.replace('rose.amount*((reduce?0:Math.sin(rose.clock*.13)*.12)+motion.x*.22)', 'rose.amount*stardustRose.orbit.yaw', 1)
s = s.replace('rose.amount*(.78+motion.y*.14)', 'rose.amount*stardustRose.orbit.pitch', 1)
s = s.replace('(1-rose.amount*.16)*(1+(!reduce?', '(1-rose.amount*.16)*(1-rose.amount+rose.amount*roseOrbitScale())*(1+(!reduce?', 1)
s = s.replace('*(1-rose.amount*.3);ctx.globalAlpha=p.alpha', '*(1-rose.amount*.1);ctx.globalAlpha=p.alpha', 1)
s = s.replace("window.addEventListener('pointermove',e=>{if(document.querySelector('dialog[open]'))return;", "window.addEventListener('pointermove',e=>{if(stardustRose.active||document.querySelector('dialog[open]'))return;", 1)
s = s.replace('function cleanExport(doc){delete doc.dataset.rose;', "function cleanExport(doc){doc.querySelector('#rose-orbit').classList.remove('is-dragging');delete doc.dataset.rose;", 1)
s = s.replace('Math.pow(Math.max(0,Math.sin(time*5.5)),9)*.035:0', 'Math.pow(Math.max(0,Math.sin(time*5.5)),9)*.035*(1-rose.amount)+Math.sin(rose.clock*.85)*.006*rose.amount:0', 1)
s = s.replace('intensity=presence*clarity;', 'intensity=presence*clarity*(stardustRose.active?1-stardustRose.amount*.5:1);', 1)
s = s.replace("function journeyCanStart(){return state==='open'&&root.dataset.arrival", "function journeyCanStart(){return state==='open'&&!stardustRose.active&&root.dataset.arrival", 1)
s = s.replace("const active=state==='open'&&morphPhase==='heart'&&!root.dataset.ending;", "const active=state==='open'&&morphPhase==='heart'&&!root.dataset.ending&&!root.dataset.rose;", 1)
page.write_text(s, encoding='utf-8')
print('Rose scene synchronized:', page.stat().st_size, 'bytes')
