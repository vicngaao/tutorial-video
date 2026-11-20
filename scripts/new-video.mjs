// Make a new folder for one video: videos/<YYYY-MM-DD>-<topic>/
// It gets its own brief.md and review-log.md (copied from templates/) and empty
// capture/, audio/ and render/ folders. Old videos are never touched.
//
// Usage: node scripts/new-video.mjs "Create an Event RSVP Form"
//        node scripts/new-video.mjs            (keeps the Topic from templates/brief.md)
// Prints the new folder path (relative to the project root) on the last line.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const topic = process.argv.slice(2).join(' ').trim();

const template = readFileSync(join(ROOT, 'templates/brief.md'), 'utf8');
const name = topic || (template.match(/^\s*-\s*Topic\s*:\s*(.+?)\s*$/im)?.[1] ?? 'video');
const slug = name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/, '') || 'video';
const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

let dir = join(ROOT, 'videos', `${date}-${slug}`);
for (let n = 2; existsSync(dir); n++) dir = join(ROOT, 'videos', `${date}-${slug}-${n}`);

for (const sub of ['capture/raw', 'capture/shots', 'audio', 'render']) mkdirSync(join(dir, sub), { recursive: true });
writeFileSync(join(dir, 'brief.md'),
  topic ? template.replace(/^(\s*-\s*Topic\s*:).*$/im, `$1 ${topic.replace(/\$/g, '$$$$')}`) : template);
copyFileSync(join(ROOT, 'templates/review-log.md'), join(dir, 'review-log.md'));

console.log(relative(ROOT, dir));
