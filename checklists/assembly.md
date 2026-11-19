# Checklist — Stage 5: Assembly

## Sync (extract frames at key word timestamps from audio/words.json)
Extract one frame: `ffmpeg -y -ss <seconds> -i render/draft.mp4 -frames:v 1 render/check/<name>.png`
- [ ] For each shot, the frame at the first key word of its `say` text shows the action on screen.
- [ ] Zooms and highlights start at or after the word that names the element (never before).
- [ ] The highlighted element is the one named in the narration.

## Captions
- [ ] Caption text matches the spoken words.
- [ ] Captions do not cover the UI element being clicked or typed.
- [ ] Captions are readable (enough size and contrast for the format in brief.md).

## Technical
- [ ] Resolution matches Format in brief.md:
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 render/draft.mp4`
- [ ] Video and audio durations differ by less than 0.2 s.
- [ ] No black frames: `ffmpeg -i render/draft.mp4 -vf blackdetect=d=0.3:pix_th=0.10 -an -f null - 2>&1 | grep black_start` prints nothing.
- [ ] No frozen frames > 4 s that are not intended holds:
      `ffmpeg -i render/draft.mp4 -vf freezedetect=n=-60dB:d=4 -an -f null - 2>&1 | grep freeze_start`
