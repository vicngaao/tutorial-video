// HUMAN ONLY. Opens a normal Chrome window. You log in by hand.
// Your login is kept in capture/.auth/chrome-profile (used by capture.mjs and probe.mjs)
// and also copied to capture/.auth/state.json (used when Chrome is not installed).
// Never commit or share capture/.auth/.
//
// Why a normal Chrome: Google, and sites that use "Sign in with Google" (for example
// ElevenLabs), refuse to sign in inside a browser that Playwright launched ("This browser
// or app may not be secure"). So this script starts Chrome itself, with no automation.
// It connects to Chrome only AFTER you press Enter, to copy the cookies and close it.
//
// Usage: node scripts/login.mjs <url>
// Optional: CHROME_PATH=/path/to/chrome   (if Chrome is not in the usual place)

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import readline from 'node:readline/promises';
import { AUTH_DIR, AUTH_STATE, PROFILE_DIR, chromeLaunchFlags } from './browser.mjs';

const url = process.argv[2];
if (!url) { console.error('Usage: node scripts/login.mjs <url>'); process.exit(2); }

const PORT = Number(process.env.LOGIN_DEBUG_PORT || 9333);
const CANDIDATES = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  win32: [
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'],
};
const chromePath = process.env.CHROME_PATH || (CANDIDATES[process.platform] || []).find((p) => p && existsSync(p));
if (!chromePath) {
  console.error('Google Chrome not found. Install Chrome (https://www.google.com/chrome/), or set CHROME_PATH.');
  process.exit(1);
}

mkdirSync(PROFILE_DIR, { recursive: true });
const chrome = spawn(chromePath, [
  `--user-data-dir=${PROFILE_DIR}`, // a separate profile, not your own Chrome profile
  `--remote-debugging-port=${PORT}`, // used only after you press Enter
  '--no-first-run',
  '--no-default-browser-check',
  ...chromeLaunchFlags(), // store cookies so the Chrome that capture.mjs starts can read them
  url,
], { stdio: 'ignore' });
const exited = new Promise((r) => chrome.once('exit', r));
chrome.on('error', (e) => { console.error(`Could not start Chrome: ${e.message}`); process.exit(1); });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question('\nA normal Chrome window opened. Log in there.\n'
  + 'When you see the app, come back here and press Enter. Keep Chrome open until you see "Saved"... ');
rl.close();

let browser;
try {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
} catch {
  console.error('Could not reach the Chrome window. Did you close it before pressing Enter? Run the command again.');
  chrome.kill();
  process.exit(1);
}
mkdirSync(AUTH_DIR, { recursive: true });
await browser.contexts()[0].storageState({ path: AUTH_STATE });

// Close Chrome cleanly, so it writes the cookies to the profile on disk.
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Browser.close').catch(() => {});
await Promise.race([exited, new Promise((r) => setTimeout(r, 10000))]);
if (chrome.exitCode === null) chrome.kill();

console.log(`Saved. Login profile: ${PROFILE_DIR}`);
console.log(`Saved. Session copy:  ${AUTH_STATE}`);
console.log('Capture and probe now use this login. Run this command again if a site logs you out.');
