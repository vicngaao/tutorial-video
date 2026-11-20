// Opens the browser for capture.mjs and probe.mjs, with your login if you made one.
//
// 1. capture/.auth/chrome-profile exists (made by login.mjs) and Google Chrome is installed:
//    real Chrome with a fresh COPY of that profile. You stay logged in, and nothing the
//    run changes (site settings, cookies) is kept for the next run.
// 2. Otherwise: Playwright's Chromium, with capture/.auth/state.json if it exists.
import { chromium } from 'playwright';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The login is shared by all videos, so it lives at the project root (not in a video folder).
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const AUTH_DIR = join(ROOT, 'capture/.auth');
export const AUTH_STATE = join(AUTH_DIR, 'state.json');
export const PROFILE_DIR = join(AUTH_DIR, 'chrome-profile');

// login.mjs starts Chrome with the same cookie storage as the Chrome that Playwright starts.
// Without this, capture cannot read the cookies (on macOS they are locked to the Keychain).
export function chromeLaunchFlags() {
  if (process.platform === 'darwin') return ['--use-mock-keychain'];
  if (process.platform === 'linux') return ['--password-store=basic'];
  return [];
}

// Folders that are only cache, and lock files from the login window.
const SKIP = new Set(['Cache', 'Code Cache', 'GPUCache', 'GrShaderCache', 'ShaderCache', 'DawnCache',
  'Crashpad', 'SingletonLock', 'SingletonSocket', 'SingletonCookie', 'DevToolsActivePort']);

// options: Playwright context options (viewport, locale, recordVideo, deviceScaleFactor) + headless.
// Returns { context, page, mode, close }. mode is "chrome-profile", "state.json" or "no-login".
export async function openBrowser({ headless = true, ...options } = {}) {
  if (existsSync(PROFILE_DIR)) {
    const tmp = mkdtempSync(join(tmpdir(), 'tutorial-profile-'));
    cpSync(PROFILE_DIR, tmp, { recursive: true, filter: (src) => !SKIP.has(basename(src)) });
    try {
      const context = await chromium.launchPersistentContext(tmp, { channel: 'chrome', headless, ...options });
      const page = context.pages()[0] ?? await context.newPage();
      const close = async () => { await context.close(); rmSync(tmp, { recursive: true, force: true }); };
      return { context, page, mode: 'chrome-profile', close };
    } catch (e) {
      rmSync(tmp, { recursive: true, force: true });
      console.error(`Could not open Chrome with the login profile (${String(e.message).split('\n')[0]}). Using Playwright's Chromium.`);
    }
  }
  const browser = await chromium.launch({ headless });
  const hasState = existsSync(AUTH_STATE);
  const context = await browser.newContext({ ...options, storageState: hasState ? AUTH_STATE : undefined });
  const page = await context.newPage();
  const close = async () => { await context.close(); await browser.close(); };
  return { context, page, mode: hasState ? 'state.json' : 'no-login', close };
}
