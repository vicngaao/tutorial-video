// Check that UI labels or selectors exist and are visible on a live page.
//
// Usage:
//   node ../../scripts/probe.mjs <url> "Label 1" "Label 2"
//   node ../../scripts/probe.mjs <url> --selector "text=Blank form" --selector "[aria-label='Form title']"
//   add --size 1080x1920 to use another viewport

import { briefSetting } from './brief.mjs';
import { openBrowser } from './browser.mjs';

const argv = process.argv.slice(2);
const url = argv.shift();
if (!url) {
  console.error('Usage: node ../../scripts/probe.mjs <url> "Label" ... [--selector "<sel>"] [--size WxH]');
  process.exit(2);
}
const labels = [];
const selectors = [];
let size = '1920x1080';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--selector') selectors.push(argv[++i]);
  else if (argv[i] === '--size') size = argv[++i];
  else labels.push(argv[i]);
}
const [W, H] = size.split('x').map(Number);
const { page, mode, close } = await openBrowser({
  viewport: { width: W, height: H },
  locale: briefSetting('Browser UI language', 'en-US'),
});
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

const visible = async (loc) => {
  try { await loc.first().waitFor({ state: 'visible', timeout: 4000 }); return true; } catch { return false; }
};

const result = { url, final_url: page.url(), title: await page.title(), login: mode, labels: {}, selectors: {} };
for (const l of labels) {
  result.labels[l] = (await visible(page.getByText(l, { exact: true }))) ? 'found (exact)'
    : (await visible(page.getByText(l))) ? 'found (partial match only)'
    : (await visible(page.getByLabel(l))) ? 'found (as aria-label)'
    : 'NOT FOUND';
}
for (const s of selectors) {
  result.selectors[s] = (await visible(page.locator(s))) ? 'found' : 'NOT FOUND';
}
if (/accounts\.google\.com|login|signin|sign-in/i.test(result.final_url)) {
  result.note = 'Redirected to a login page. Labels behind login cannot be checked. Human must run from the project folder: node scripts/login.mjs <url>';
}
console.log(JSON.stringify(result, null, 2));
await close();
