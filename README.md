# Tutorial Video — Maker/Checker Loop for Claude Code

Turn a short brief into a checked, screen-recorded tutorial video.

One AI agent makes each part of the video. A second, independent AI agent checks it against a written checklist.
If the check fails, the work goes back for a fix. After 3 failed rounds, the loop stops and asks you.

```
brief.md → 1 Outline → 2 Script + Shots → 3 Screen Capture → 4 Voiceover → 5 Assembly → 6 Final Review → final.mp4
              ▲ you approve                  (Playwright)       (ElevenLabs)   (Remotion)        ▲ you watch
```

---

## 1. What you need

| Tool | Why | Install (Mac) |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | Runs the agents | Desktop app or CLI |
| Node.js | Screen capture + video assembly | `brew install node` |
| ffmpeg | Video and audio checks | `brew install ffmpeg` |
| Python 3 | Voiceover scripts | `brew install python` |
| [ElevenLabs](https://elevenlabs.io) account + API key | Voiceover and word timestamps | Sign up on the website |

On Windows or Linux, install the same tools with your package manager.

---

## 2. Install (one time)

Download the project:

```bash
git clone https://github.com/vicngaao/tutorial-video.git
```

Install everything else:

```bash
cd tutorial-video && bash setup.sh
```

`setup.sh` installs Playwright, the Chromium browser, and the official Remotion skills for Claude Code.
It also tells you if a tool is missing.

### Add your ElevenLabs API key

1. Go to elevenlabs.io → your profile → **API Keys** → create a key.
2. Add the key to your shell profile. **Never put it in this folder.** Replace `your_key_here`:

```bash
echo 'export ELEVENLABS_API_KEY=your_key_here' >> ~/.zshrc
```

3. Close and reopen your terminal and the Claude app, so they see the key.

---

## 3. Make a video

### Every video gets its own folder

Each video is made in its own folder: `videos/<date>-<topic>/`, for example `videos/2026-11-20-create-an-event-rsvp-form/`.
That folder holds everything of that video: `brief.md`, `outline.md`, `script.md`, `shots.json`, `review-log.md`, `capture/`, `audio/` and `render/` (with `final.mp4`).
When you make a new video, the old folders stay as they are. Nothing is deleted.

`/make-tutorial <topic>` makes the folder for you. To make one by hand:

```bash
node scripts/new-video.mjs "Create an Event RSVP Form"
```

### Step 1 — Edit the video's `brief.md`

Open `videos/<your video>/brief.md`. New folders start from `templates/brief.md`. Change these lines for your video:

| Line | Example |
|---|---|
| Topic | Create an Event RSVP Form |
| Tool | Google Forms (current web version) |
| Start URL | https://docs.google.com/forms/ |
| Audience | Complete beginners |
| Narration language | English |
| Video length | 3 minutes |
| Format | `1920x1080` (YouTube) or `1080x1920` (TikTok, Shorts, Reels) |
| Goal | Create and share a working RSVP form |

Google Forms is only an example. Use any website you want to teach.

### Step 2 — Log in (only if the website needs it)

The agents never type passwords. You log in once by hand:

```bash
node scripts/login.mjs https://docs.google.com/forms/
```

A normal Chrome window opens. Log in. Go back to the terminal and press Enter. Keep Chrome open until the terminal says "Saved". The script closes Chrome for you.

- The window is a normal Chrome, not an automated one. So Google sign-in works, and "Sign in with Google" on other sites (for example ElevenLabs) works too.
- Your login is saved in `capture/.auth/chrome-profile` (plus a copy in `capture/.auth/state.json`). This folder is git-ignored. Do not share it.
- Capture and probe then open Chrome with a fresh copy of that profile. You stay logged in, and each run starts clean: nothing from one run is kept for the next.
- You need Google Chrome installed. Without it, capture uses Playwright's Chromium with `state.json`, and Google may log you out.
- If a site logs you out later, run the login command again.

### Step 3 — Run

Open Claude Code **inside the `tutorial-video` folder**. The agents and the skill only exist in this folder. Then type:

```
/make-tutorial
```

Or give the topic directly:

```
/make-tutorial Create a 3-minute tutorial about Google Forms
```

You are asked twice:
1. **After the outline** — approve the steps or ask for changes.
2. **At the end** — watch `videos/<your video>/render/final.mp4` once for pacing and tone.

Every error and every fix is written to the video's own `review-log.md`.

To continue an unfinished video, type `/make-tutorial` (it resumes the newest unfinished one) or name the folder:

```
/make-tutorial videos/2026-11-20-create-an-event-rsvp-form
```

---

## 4. Change the narration language

You can make videos in other languages. All settings are in the video's `brief.md`. You do not need to edit any code.
To use the same settings for every new video, change `templates/brief.md`.

### Step 1 — Set the language

In `brief.md`:

```
- Narration language: Spanish
```

The script agent writes the narration in this language.

### Step 2 — Pick a TTS model that speaks your language

```
- TTS model: eleven_multilingual_v2
```

| Model | Languages | Notes |
|---|---|---|
| `eleven_multilingual_v2` (default) | 29 languages: English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Korean, Hindi, Arabic, Russian, and more | Best quality for most videos |
| `eleven_flash_v2_5` | 32 languages: all of the above plus a few more | Faster and cheaper |
| `eleven_v3` | 70+ languages | Most expressive. Check your plan supports it |

The full, current list of languages for each model: https://elevenlabs.io/docs/models

**If your language is missing from `eleven_multilingual_v2`,** check the list above and use `eleven_flash_v2_5` or `eleven_v3`.

### Step 3 — Pick a voice with the right accent

```
- Voice ID: Xb7hH8MSUJpSbSDYk0k2
```

The default voice (Alice) can speak other languages, but with an English accent.
For a native accent, pick a native voice:

1. Go to elevenlabs.io → **Voices** → **Voice Library**.
2. Filter by language. Pick a voice. Add it to **My Voices**.
3. Copy its **Voice ID** and paste it into `brief.md`.

List the voices your key can use:

```bash
curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices | python3 -c "import json,sys; [print(v['voice_id'], v['name'], v.get('category')) for v in json.load(sys.stdin)['voices']]"
```

**Free plan:** only `premade` voices work through the API. Voice Library voices need a paid plan.
If you see error `402 paid_plan_required`, pick a `premade` voice or upgrade.

### Step 4 — Set the transcript language

```
- Transcript language code: es
```

Use the ISO code: `en`, `es`, `fr`, `de`, `pt`, `ja`, `zh`, `ko`, ...
Empty means auto-detect. Setting it gives more accurate word timestamps and captions.

### Step 5 — Show the website in the same language (optional)

```
- Browser UI language: es-ES
```

The recorded browser asks websites for this language.
Note: sites where you are logged in (like Google) often use your **account** language instead. Change it in the account settings of the test account.

### Step 6 — Adjust the speaking speed

Speaking speed changes between languages. Update `Words per minute` in `brief.md`.
For Chinese, Japanese and Thai (no spaces between words), the checks count **characters**. Use about 250 characters per minute.

### Example — a Spanish TikTok

```
- Narration language: Spanish
- Format: 1080x1920
- TTS model: eleven_multilingual_v2
- Voice ID: <a Spanish voice ID from your account>
- Transcript language code: es
- Browser UI language: es-ES
```

---

## 5. Limits

- Records **websites in a browser only**. It cannot record desktop or phone apps.
- Each check and each retry costs Claude tokens and ElevenLabs characters.
  The ElevenLabs free plan gives about 10,000 characters per month. A 3-minute video uses about 2,700, plus retries.
- The ElevenLabs free plan does not allow commercial use. Check their terms before you publish for money.
- AI checkers can still miss problems. That is why you watch the final video.

**Tip:** make a short (about 1 minute) test video first.

---

## 6. What is inside

| Path | What it does |
|---|---|
| `videos/<date>-<topic>/` | One folder per video: its brief, outline, script, capture, audio, render and review log |
| `templates/` | `brief.md` and `review-log.md` that each new video folder starts from |
| `scripts/new-video.mjs` | Makes a new video folder |
| `.claude/skills/make-tutorial/` | The orchestrator: runs the stages, the 3-round limit, 2 human checkpoints |
| `.claude/agents/` | 11 agents: 5 makers, 5 checkers, 1 final reviewer |
| `checklists/` | The pass/fail checklist for each stage |
| `scripts/capture.mjs` | Runs `shots.json` in Playwright. Records video, screenshots, timeline |
| `scripts/probe.mjs` | Checks that buttons and labels exist on a live page |
| `scripts/login.mjs` | You log in by hand in a normal Chrome. Saves the login for capture |
| `scripts/browser.mjs` | Opens the browser for capture and probe, with your login if you made one |
| `scripts/tts.py` | ElevenLabs text-to-speech |
| `scripts/stt.py` | ElevenLabs Scribe: transcript + word timestamps |
| `scripts/compare_text.py` | Script vs transcript agreement %, word count |
| `setup.sh` | Installs Playwright, Chromium, Remotion skills |

The `videos/` folders are git-ignored (video files are big). They stay on your computer.

Remotion skills come from [remotion-dev/skills](https://github.com/remotion-dev/skills). Remotion has its own [license](https://www.remotion.dev/license): free for individuals and small companies.

## License

MIT
