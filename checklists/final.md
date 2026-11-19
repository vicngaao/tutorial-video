# Checklist — Stage 6: Final Review

You did not make this video. Judge only what you see and hear.

| Check | What must pass |
|---|---|
| Accuracy | Every step in the video works in the real tool and matches outline.md |
| Sync | Visuals match the narration at every sampled frame |
| Pacing | No rushed part (< 2 s on a new screen) and no dead part (> 6 s with no new info) |
| Captions | Correct words, readable, not covering the action |
| Audio | Consistent loudness, no clipping, no cut-off words at clip edges |

Sample frames every 3 seconds:
`ffmpeg -y -i render/draft.mp4 -vf fps=1/3 render/check/final_%03d.png`

For each FAIL, write: Item | Timestamp | Evidence | Suggested fix | Stage to send back to (1–5).
