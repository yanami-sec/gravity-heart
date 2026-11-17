// Record the local app using virtual animation time; no live desktop recording.
// Requires Playwright and FFmpeg, provided through the environment variables below.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const ultra = process.argv.includes('--4k'), openingPreview = process.argv.includes('--opening-preview');
const FPS = Number(process.env.RECORD_FPS || 30), DURATION = openingPreview ? 12 : 120;
const SCALE = ultra ? 2 : 1, VIEW_WIDTH = 1920, VIEW_HEIGHT = 1080;
const FRAMES = FPS * DURATION, WIDTH = VIEW_WIDTH * SCALE, HEIGHT = VIEW_HEIGHT * SCALE;
const preview = process.argv.includes('--preview') || openingPreview;
const dir = path.join(ROOT, 'artifacts', 'recordings', ultra ? '20261117-4k-v2' : '20261117-v2');
const outDir = path.join(ROOT, '视频成片');
const output = path.join(outDir, `引力之心-完整展示-${ultra ? '4K高清版' : '1080P清晰版'}-正面开场-无配乐.mp4`);
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const BASE_URL = process.env.RECORD_BASE_URL || 'http://127.0.0.1:8791/';
const smooth = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

(async () => {
  await fs.mkdir(dir, { recursive: true });
  if (!preview) await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  let encoder, encoderLog = '', encoderClosed;
  const errors = [], external = [], checkpoints = [], downloads = [];
  const wallStarted = Date.now();
  try {
    const context = await browser.newContext({ viewport: { width: VIEW_WIDTH, height: VIEW_HEIGHT },
      deviceScaleFactor: SCALE, isMobile: false, hasTouch: false, locale: 'zh-CN',
      reducedMotion: 'no-preference', acceptDownloads: true });
    const page = await context.newPage();
    const captureSession = await context.newCDPSession(page);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', r => { if (!/^(http:\/\/127\.0\.0\.1:8791\/|data:|blob:)/.test(r.url())) external.push(r.url()); });
    page.on('download', d => downloads.push(d.suggestedFilename()));
    await page.addInitScript(() => {
      let seed = 81173;
      Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      window.__captureFrontHeart = true;
    });
    // These overrides affect only the isolated recording browser. The local app
    // keeps its interactive camera and normal performance settings.
    await page.route(BASE_URL, async route => {
      const response = await route.fetch(); let html = await response.text();
      function replaceOnce(from, to) {
        assert.ok(html.includes(from), `Recording override missing: ${from.slice(0, 70)}`);
        html = html.replace(from, to);
      }
      replaceOnce('cameraYaw=(reduce?0:Math.sin(time*.27)*.1)+motion.x*1.04,cameraPitch=motion.y*.5;',
        'cameraYaw=window.__captureFrontHeart?0:(reduce?0:Math.sin(time*.27)*.1)+motion.x*1.04,cameraPitch=window.__captureFrontHeart?0:motion.y*.5;');
      replaceOnce('const shape=morphState(now)', 'window.__captureCamera={yaw:cameraYaw,pitch:cameraPitch};const shape=morphState(now)');
      if (ultra) {
        replaceOnce('dpr=Math.min(devicePixelRatio||1,1.7)', 'dpr=2');
        const start = html.indexOf('function paintRoseSilk(view,amount,pose){'), end = html.indexOf('function drawRoseSilk(context,view){', start);
        assert.ok(start > 0 && end > start);
        html = html.slice(0, start) + `function paintRoseSilk(view,amount,pose){
          const rose=stardustRose,scale=dpr,tick=reduce||pose.clock>=5.85?'full':Math.floor(pose.clock*24),key=\`\${palette}:\${Math.round(view.yaw*250)}:\${Math.round(view.pitch*250)}:\${Math.round(view.size)}:\${tick}:\${scale}\`;
          const logicalWidth=Math.ceil(view.size*2.9/16)*16,logicalHeight=Math.ceil(view.size*2.4/16)*16;
          if(!rose.surface)rose.surface=document.createElement('canvas');
          if(rose.surfaceKey!==key&&time-rose.surfaceTime>.028){
            const c=rose.surface,width=Math.round(logicalWidth*scale),height=Math.round(logicalHeight*scale);
            if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;
            const p=c.getContext('2d');p.setTransform(scale,0,0,scale,0,0);p.clearRect(0,0,logicalWidth,logicalHeight);p.globalAlpha=1;p.globalCompositeOperation='source-over';
            drawRoseSilk(p,{...view,cx:logicalWidth/2,cy:logicalHeight*.55});rose.surfaceKey=key;rose.surfaceTime=time;
            if(!rose.bloom)rose.bloom=document.createElement('canvas');const b=rose.bloom;b.width=Math.ceil(width/2);b.height=Math.ceil(height/2);const glow=b.getContext('2d');glow.globalCompositeOperation='lighter';
            const weights=[1,2,1];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){glow.globalAlpha=weights[x+1]*weights[y+1]*1.2/16;glow.drawImage(c,x*3*scale,y*3*scale,b.width,b.height);}
          }
          ctx.globalAlpha=amount;ctx.drawImage(rose.surface,view.cx-logicalWidth/2,view.cy-logicalHeight*.55,logicalWidth,logicalHeight);ctx.globalAlpha=1;
          if(rose.bloom){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=amount*.9;ctx.drawImage(rose.bloom,view.cx-logicalWidth/2,view.cy-logicalHeight*.55,logicalWidth,logicalHeight);ctx.restore();}
        }\n` + html.slice(end);
      }
      await route.fulfill({ response, body: html });
    });
    const recordDate = new Date('2026-11-17T12:00:00+08:00');
    await page.clock.install({ time: new Date(+recordDate - 1500) });
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.clock.pauseAt(recordDate);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, i => i.decode().catch(() => {})));
    });
    // Recording-only cursor. Playwright screenshots do not include the OS cursor.
    await page.addStyleTag({ content: `:focus-visible{outline:none!important}*{caret-color:transparent!important}main::after{display:none!important}
      #capture-cursor{position:fixed;inset:0;pointer-events:none;z-index:2147483647}
      #capture-cursor-arrow{position:absolute;top:0;left:0;width:22px;height:28px;filter:drop-shadow(0 2px 3px #100c20aa);transform-origin:3px 3px}
      #capture-cursor-ring{position:absolute;width:44px;height:44px;border:1px solid #ffd8eb88;border-radius:50%;background:#ffb7d315;opacity:0}` });
    await page.evaluate(() => {
      const layer = document.createElement('div'); layer.id = 'capture-cursor';
      layer.innerHTML = '<svg id="capture-cursor-arrow" viewBox="0 0 22 28"><path d="M3 2 3 22 8.5 16.5 12.8 26 16.3 24.4 12 15 20 15Z" fill="#ffeff7" stroke="#5b3c5b" stroke-width="1.1" stroke-linejoin="round"/></svg><i id="capture-cursor-ring"></i>';
      document.documentElement.append(layer);
    });

    let cursor = { x: 960, y: 925, visible: false }, cursorMove = null, clickedAt = -Infinity, scrollMove = null;
    let currentTime = 0;
    const events = new Map();
    function at(seconds, action) {
      const frame = Math.round(seconds * FPS);
      if (!events.has(frame)) events.set(frame, []);
      events.get(frame).push(action);
    }
    const snapshotState = () => page.evaluate(() => ({
      state: { ...document.documentElement.dataset },
      dialog: document.querySelector('dialog[open]')?.id || null,
      roseStage: document.getElementById('rose-stage').textContent,
      photos: Array.from(document.querySelectorAll('.corridor-frame:not([hidden])')).map(n => n.dataset.photo),
      closing: document.getElementById('closing-words').textContent,
      replyReady: !document.getElementById('reply-preview').hidden,
      catalogOpen: document.getElementById('reason-catalog').open,
      reasonScrollTop: document.getElementById('reason-dialog').scrollTop,
      camera: window.__captureCamera,
      canvases: Array.from(document.querySelectorAll('canvas')).map(c=>({id:c.id,width:c.width,height:c.height})),
      deviceScaleFactor: devicePixelRatio
    }));
    async function position(selector) {
      const box = await page.locator(selector).first().boundingBox();
      assert.ok(box, `Missing control: ${selector}`);
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    function glide(x, y, duration = .5, hideAfter = false) {
      cursor.visible = true;
      cursorMove = { fromX: cursor.x, fromY: cursor.y, x, y, start: currentTime, duration, hideAfter };
    }
    function approach(seconds, selector, duration = .5) {
      at(seconds - duration, async () => { const p = await position(selector); glide(p.x, p.y, duration); });
    }
    function click(seconds, selector, move = true) {
      if (move) approach(seconds, selector);
      at(seconds, async () => {
        const p = await position(selector); cursor = { ...p, visible: true }; cursorMove = null;
        await page.mouse.move(p.x, p.y); clickedAt = currentTime;
        await page.evaluate(selector => {
          const el = document.querySelector(selector);
          if (!el || el.disabled || el.closest('[hidden]')) throw Error(`Unavailable: ${selector}`);
          if (el.closest('dialog') && !el.closest('dialog').open) throw Error(`Closed dialog: ${selector}`);
          el.click();
        }, selector);
      });
    }
    function hideCursor(seconds) { at(seconds, async () => {
      cursor.visible = false; cursorMove = null;
      await page.mouse.move(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
      await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })));
    }); }
    function scrollTo(seconds, container, target, duration = 1.1, fraction = .08) {
      at(seconds, async () => {
        scrollMove = await page.evaluate(({ container, target, fraction }) => {
          const c = document.querySelector(container), t = document.querySelector(target);
          return { selector: container, from: c.scrollTop,
            to: Math.min(c.scrollHeight - c.clientHeight, Math.max(0, c.scrollTop + t.getBoundingClientRect().top - c.getBoundingClientRect().top - c.clientHeight * fraction)) };
        }, { container, target, fraction });
        Object.assign(scrollMove, { start: currentTime, duration });
        cursor.visible = false; cursorMove = null;
      });
    }
    function drag(seconds, from, to, duration) {
      at(seconds, async () => { cursor = { ...from, visible: true }; cursorMove = null; await page.mouse.move(from.x, from.y); await page.mouse.down(); clickedAt = currentTime; glide(to.x, to.y, duration); });
      at(seconds + duration, async () => { await page.mouse.up(); });
    }

    // Cover, stardust arrival, orbiting qualities and personalized particle name.
    click(2.5, '#open-heart'); hideCursor(3);
    at(8, async () => { await page.evaluate(() => { window.__captureFrontHeart = false; }); glide(1120, 510, .65); });
    at(8.7, async () => glide(800, 550, .65));
    at(9.4, async () => glide(960, 540, .6));
    at(10, () => page.evaluate(() => { window.__captureFrontHeart = true; }));
    approach(10.5, '#hold-heart');
    at(10.5, async () => { const p = await position('#hold-heart'); cursor = { ...p, visible: true }; await page.mouse.move(p.x, p.y); await page.mouse.down(); clickedAt = currentTime; });
    at(11.7, async () => { await page.mouse.up(); clickedAt = currentTime; }); hideCursor(12);

    // The full qualities list and all three memory fragments.
    click(19.5, '#reasons-door'); click(20.6, '#next-reason');
    scrollTo(22.4, '#reason-dialog', '#reason-list .reason-entry:nth-child(10)', 1.1, .1);
    scrollTo(24, '#reason-dialog', '#reason-list .reason-entry:last-child', 1.2, .1);
    at(25.7, async () => { await page.evaluate(() => document.getElementById('reason-dialog').close()); cursor.visible = false; });
    click(26.3, '.memory-star'); click(28.5, '#next-memory'); click(30.7, '#next-memory'); click(33, '#close-memory');
    click(34, '[data-color="violet"]'); hideCursor(34.3);
    click(35.6, '[data-color="gold"]'); hideCursor(35.9);
    click(37.2, '[data-color="rose"]'); hideCursor(37.5);

    // Personalization is part of the app; show the fields and standalone export.
    click(39, '#customize'); hideCursor(39.4);
    scrollTo(41, '#editor', '.memory-editor', 1.1);
    scrollTo(43, '#editor', '.reason-editor', 1.1);
    click(44.8, '#gallery-caption-editor summary');
    scrollTo(45.1, '#editor', '#gallery-caption-editor', .8);
    scrollTo(46.6, '#editor', '.editor-actions', 1);
    at(48.5, async () => { await page.evaluate(() => document.getElementById('editor').close()); cursor.visible = false; });

    // The rose gets a deliberately longer showcase: bloom, full orbit, top view,
    // reset, and a second uninterrupted bloom.
    click(49.2, '#bloom-rose'); hideCursor(49.6);
    drag(56, { x: 500, y: 560 }, { x: 1400, y: 560 }, 7);
    at(63.5, async () => { await page.mouse.dblclick(960, 570); cursor = { x: 960, y: 570, visible: true }; clickedAt = currentTime; });
    hideCursor(64);
    drag(65, { x: 960, y: 680 }, { x: 960, y: 370 }, 2.2);
    hideCursor(67.5);
    at(70, async () => { await page.mouse.dblclick(960, 570); clickedAt = currentTime; });
    click(71.4, '#rose-replay'); hideCursor(71.8);
    click(83.2, '#rose-exit'); hideCursor(83.6);

    // A few meteor stations, pause on a photo, then go directly to the name.
    click(85.3, '#enter-heart'); hideCursor(85.7);
    click(90, '#journey-pause'); hideCursor(90.3);
    click(91.1, '#journey-skip'); hideCursor(91.5);
    click(93.3, '#journey-exit'); hideCursor(93.6);

    // Read the letter, let it become starlight, then demonstrate a saved reply.
    click(95, '#read-letter'); hideCursor(95.4);
    click(105, '#finish-letter'); hideCursor(105.4);
    click(108, '#write-reply');
    at(108.7, async () => { await page.locator('#reply-message').focus(); cursor.visible = false; });
    const reply = '你的心意，我都收到啦。\n\n往后的风景，我们一起看。';
    [...reply].forEach((character, i) => at(109 + i * .065, () => page.keyboard.insertText(character)));
    click(111.7, '#save-reply');
    scrollTo(112.5, '#reply-dialog', '#reply-preview', 1.2, .04);
    at(117, async () => { await page.evaluate(() => document.getElementById('reply-dialog').close()); cursor.visible = false; });

    const stills = new Map([
      [1, '01-cover'], [4, '02-arrival'], [5.9, '02b-front-heart'], [8.7, '03-heart'], [14.3, '04-name'], [16.6, '05-confession'],
      [20.2, '06-quality'], [23.7, '07-all-qualities'], [27.5, '08-memory-one'], [29.5, '09-memory-two'], [31.8, '10-memory-three'],
      [34.9, '11-violet'], [36.6, '12-gold'], [40, '13-personalize'], [44.3, '14-edit-qualities'], [45.9, '15-photo-captions'], [48, '16-export'],
      [52, '17-bloom'], [55.8, '18-rose'], [59.6, '19-rose-rotating'], [68.4, '20-rose-top'], [79.8, '21-second-bloom'],
      [86, '22-meteor'], [87, '23-photo'], [90.6, '24-pause-photo'], [92.5, '25-meteor-name'],
      [98, '26-letter'], [105.5, '27-paper-light'], [107.4, '28-ending'], [111.4, '29-reply'], [115, '30-reply-image'], [118, '31-outro']
    ].map(([t, name]) => [Math.round(t * FPS), name]));

    async function seekCSS(ms) {
      await page.evaluate(ms => {
        window.__captureAnimations ??= new WeakMap();
        for (const a of document.getAnimations()) {
          if (!window.__captureAnimations.has(a)) window.__captureAnimations.set(a, ms - (Number(a.currentTime) || 0));
          a.pause(); a.currentTime = Math.max(0, ms - window.__captureAnimations.get(a));
        }
      }, ms);
    }
    await seekCSS(0);
    if (!preview) {
      encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
        '-probesize', '1048576', '-analyzeduration', '0', '-threads', '2',
        '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(FPS), '-i', 'pipe:0',
        '-an', '-vf', `scale=iw:ih:out_color_matrix=bt709:out_range=tv,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${DURATION - .8}:d=0.8`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-g', '60', '-pix_fmt', 'yuv420p',
        '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-movflags', '+faststart', '-threads', '4', '-metadata', 'title=引力之心 · 完整展示', output],
        { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
      encoderClosed = once(encoder, 'close');
      encoder.stderr.on('data', d => { encoderLog = (encoderLog + d).slice(-10000); });
      encoder.stdin.on('error', () => {});
    }
    for (let frame = 0; frame < FRAMES; frame++) {
      currentTime = frame / FPS;
      for (const action of events.get(frame) || []) await action();
      if (scrollMove) {
        const t = Math.min(1, Math.max(0, (currentTime - scrollMove.start) / scrollMove.duration));
        await page.evaluate(({ selector, value }) => { document.querySelector(selector).scrollTop = value; },
          { selector: scrollMove.selector, value: scrollMove.from + (scrollMove.to - scrollMove.from) * smooth(t) });
        if (t === 1) scrollMove = null;
      }
      if (cursorMove) {
        const t = Math.min(1, Math.max(0, (currentTime - cursorMove.start) / cursorMove.duration)), e = smooth(t);
        cursor.x = cursorMove.fromX + (cursorMove.x - cursorMove.fromX) * e;
        cursor.y = cursorMove.fromY + (cursorMove.y - cursorMove.fromY) * e;
        await page.mouse.move(cursor.x, cursor.y);
        if (t === 1) { if (cursorMove.hideAfter) cursor.visible = false; cursorMove = null; }
      }
      await page.clock.runFor(Math.round((frame + 1) * 1000 / FPS) - Math.round(frame * 1000 / FPS));
      await seekCSS((frame + 1) * 1000 / FPS);
      await page.evaluate(({ x, y, visible, clickAge }) => {
        const a = document.getElementById('capture-cursor-arrow'), r = document.getElementById('capture-cursor-ring');
        a.style.transform = `translate(${x}px,${y}px)`; a.style.opacity = visible ? '1' : '0';
        const p = Math.min(1, clickAge / .45);
        r.style.transform = `translate(${x - 19}px,${y - 19}px) scale(${.45 + .65 * p})`;
        r.style.opacity = visible && clickAge >= 0 && clickAge < .45 ? String((1 - p) * .8) : '0';
      }, { ...cursor, clickAge: currentTime - clickedAt });
      if (!preview || stills.has(frame)) {
        // Fast PNG changes compression effort only; pixel data stays lossless.
        const shot = await captureSession.send('Page.captureScreenshot', {
          format: 'png', fromSurface: true, captureBeyondViewport: false, optimizeForSpeed: true,
          clip: { x: 0, y: 0, width: VIEW_WIDTH, height: VIEW_HEIGHT, scale: SCALE }
        });
        const png = Buffer.from(shot.data, 'base64');
        assert.equal(png.readUInt32BE(16), WIDTH); assert.equal(png.readUInt32BE(20), HEIGHT);
        if (stills.has(frame)) {
          const file = path.join(dir, `${stills.get(frame)}.png`); await fs.writeFile(file, png);
          checkpoints.push({ time: (frame + 1) / FPS, file, ...(await snapshotState()) });
        }
        if (encoder) {
          if (encoder.exitCode !== null) throw Error(`Encoder stopped: ${encoderLog}`);
          if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain');
        }
      }
      if (frame % (FPS * 3) === 0) console.log(`${preview ? 'Preview' : 'Render'} ${Math.round(frame / FRAMES * 100)}% (${currentTime.toFixed(1)}s/${DURATION}s), elapsed ${Math.round((Date.now() - wallStarted) / 1000)}s`);
    }
    // Finalize the encoded stream before assertions so a validation failure
    // cannot leave a fully rendered video without its MP4 index.
    if (encoder) {
      encoder.stdin.end(); const [code] = await encoderClosed;
      if (code) throw Error(`FFmpeg ${code}: ${encoderLog}`);
      encoder = null;
    }
    assert.deepEqual(errors, [], 'Browser errors'); assert.deepEqual(external, [], 'Unexpected network');
    const check = name => checkpoints.find(c => path.basename(c.file).includes(name));
    assert.deepEqual(check('02b-front-heart').camera, { yaw: 0, pitch: 0 });
    // CDP screenshot capture may report DPR 1 after restoring emulation;
    // verify actual backing pixels instead of the reported device ratio.
    assert.ok(check('02b-front-heart').canvases.some(c => c.width === WIDTH && c.height === HEIGHT));
    if (!openingPreview) {
    assert.equal(check('04-name').state.morph, 'name');
    assert.equal(check('07-all-qualities').catalogOpen, true);
    assert.ok(check('07-all-qualities').reasonScrollTop > 100);
    assert.equal(check('10-memory-three').dialog, 'memory-dialog');
    assert.equal(check('18-rose').state.rose, 'open');
    assert.equal(check('20-rose-top').state.rose, 'open');
    assert.equal(check('21-second-bloom').state.rose, 'open');
    assert.equal(check('26-letter').dialog, 'letter-dialog');
    assert.equal(check('30-reply-image').replyReady, true);
    assert.equal(check('31-outro').state.ending, 'ready');
    }
    const metadata = { preview, output: preview ? null : output, width: WIDTH, height: HEIGHT, fps: FPS,
      duration: DURATION, frames: FRAMES, roseSeconds: openingPreview ? 0 : 34, audio: 'none',
      intermediate: 'lossless-png', encoder: 'libx264', crf: 14, frontalOpening: true, errors, external, downloads,
      checkpoints, wallSeconds: Math.round((Date.now() - wallStarted) / 1000) };
    await fs.writeFile(path.join(dir, preview ? 'preview.json' : 'recording.json'), JSON.stringify(metadata, null, 2));
    console.log(JSON.stringify({ complete: true, preview, output, wallSeconds: metadata.wallSeconds,
      bytes: preview ? 0 : (await fs.stat(output)).size }));
  } finally {
    if (encoder && encoder.exitCode === null) { encoder.stdin.destroy(); encoder.kill(); }
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
