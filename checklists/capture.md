# Checklist — Stage 3: Screen Capture

## Files
- [ ] capture/raw/recording.mp4 exists and plays (`ffprobe` shows a duration > 0).
- [ ] capture/timeline.json exists and has one entry per shot in shots.json.
- [ ] capture/shots/<id>.png exists for every shot.

## Content (open each screenshot with the Read tool and look at it)
- [ ] The element named in the shot's `say` text is visible in its screenshot.
- [ ] No popup, cookie banner, sign-in prompt, or toast covers the action.
- [ ] No private data is visible (email address, real names, other tabs).
- [ ] The last screenshot matches the end state in outline.md.

## Run log
- [ ] capture/timeline.json has no shot with `"ok": false`.
