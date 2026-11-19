"""Shared helpers.

spoken_sentences(): get the spoken text out of script.md.
  Spoken lines look like:  [3] Click "Blank form" to start.
  If the file has no [n] lines, every non-heading line is used.

setting(): read one voice setting. Order: brief.md line > environment variable > default.
"""
import os
import re

LINE = re.compile(r"^\s*\[(\d+)\]\s*(.+?)\s*$")


def setting(brief_label, env_name, default=None, brief_path="brief.md"):
    """brief.md line looks like:  - Voice ID: abc123   (a value starting with "(" counts as empty)."""
    if os.path.exists(brief_path):
        pat = re.compile(rf"^\s*-\s*{re.escape(brief_label)}\s*:\s*(.*?)\s*$", re.IGNORECASE)
        for line in open(brief_path, encoding="utf-8"):
            m = pat.match(line)
            if m and m.group(1) and not m.group(1).startswith("("):
                return m.group(1)
    return os.environ.get(env_name) or default


def spoken_sentences(path):
    lines = open(path, encoding="utf-8").read().splitlines()
    tagged = [m.group(2) for m in (LINE.match(l) for l in lines) if m]
    if tagged:
        return tagged
    return [l.strip() for l in lines if l.strip() and not l.lstrip().startswith("#")]
