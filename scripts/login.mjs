// HUMAN ONLY. Opens a browser window. You log in by hand. The session is saved to
// capture/.auth/state.json so capture.mjs and probe.mjs can reuse it.
// Never commit or share capture/.auth/.
//
// Usage: node scripts/login.mjs <url>

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import readline from 'node:readline/promises';

const url = process.argv[2];
if (!url) { console.error('Usage: node scripts/login.mjs <url>'); process.exit(2); }

let browser;
try {
  browser = await chromium.launch({ headless: false, channel: 'chrome' }); // real Chrome: fewer login blocks
} catch {
  browser = await chromium.launch({ headless: false });
}
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question('\nLog in in the browser window. When you see the app, come back here and press Enter... ');
rl.close();

mkdirSync('capture/.auth', { recursive: true });
await context.storageState({ path: 'capture/.auth/state.json' });
await browser.close();
console.log('Saved session to capture/.auth/state.json');
