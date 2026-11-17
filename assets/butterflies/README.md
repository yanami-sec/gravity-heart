# 蝴蝶素材

`blue-morpho-v1.png` 是使用内置 image_gen 工具生成的透明背景蓝闪蝶素材原图。`blue-morpho-runtime.webp` 是浏览器 Canvas 缩放到 512 × 512 并以 WebP 质量 0.94 编码的运行素材，保留透明通道。没有外部素材下载或运行时网络请求。

运行素材由 `tools/embed-butterfly.py` 嵌入单文件网页。翅膀和静止的身体、触角在浏览器中分层；每种主题的 24 个扇翅角度预绘制后循环使用。它是一张写实风格生成图片，不是实拍标本照片。

页面保留原图的形态，在 Canvas 中将翅面转为随主题变化的半透明柔光材质，用原图明暗提取翅脉，并沿边缘加入细光和固定的星尘纹理；原始素材不被覆盖。运行时调整大小与透明度表现远近，停靠相框时逐渐清晰，飞行拖尾是会缓慢散开的少量光点。

生成提示词（内置工具模式）：

> Use case: photorealistic-natural. Create ONE production-ready transparent PNG butterfly texture for a small animated butterfly in a romantic galaxy web experience. A real blue morpho butterfly photographed in sharp macro detail from DIRECTLY ABOVE, orthographic dorsal view, completely spread open in a natural bilaterally symmetric resting position. Head faces straight toward the TOP, body exactly on the vertical centerline. Exactly four anatomically believable wings: large angular forewings with pointed apex, distinct smaller rounded scalloped hindwings. Iridescent satin cyan to deep ultramarine scales, fine branching dark wing veins, very narrow charcoal-brown margins with subtle small ivory edge spots. Slender natural dark fuzzy thorax and tapered segmented abdomen, two fine club-tipped antennae, subtle small legs close to body. Soft neutral illumination, crisp natural organic edge detail. Subject fills roughly 84% of square canvas width with clean transparent padding; show complete antennae and wings, no clipping. All surrounding pixels genuinely transparent. No background, no cast shadow, no flowers, no dust, no sparkle particles, no glow, no text, no border, no collage, no extra butterflies. NOT a flat icon, NOT cartoon, NOT heart-shaped or flower-petal-shaped wings. This will be separated into left/right hinged wing halves in code, so a perfectly vertical centered body and straight overhead view are essential.
