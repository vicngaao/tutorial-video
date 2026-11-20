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

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
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

// Talk to Chrome with plain DevTools commands. Playwright's connectOverCDP does not work
// with Chrome 158+ ("Browser context management is not supported").
let cdp;
try {
  cdp = await connectCDP(PORT);
} catch {
  console.error('Could not reach the Chrome window. Did you close it before pressing Enter? Run the command again.');
  chrome.kill();
  process.exit(1);
}
const { cookies } = await cdp.send('Storage.getCookies');
mkdirSync(AUTH_DIR, { recursive: true });
writeFileSync(AUTH_STATE, JSON.stringify({ cookies: cookies.map(toPlaywrightCookie), origins: [] }, null, 2));

// Close Chrome cleanly, so it writes the cookies to the profile on disk.
await cdp.send('Browser.close').catch(() => {});
cdp.close();
await Promise.race([exited, new Promise((r) => setTimeout(r, 10000))]);
if (chrome.exitCode === null) chrome.kill();

console.log(`Saved. Login profile: ${PROFILE_DIR}`);
console.log(`Saved. Session copy:  ${AUTH_STATE}`);
console.log('Capture and probe now use this login. Run this command again if a site logs you out.');

// A tiny DevTools (CDP) client: one WebSocket to the browser, send(method) returns the result.
async function connectCDP(port) {
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error('CDP connection failed')); });
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    const w = waiting.get(msg.id);
    if (!w) return;
    waiting.delete(msg.id);
    msg.error ? w.fail(new Error(msg.error.message)) : w.ok(msg.result);
  };
  ws.onclose = () => { for (const w of waiting.values()) w.fail(new Error('Chrome closed')); waiting.clear(); };
  return {
    send: (method, params = {}) => new Promise((ok, fail) => {
      waiting.set(++id, { ok, fail });
      ws.send(JSON.stringify({ id, method, params }));
    }),
    close: () => ws.close(),
  };
}

// Chrome cookie -> the cookie format Playwright reads from state.json.
function toPlaywrightCookie(c) {
  return {
    name: c.name, value: c.value, domain: c.domain, path: c.path,
    expires: c.session ? -1 : c.expires, httpOnly: c.httpOnly, secure: c.secure,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  };
}
