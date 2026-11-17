"""Synchronize the faster meteor photo relay without touching pictures or gift data."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
page = ROOT / 'dist/index.html'
s = page.read_text(encoding='utf-8')
start = s.index('// An optional camera journey. The inner scene uses cached nebula and particle text.')
end = s.index('// The photos are embedded data URLs; the corridor works without a server or account.', start)
s = s[:start] + (ROOT / 'tools/heart-journey.js').read_text(encoding='utf-8').strip() + '\n\n' + s[end:]
start = s.index('// The photos are embedded data URLs; the corridor works without a server or account.')
end = s.index('// Photographic wing texture, cached hinge poses, and a stationary body/antennae.', start)
s = s[:start] + (ROOT / 'tools/memory-corridor.js').read_text(encoding='utf-8').strip() + '\n\n' + s[end:]
for name, label in [('heart-journey.css', 'journey'), ('memory-corridor.css', 'photos')]:
    start_marker = f'/* Meteor relay {label} styles. */'
    end_marker = f'/* End meteor relay {label} styles. */'
    styles = start_marker + '\n' + (ROOT / 'tools' / name).read_text(encoding='utf-8').strip() + '\n' + end_marker
    if start_marker in s:
        a = s.index(start_marker)
        b = s.index(end_marker, a) + len(end_marker)
        s = s[:a] + styles + s[b:]
    else:
        old = (ROOT / 'artifacts' / ('before-meteor-relay-' + name)).read_text(encoding='utf-8').strip()
        assert old in s, name
        s = s.replace(old, styles, 1)
a = s.index('<section id="journey-view"')
b = s.index('</section>', a) + len('</section>')
s = s[:a] + (ROOT / 'tools/heart-journey-markup.html').read_text(encoding='utf-8').strip() + s[b:]
s = s.replace('disabled>靠近一点 <span', 'disabled>流星接力 <span', 1)
s = s.replace('修改回忆长廊的配文', '修改流星照片的配文')
s = s.replace('这 11 张图会在星海里自动经过。', '流星会依次点亮这 11 张照片。')
if "doc.querySelector('#journey-pause')" not in s:
    s = s.replace('function cleanExport(doc){', "function cleanExport(doc){doc.querySelector('#journey-pause').textContent='暂停';doc.querySelector('#journey-pause').disabled=false;doc.querySelector('#journey-pause').setAttribute('aria-pressed','false');doc.querySelector('#journey-pause').setAttribute('aria-label','暂停流星接力');doc.querySelector('#journey-title').textContent='流星接力';doc.querySelector('#journey-subtitle').textContent='星光落下，回忆亮起';", 1)
page.write_text(s, encoding='utf-8')
print('Meteor relay synchronized:', page.stat().st_size, 'bytes')
