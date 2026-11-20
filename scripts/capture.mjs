// Stage 3: run shots.json in a real browser, record it, save a screenshot per shot,
// and write capture/timeline.json (start/end time + element box for each shot).
//
// Usage: node scripts/capture.mjs --shots shots.json --size 1920x1080 [--headed]

import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { briefSetting } from './brief.mjs';
import { openBrowser } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const shotsPath = arg('--shots', 'shots.json');
const [W, H] = arg('--size', '1920x1080').split('x').map(Number);
const headed = args.includes('--headed');

const shots = JSON.parse(readFileSync(shotsPath, 'utf8'));
mkdirSync('capture/shots', { recursive: true });
rmSync('capture/raw/tmp', { recursive: true, force: true });
mkdirSync('capture/raw/tmp', { recursive: true });

const { context, page, mode, close } = await openBrowser({
  headless: !headed,
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  locale: briefSetting('Browser UI language', 'en-US'),
  recordVideo: { dir: 'capture/raw/tmp', size: { width: W, height: H } },
});
console.log(`Browser: ${mode}`);
const t0 = Date.now();
const now = () => Date.now() - t0;
const timeline = [];
let failed = null;

for (const s of shots) {
  const entry = { id: s.id, do: s.do, say: s.say, start_ms: now(), box: null, ok: true };
  try {
    let loc = null;
    if (s.target) {
      loc = page.locator(s.target).first();
      await loc.waitFor({ state: 'visible', timeout: 15000 });
      await loc.scrollIntoViewIfNeeded();
      const b = await loc.boundingBox();
      if (b) entry.box = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    }
    const shotFile = `capture/shots/${s.id}.png`;
    switch (s.do) {
      case 'goto':
        await page.goto(s.url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await page.screenshot({ path: shotFile });
        break;
      case 'click':
        await loc.hover();
        await page.screenshot({ path: shotFile }); // element visible, before it changes the page
        await loc.click();
        break;
      case 'hover':
        await loc.hover();
        await page.screenshot({ path: shotFile });
        break;
      case 'type':
        await loc.click();
        await loc.pressSequentially(s.text ?? '', { delay: 60 });
        await page.screenshot({ path: shotFile });
        break;
      case 'press':
        await page.keyboard.press(s.key);
        await page.screenshot({ path: shotFile });
        break;
      case 'scroll':
        await page.mouse.wheel(0, s.y ?? 400);
        await page.waitForTimeout(400);
        await page.screenshot({ path: shotFile });
        break;
      case 'wait':
        await page.screenshot({ path: shotFile });
        break;
      default:
        throw new Error(`Unknown "do": ${s.do}`);
    }
    const left = (s.hold_ms ?? 2000) - (now() - entry.start_ms);
    if (left > 0) await page.waitForTimeout(left);
  } catch (e) {
    entry.ok = false;
    entry.error = String(e.message || e).split('\n')[0];
    failed = entry;
  }
  entry.end_ms = now();
  timeline.push(entry);
  console.log(`${entry.ok ? 'OK  ' : 'FAIL'} shot ${s.id} (${s.do}) ${entry.error ?? ''}`);
  if (failed) break;
}

writeFileSync('capture/timeline.json', JSON.stringify({ size: { width: W, height: H }, shots: timeline }, null, 2));

const video = page.video();
await close(); // the video file is written only after the context closes
const webm = await video.path();
renameSync(webm, 'capture/raw/recording.webm');
rmSync('capture/raw/tmp', { recursive: true, force: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'capture/raw/recording.webm',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', 'capture/raw/recording.mp4']);

if (failed) {
  console.error(`\nSTOPPED at shot ${failed.id}: ${failed.error}`);
  console.error('Fix the target in shots.json (or add a shot that closes the popup), then run again.');
  process.exit(1);
}
console.log(`\nDone. ${timeline.length} shots. capture/raw/recording.mp4, capture/shots/, capture/timeline.json`);
