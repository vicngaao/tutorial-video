# Checklist — Stage 4: Voiceover

## Text match
- [ ] Word agreement between script.md and the transcript is ≥ 98%.
      Run: `python3 scripts/compare_text.py script.md audio/transcript.txt`
- [ ] No missing or extra sentence (read the diff the script prints).

## Language
- [ ] The transcript is in the "Narration language" from brief.md.
- [ ] The accent sounds native enough for that language. If unsure, add a "NEEDS HUMAN LISTEN" row.

## Pronunciation
- [ ] Every tool / product name in brief.md "Pronunciation notes" appears correctly in the transcript.
- [ ] A name spelled letter by letter in the transcript (e.g. "R E M O") = FAIL. Flag it for a human listen.

## Audio quality
- [ ] Duration fits the target video length (±10%):
      `ffprobe -v error -show_entries format=duration -of csv=p=0 audio/voice.mp3`
- [ ] Integrated loudness is between -17 and -13 LUFS, true peak ≤ -1 dBTP:
      `ffmpeg -hide_banner -i audio/voice.mp3 -af ebur128=peak=true -f null - 2>&1 | tail -12`
- [ ] audio/words.json exists and has word-level start/end times.
