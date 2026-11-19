"""Shared helper: get the spoken text out of script.md.

Spoken lines look like:  [3] Click "Blank form" to start.
If the file has no [n] lines, every non-heading line is used.
"""
import re

LINE = re.compile(r"^\s*\[(\d+)\]\s*(.+?)\s*$")


def spoken_sentences(path):
    lines = open(path, encoding="utf-8").read().splitlines()
    tagged = [m.group(2) for m in (LINE.match(l) for l in lines) if m]
    if tagged:
        return tagged
    return [l.strip() for l in lines if l.strip() and not l.lstrip().startswith("#")]
