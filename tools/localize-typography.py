"""Keep visible Chinese copy and typography synchronized in the page and fragments."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parent.parent
COPY = {
    'A SMALL CONFESSION': '星河里的心意',
    'a little gravity, a lot of you.': '心动，自有引力',
    'FIG. 01 — A HEART IN ORBIT': '心动轨迹',
    'SOME WORDS FIND THEIR WAY TO YOU': '写给特别的你',
    'for someone, unlike anyone.': '只给特别的你',
    'EVERY LITTLE THING LEADS ME TO YOU': '所有心动，都在靠近你',
    'NO. 001 / ONLY FOR YOU': '星河为序 · 心意为你',
    'A ROSE MADE OF STARS': '星光作瓣，心意成花',
    'A NOTE, JUST FOR YOU': '藏在星光里的心意',
    'with love,': '满心喜欢',
    'A LITTLE MOMENT': '想珍藏的心动',
    '100 THINGS THAT MAKE YOU SHINE': '你身上的每一份闪光',
    'A LITTLE CLOSER': '沿着星光，靠近你',
    'A REPLY, FROM THE HEART': '这是一封来自心底的回信',
    'GRAVITY HEART / A LITTLE COURAGE': '引力之心 · 把心意说给你听',
    '`MOMENT 0${i+1}`': "'心动碎片'",
    '`MOMENT 0${currentMemory+1} / A LITTLE PIECE OF US`': '`第 ${currentMemory+1} 颗星 · 我们的小小瞬间`',
    '双击或按 Home 回正': '双击或按起始键回正',
    '请选择 20 MB 以内的 JPG、PNG 或 WebP 图片。': '请选择 20 兆以内的常见图片格式。',
    'placeholder="yanami"': 'placeholder="想对谁说这些话"',
}
SERIF = ['"STSong","Songti SC","Noto Serif CJK SC","SimSun",serif', '"STSong","Songti SC","SimSun",serif', '"STSong","SimSun",serif', 'Georgia,serif']
def css_fonts(text):
    for family in SERIF:
        text = text.replace(family, 'var(--font-literary)')
    text = text.replace('font:italic ', 'font:400 ')
    return text.replace('font-family:"Microsoft YaHei","PingFang SC",sans-serif', 'font-family:var(--font-ui)')

def canvas_fonts(text):
    return text.replace('"Microsoft YaHei","PingFang SC",sans-serif', '"Heart WenKai","KaiTi",serif').replace('Georgia,serif', '"Heart WenKai","KaiTi",serif')

files = [ROOT / 'dist/index.html'] + [p for p in (ROOT / 'tools').iterdir() if p.suffix in ('.html', '.js', '.css')]
for path in files:
    text = path.read_text(encoding='utf-8')
    for old, new in COPY.items():
        text = text.replace(old, new)
    if path.suffix == '.css':
        text = css_fonts(text)
    elif path.suffix == '.js':
        text = canvas_fonts(text)
    elif path.name == 'index.html':
        text = re.sub(r'(<style>)(.*?)(</style>)', lambda m: m[1] + css_fonts(m[2]) + m[3], text, flags=re.S)
        text = re.sub(r'(<script>)(.*?)(</script>)', lambda m: m[1] + canvas_fonts(m[2]) + m[3], text, flags=re.S)
    if path.suffix == '.js' or path.name == 'index.html':
        text = text.replace('fileRow.append(input,clear,status);', "const picker=document.createElement('label');picker.className='memory-photo-picker';picker.append(document.createTextNode('选择照片'),input);fileRow.append(picker,clear,status);", 1)
        text = text.replace("$('reply-form').addEventListener('submit',event=>{", "$('reply-form').addEventListener('submit',async event=>{", 1)
        text = text.replace("event.preventDefault();const reply=replyValue();if(!reply)return;const c=document.createElement('canvas')", "event.preventDefault();const reply=replyValue();if(!reply)return;await literaryFontReady;const c=document.createElement('canvas')", 1)
    path.write_text(text, encoding='utf-8')

page = ROOT / 'dist/index.html'
s = page.read_text(encoding='utf-8')
font = ROOT / 'assets/fonts/heart-wenkai-common.woff2'
license_text = (ROOT / 'assets/fonts/OFL.txt').read_text(encoding='utf-8')
fontface = '/* Embedded Chinese web font. */\n/*\n' + license_text + '\n*/\n@font-face{font-family:"Heart WenKai";src:url(data:font/woff2;base64,' + base64.b64encode(font.read_bytes()).decode('ascii') + ') format("woff2");font-style:normal;font-weight:400;font-display:swap}\n' + (ROOT / 'tools/chinese-typography.css').read_text(encoding='utf-8') + '\n/* End embedded Chinese web font. */'
start = '/* Embedded Chinese web font. */'
end = '/* End embedded Chinese web font. */'
if start in s:
    a = s.index(start)
    b = s.index(end, a) + len(end)
    s = s[:a] + fontface + s[b:]
else:
    s = s.replace('</style>', fontface + '\n</style>', 1)
module = (ROOT / 'tools/chinese-typography.js').read_text(encoding='utf-8').strip()
marker = '// Refresh sampled lettering after the embedded Chinese web font is ready.'
end_marker = '// End embedded Chinese typography.'
if marker in s:
    a = s.index(marker)
    b = s.index(end_marker, a) + len(end_marker)
    s = s[:a] + module + s[b:]
else:
    s = s.replace("root.dataset.state='sealed';delete root.dataset.journey;", module + "\nroot.dataset.state='sealed';delete root.dataset.journey;", 1)
s = s.replace("$('reply-form').addEventListener('submit',event=>{", "$('reply-form').addEventListener('submit',async event=>{", 1)
s = s.replace("event.preventDefault();const reply=replyValue();if(!reply)return;const c=document.createElement('canvas')", "event.preventDefault();const reply=replyValue();if(!reply)return;await literaryFontReady;const c=document.createElement('canvas')", 1)
page.write_text(s, encoding='utf-8')
print('Chinese interface and embedded font synchronized:', page.stat().st_size, 'bytes; font:', font.stat().st_size, 'bytes')
