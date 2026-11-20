"""Compare the script with a transcript, or count spoken words.

Usage:
  python3 ../../scripts/compare_text.py script.md audio/transcript.txt   -> agreement % + differences
  python3 ../../scripts/compare_text.py --count script.md                -> spoken word count
"""
import difflib
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spoken import spoken_sentences  # noqa: E402


# Languages written without spaces: each character counts as one token.
NO_SPACE = "぀-ヿ㐀-䶿一-鿿豈-﫿฀-๿຀-໿က-႟ក-៿"
TOKEN = re.compile(rf"[{NO_SPACE}]|[^\W{NO_SPACE}]+(?:'[^\W{NO_SPACE}]+)*")


def words(text):
    text = unicodedata.normalize("NFC", text.lower())
    return TOKEN.findall(text)


def main():
    a = sys.argv[1:]
    if len(a) == 2 and a[0] == "--count":
        n = len(words(" ".join(spoken_sentences(a[1]))))
        print(f"SPOKEN WORDS: {n}")
        return
    if len(a) != 2:
        sys.exit(__doc__)
    ref = words(" ".join(spoken_sentences(a[0])))
    hyp = words(open(a[1], encoding="utf-8").read())
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    matched = sum(b.size for b in sm.get_matching_blocks())
    pct = 100 * matched / max(len(ref), 1)
    print(f"AGREEMENT: {pct:.1f}%  ({matched}/{len(ref)} script words matched, transcript has {len(hyp)} words)")
    print("PASS (>= 98%)" if pct >= 98 else "FAIL (< 98%)")
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        ctx = " ".join(ref[max(0, i1 - 4):i1])
        print(f"- {tag:7} near '...{ctx}': script='{' '.join(ref[i1:i2])}'  heard='{' '.join(hyp[j1:j2])}'")


if __name__ == "__main__":
    main()
