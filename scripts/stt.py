"""Audio -> word timestamps + transcript with ElevenLabs Scribe (speech-to-text).

Usage: python3 scripts/stt.py audio/voice.mp3 audio/words.json audio/transcript.txt

words.json = [{"text": "Click", "start": 0.12, "end": 0.40}, ...]  (seconds)

Env:
  ELEVENLABS_API_KEY    required (never printed)
  ELEVENLABS_STT_MODEL  optional, default scribe_v1

Language (brief.md line wins, then env var, then auto-detect):
  brief.md "Transcript language code" / ELEVENLABS_STT_LANG   ISO code, e.g. en, es, fr, ja
"""
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spoken import setting  # noqa: E402


def multipart(fields, file_field, file_path):
    boundary = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    ctype = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    out.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; '
        f'filename="{os.path.basename(file_path)}"\r\nContent-Type: {ctype}\r\n\r\n'.encode()
    )
    out.append(open(file_path, "rb").read())
    out.append(f"\r\n--{boundary}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={boundary}"


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    audio, words_out, text_out = sys.argv[1:]
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY not set. Add it to ~/.zshrc and restart the Claude app.")
    fields = {"model_id": os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v1"),
              "timestamps_granularity": "word", "tag_audio_events": "false"}
    lang = setting("Transcript language code", "ELEVENLABS_STT_LANG")
    if lang:
        fields["language_code"] = lang
    body, ctype = multipart(fields, "file", audio)
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
                                 headers={"xi-api-key": key, "Content-Type": ctype,
                                          "User-Agent": "tutorial-video-pipeline"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs Scribe error {e.code}: {e.read().decode(errors='replace')[:400]}")

    words = [{"text": w["text"], "start": w["start"], "end": w["end"]}
             for w in data.get("words", []) if w.get("type", "word") == "word"]
    for p in (words_out, text_out):
        os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    json.dump(words, open(words_out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(text_out, "w", encoding="utf-8").write(data.get("text", "").strip() + "\n")
    print(f"Saved {words_out} ({len(words)} words) and {text_out}")


if __name__ == "__main__":
    main()
