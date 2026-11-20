"""Stage 4: script.md -> audio/voice.mp3 with ElevenLabs Text-to-Speech.

Usage: python3 ../../scripts/tts.py script.md audio/voice.mp3

Env:
  ELEVENLABS_API_KEY    required (never printed)

Voice settings (brief.md line wins, then env var, then default):
  brief.md "Voice ID"   / ELEVENLABS_VOICE_ID   default Xb7hH8MSUJpSbSDYk0k2 ("Alice", premade, works on free plan)
  brief.md "TTS model"  / ELEVENLABS_TTS_MODEL  default eleven_multilingual_v2

Optional audio/aliases.json: {"Remotion": "ree-MOH-shun"} — words swapped before TTS.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spoken import setting, spoken_sentences  # noqa: E402

MAX_CHARS = 2500  # per request; keeps each call well under the API limit


def chunks(sentences):
    out, cur = [], ""
    for s in sentences:
        if cur and len(cur) + len(s) + 1 > MAX_CHARS:
            out.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        out.append(cur)
    return out


def tts(text, key, voice, model, prev_text, next_text):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
    body = {"text": text, "model_id": model}
    if prev_text:
        body["previous_text"] = prev_text[-500:]
    if next_text:
        body["next_text"] = next_text[:500]
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg",
                 "User-Agent": "tutorial-video-pipeline"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs TTS error {e.code}: {e.read().decode(errors='replace')[:400]}")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY not set. Add it to ~/.zshrc and restart the Claude app.")
    voice = setting("Voice ID", "ELEVENLABS_VOICE_ID", "Xb7hH8MSUJpSbSDYk0k2")
    model = setting("TTS model", "ELEVENLABS_TTS_MODEL", "eleven_multilingual_v2")
    print(f"voice={voice} model={model}")

    sentences = spoken_sentences(src)
    alias_path = os.path.join(os.path.dirname(dst) or ".", "aliases.json")
    if os.path.exists(alias_path):
        aliases = json.load(open(alias_path, encoding="utf-8"))
        for word, say in aliases.items():
            pat = re.compile(rf"\b{re.escape(word)}\b")
            sentences = [pat.sub(say, s) for s in sentences]

    parts = chunks(sentences)
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        files = []
        for i, text in enumerate(parts):
            audio = tts(text, key, voice, model,
                        parts[i - 1] if i > 0 else "", parts[i + 1] if i + 1 < len(parts) else "")
            f = os.path.join(tmp, f"part{i:03d}.mp3")
            open(f, "wb").write(audio)
            files.append(f)
            print(f"chunk {i + 1}/{len(parts)}: {len(text)} chars")
        if len(files) == 1:
            os.replace(files[0], dst)
        else:
            lst = os.path.join(tmp, "list.txt")
            open(lst, "w").write("".join(f"file '{f}'\n" for f in files))
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                            "-i", lst, "-c", "copy", dst], check=True)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst],
                         capture_output=True, text=True).stdout.strip()
    print(f"Saved {dst} ({float(dur):.1f} s)")


if __name__ == "__main__":
    main()
