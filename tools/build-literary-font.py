"""Build the local-only web font; the shipped HTML needs no Python or network."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'artifacts/font-build/packages'))
from fontTools import subset
from fontTools.ttLib import TTFont

source = ROOT / 'artifacts/font-build/source/LXGWWenKaiLite-Regular.ttf'
output = ROOT / 'assets/fonts/heart-wenkai-common.woff2'
unicodes = set(range(32, 127)) | set(range(0x2000, 0x2070)) | set(range(0x3000, 0x3040)) | set(range(0xFF00, 0xFFF0))
for high in range(0xA1, 0xF8):
    for low in range(0xA1, 0xFF):
        try:
            unicodes.update(ord(c) for c in bytes([high, low]).decode('gb2312'))
        except UnicodeDecodeError:
            pass
text = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
unicodes.update(ord(c) for c in text if ord(c) > 127)
font = TTFont(source)
options = subset.Options()
options.layout_features = ['*']
options.name_IDs = ['*']
options.name_languages = ['*']
options.name_legacy = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=unicodes)
subsetter.subset(font)
font.flavor = 'woff2'
font.save(output)
record = {'family': '霞鹜文楷 轻便版', 'version': '1.530', 'source': 'https://github.com/lxgw/LxgwWenKai-Lite/releases/tag/v1.530', 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'webfont_sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'glyphs': len(font.getBestCmap()), 'bytes': output.stat().st_size, 'license': 'OFL.txt'}
(ROOT / 'assets/fonts/source.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(record, ensure_ascii=False))
