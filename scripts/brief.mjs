// Read one setting from brief.md. Line format: "- Label: value".
// A missing line, an empty value, or a value that starts with "(" returns the default.
import { existsSync, readFileSync } from 'node:fs';

export function briefSetting(label, def = undefined, path = 'brief.md') {
  if (!existsSync(path)) return def;
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^\\s*-\\s*${esc}\\s*:\\s*(.*?)\\s*$`, 'im');
  const m = readFileSync(path, 'utf8').match(re);
  if (!m || !m[1] || m[1].startsWith('(')) return def;
  return m[1];
}
