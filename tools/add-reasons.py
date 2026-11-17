from pathlib import Path

root = Path(__file__).resolve().parent.parent
page = root / 'dist/index.html'
s = page.read_text(encoding='utf-8')
if 'id="reason-field"' in s:
    raise SystemExit('Reasons already installed; edit the inline page directly.')
(root / 'artifacts/backups').mkdir(parents=True, exist_ok=True)
(root / 'artifacts/backups/before-reasons-20261115.html').write_text(s, encoding='utf-8')

def insert(old, new):
    global s
    if s.count(old) != 1:
        raise ValueError(f'Expected one integration anchor: {old[:100]!r}, got {s.count(old)}')
    s = s.replace(old, new)

def fragment(name):
    return (root / 'tools' / name).read_text(encoding='utf-8')

insert('</style>', '\n' + fragment('reasons.css') + '\n</style>')
insert('<div id="memory-orbit"', fragment('reasons-markup.html') + '\n<div id="memory-orbit"')
insert('<script id="gift-data"', fragment('reasons-dialog.html') + '\n<script id="gift-data"')
insert('<label for="closing-input">', fragment('reasons-editor.html') + '\n<label for="closing-input">')
insert('const defaultMemories=[', fragment('galaxy.js') + '\n' + fragment('reasons.js') + '\nconst defaultMemories=[')
insert('sprites.push(c);}}\nfunction project', 'sprites.push(c);}buildGalaxyAssets();}\nfunction project')
insert('// A faint orbit gives the heart depth without enclosing it in a UI card.', 'paintGalaxy(false,base,cx,cy,yaw,pitch,shape);drawReasons(now,dt,base,cx,cy);paintReasonOrbit(false);\n// A faint orbit gives the heart depth without enclosing it in a UI card.')
insert('drawEnding(now,cx,cy);frame=', 'paintGalaxy(true,base,cx,cy,yaw,pitch,shape);paintReasonOrbit(true);drawEnding(now,cx,cy);frame=')
insert('gift.memories=normalizeMemories(gift.memories);', 'gift.reasons=normalizeReasons(gift.reasons);renderReasons();gift.memories=normalizeMemories(gift.memories);')
insert("gift={...gift,memories:readMemoryEditor(),", "const reasons=$('reasons-input').value.split('\\n').map(s=>s.trim()).filter(Boolean);if(!reasons.length||reasons.length>100||reasons.some(s=>s.length>40)){$('editor-error').textContent='请输入 1 到 100 个优点词，每个不超过 40 个字。';$('reasons-input').focus();return false;}$('editor-error').textContent='';gift={...gift,reasons,memories:readMemoryEditor(),")
insert("function openContentEditor(){photoGeneration++;", "function openContentEditor(){$('reasons-input').value=gift.reasons.join('\\n');updateReasonEditor();photoGeneration++;")
insert('function cleanExport(doc){', "function cleanExport(doc){for(const id of ['reason-field','reason-list'])doc.querySelector('#'+id).replaceChildren();doc.querySelector('#reason-field').hidden=true;doc.querySelector('#reasons-door').hidden=true;doc.querySelector('#reasons-input').textContent='';doc.querySelector('#reason-catalog').removeAttribute('open');")
page.write_text(s, encoding='utf-8')
print('Installed editable 100-reason constellation into standalone HTML.')
