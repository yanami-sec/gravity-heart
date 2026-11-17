# 网页字体

标题、情书、送花文案和粒子文字使用「霞鹜文楷 轻便版」。按钮与表单使用设备上的中文黑体，保持清晰易读。

字体来自 [LXGW 官方项目 v1.530](https://github.com/lxgw/LxgwWenKai-Lite/releases/tag/v1.530)，遵循随附的 [SIL Open Font License 1.1](OFL.txt)。版权、保留名称和附加网页字体许可原文均保留。

`heart-wenkai-common.woff2` 仅用于网页嵌入，由官方常规字重转换并保留常用简体中文、界面文字、标点和拉丁姓名字符。完整版本和校验值记录在 `source.json`。不在子集内的罕见字由设备中文字体补足。

字体与许可文本已嵌入 `dist/index.html`，页面运行和离线导出不依赖字体网站。没有向系统安装字体。

开发时可用 `tools/build-literary-font.py` 生成网页字体，再运行 `tools/localize-typography.py` 同步中文文案、样式和嵌入字体。重建所需工具仅放在忽略的 `artifacts/font-build` 中，打开网页不需要这些工具。
