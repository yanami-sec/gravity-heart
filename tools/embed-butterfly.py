"""Embed the optimized transparent texture and synchronize the butterfly module."""
from pathlib import Path
import base64
import json
import re

ROOT = Path(__file__).resolve().parent.parent
page = ROOT / 'dist/index.html'
source = page.read_text(encoding='utf-8')
texture = ROOT / 'assets/butterflies/blue-morpho-runtime.webp'
data = json.dumps({'src': 'data:image/webp;base64,' + base64.b64encode(texture.read_bytes()).decode('ascii')}, separators=(',', ':'))
tag = '<script id="butterfly-texture-data" type="application/json">' + data + '</script>'
if 'id="butterfly-texture-data"' in source:
    source = re.sub(r'<script id="butterfly-texture-data" type="application/json">.*?</script>', lambda _: tag, source, count=1, flags=re.S)
else:
    source = source.replace('<script>\n', tag + '\n<script>\n', 1)
start = source.find('// Photographic wing texture, cached hinge poses, and a stationary body/antennae.')
if start < 0:
    start = source.index('// Small cached particle butterflies. Their wings animate without repainting paths.')
end = source.index('const defaultMemories=[', start)
module = (ROOT / 'tools/starlight-butterflies.js').read_text(encoding='utf-8')
source = source[:start] + module + '\n' + source[end:]
page.write_text(source, encoding='utf-8')
print('Embedded butterfly texture:', texture.stat().st_size, 'bytes; page:', page.stat().st_size, 'bytes')
