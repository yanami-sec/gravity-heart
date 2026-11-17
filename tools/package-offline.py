"""Build a ready-to-open ZIP. Only the maintainer needs Python for this tool."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'artifacts/releases/gravity-heart-offline.zip'
out.parent.mkdir(parents=True, exist_ok=True)
html = (ROOT / 'dist/index.html').read_bytes()
assert b'data:font/woff2;base64,' in html and b'journey-gallery-data' in html
instructions = '''引力之心 · 免安装版

电脑：先把整个压缩包解压，再双击 index.html，用 Edge、Chrome、Firefox 等浏览器打开。
不需要安装 Python、Node.js，不需要启动服务器，也不需要登录。
如果默认打开的是编辑器：右键 index.html → 打开方式 → 浏览器。

右上角「写给某个人」可以填写名字、文字、心动碎片和照片。
点击「保存成网页」，会生成含这些内容的独立 HTML，可离线打开。
音效默认关闭，需要时可点右上角的声音开关。

手机在线体验：https://yanami-sec.github.io/heart/
如果手机的文件管理器只能预览 HTML，请用浏览器打开上面的在线地址。

开源项目：https://github.com/yanami-sec/gravity-heart
代码、字体和示例图片的许可说明请见随附文件。
'''
with ZipFile(out, 'w', compression=ZIP_DEFLATED, compresslevel=9) as z:
    z.writestr('index.html', html)
    z.writestr('使用说明.txt', instructions.encode('utf-8-sig'))
    for source, target in [('LICENSE', 'LICENSE.txt'), ('THIRD-PARTY.md', '素材说明.md'), ('assets/fonts/OFL.txt', '字体许可-OFL.txt')]:
        z.write(ROOT / source, target)
print(json.dumps({'zip': str(out), 'bytes': out.stat().st_size, 'entrySha256': hashlib.sha256(html).hexdigest()}))
