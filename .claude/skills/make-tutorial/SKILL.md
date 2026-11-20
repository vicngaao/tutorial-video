---
name: make-tutorial
description: Orchestrates the 6-stage maker/checker loop that turns a brief into a checked tutorial video, in its own folder videos/<date>-<topic>/ (outline → script + shots → Playwright capture → ElevenLabs voiceover → Remotion assembly → final review). Use when the user says /make-tutorial, "make a tutorial video", or asks to run or resume the tutorial video workflow.
---

# make-tutorial — orchestrator

You are the project manager. You do not write outlines, scripts or code yourself.
You call subagents, read their results, and decide what runs next.

## 0. Pick the video folder
Every video has its own folder: `videos/<YYYY-MM-DD>-<topic>/`. It holds that video's brief.md,
review-log.md, outline.md, script.md, shots.json, capture/, audio/ and render/.
Old video folders are never changed or deleted. Never write video files at the project root.

- The user gave a topic (for example `/make-tutorial Create a 3-minute tutorial about Google Forms`):
  make a NEW folder: `node scripts/new-video.mjs "<topic>"`. The last line it prints is the folder.
  Update the other lines of its brief.md (length, language, Start URL) from the user's words.
- The user named a folder (for example `/make-tutorial videos/2026-11-20-event-rsvp-form`): resume that folder.
- No topic and no folder: look at `ls -d videos/*/`.
  - The newest folder has no `## Done` line in its review-log.md: resume it.
  - Otherwise (no folder, or all are done): make a new folder with `node scripts/new-video.mjs`,
    show the user its brief.md, and ask them to edit it or give a topic. Wait for their answer.
- Tell the user the folder in one line. Call it V below.

## 0b. Prepare
- Show the user V/brief.md if you just made or changed it.
- Pre-flight check. Run:
  ```
  node -e "require('playwright')" && echo playwright-ok
  test -n "$ELEVENLABS_API_KEY" && echo elevenlabs-key-ok
  ls .claude/skills | grep -i remotion
  ```
  If something is missing, tell the user which line in README.md fixes it. Stages 1–2 can still run.

## 1. Resume
Read the files in V to see what is already done (all paths in this table are inside V):
| Stage | Done when |
|---|---|
| 1 Outline | outline.md exists AND review-log.md has an "Outline — … — PASS" AND the user approved it (a line `Human approved outline` in review-log.md) |
| 2 Script | script.md + shots.json exist AND a "Script — … — PASS" round is newer than the outline PASS |
| 3 Capture | capture/raw/recording.mp4 exists AND a "Capture — … — PASS" round is newer than the script PASS |
| 4 Voiceover | audio/voice.mp3 exists AND a "Voiceover — … — PASS" round is newer than the script PASS |
| 5 Assembly | render/draft.mp4 exists AND an "Assembly — … — PASS" round is newer than both capture and voiceover PASS |
| 6 Final | a "Final — … — PASS" round is newer than the assembly PASS |

Start from the first stage that is not done. Tell the user in one line where you resume.

## 2. Run the stages in order
| Stage | Maker | Checker |
|---|---|---|
| 1 | outline-writer | outline-checker |
| 2 | script-writer | script-checker |
| 3 | capture-maker | capture-checker |
| 4 | voiceover-maker | voiceover-checker |
| 5 | assembly-maker | assembly-checker |
| 6 | — | final-reviewer |

Stages 3 and 4 do not depend on each other. You may run them in parallel.

For each stage, the loop is:
1. Call the Maker subagent. Tell it the video folder V, the stage number and the round number.
2. Call the Checker subagent. Tell it V and the round number.
3. Read the last line of the Checker reply.
   - `PASS` → next stage.
   - `FAIL` → call the Maker again. It reads the newest FAIL round in review-log.md and fixes it.
4. Maximum 3 rounds per stage. After a 3rd FAIL:
   append `## <Stage> — STOPPED after 3 rounds — needs human` to V/review-log.md,
   tell the user the remaining errors (copy the table), and STOP.

If a Maker reports it is blocked (login needed, API key missing), STOP and tell the user exactly what to run.

## 3. Human checkpoint #1 — after Stage 1 PASS
Show the user V/outline.md. Ask them to approve or change it.
- Approved → append `Human approved outline` to V/review-log.md and continue.
- Changes → send the user's words to outline-writer as fixes, then outline-checker again.

## 4. Stage 6 send-back
If final-reviewer returns FAIL, read its table. Find the LOWEST "Send to stage" number.
Rerun from that stage through Stage 6 (later stages depend on earlier ones).
Count this as one final-review round. Maximum 3 final-review rounds, then STOP as above.

## 5. Human checkpoint #2 — after Stage 6 PASS
- Copy V/render/draft.mp4 to V/render/final.mp4.
- Append `## Done — render/final.mp4` to V/review-log.md.
- Tell the user: path to V/render/final.mp4, rounds per stage, and every "NEEDS HUMAN LISTEN" / "NEEDS MANUAL CHECK" row.
- Ask them to watch it once for pacing and tone.

## Rules
- Each agent reads files, not chat history. Pass only: video folder V, stage, round, and (for fixes) "read the newest FAIL in V/review-log.md".
- Never edit an artifact yourself to make a check pass.
- Never print or store API keys or passwords.
