"""Embed the selected local pictures in the standalone page; originals are read-only."""
from pathlib import Path
import base64
import json
import re
import sys
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
destination = root / 'assets/journey'
source = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else destination
destination.mkdir(parents=True, exist_ok=True)
captions = [
    '想把日常的小惊喜，第一个分享给你。',
    '平凡的片刻，也想多陪你一会儿。',
    '想把世界的温柔，都捧到你面前。',
    '想和你一起，听海风慢慢吹。',
    '好天气，想和你一起慢慢度过。',
    '想陪你认真吃饭，也认真开心。',
    '想把目光，停在你出现的方向。',
    '不必去很远，有你就很好。',
    '普通的一天，也想给你一点甜。',
    '想陪你热闹，也陪你胡闹。',
    '想和你慢慢走，走过更多晴天。',
]
photos = []
for index in range(19, 30):
    filename = f'yanami{index}.jpg'
    with Image.open(source / filename) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((1440, 1440), Image.Resampling.LANCZOS)
        target = destination / filename
        if source != destination:
            image.save(target, quality=86, optimize=True, progressive=True)
        photos.append({
            'id': f'yanami{index}', 'width': image.width, 'height': image.height,
            'caption': captions[index-19],
            'src': 'data:image/jpeg;base64,' + base64.b64encode(target.read_bytes()).decode('ascii'),
        })

page = root / 'dist/index.html'
html = page.read_text(encoding='utf-8')
payload = '<script id="journey-gallery-data" type="application/json">' + json.dumps(photos, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + '</script>'
pattern = r'<script id="journey-gallery-data"[^>]*>.*?</script>'
if re.search(pattern, html, re.S):
    html = re.sub(pattern, lambda _: payload, html, count=1, flags=re.S)
else:
    html = html.replace('<script id="gift-data"', payload + '\n<script id="gift-data"', 1)
page.write_text(html, encoding='utf-8')
print(f'Embedded {len(photos)} pictures, yanami19.jpg through yanami29.jpg; image payload {sum((destination / (p["id"]+".jpg")).stat().st_size for p in photos):,} bytes.')
