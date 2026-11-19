# Tutorial Video — Maker/Checker Loop for Claude Code

Turn a short brief into a checked screen-recorded tutorial video.
Each of 6 stages has a **Maker** agent and an independent **Checker** agent.
A failed check goes back to the Maker. Maximum 3 rounds per stage, then a human is asked.

`brief.md` → Outline → Script + Shots → Screen Capture (Playwright) → Voiceover (ElevenLabs) → Assembly (Remotion) → Final Review → `render/final.mp4`

---

## Tiếng Việt

### Cần có trước
- [Claude Code](https://claude.com/claude-code) (app hoặc CLI)
- Node.js, ffmpeg, Python 3 (Mac: `brew install node ffmpeg python`)
- Tài khoản [ElevenLabs](https://elevenlabs.io) và API key

### Cài đặt (1 lần)

```bash
git clone <link-repo-này>
```

```bash
cd tutorial-video && bash setup.sh
```

Thêm ElevenLabs key vào máy (không để trong thư mục dự án):

```bash
echo 'export ELEVENLABS_API_KEY=dán_key_vào_đây' >> ~/.zshrc
```

Tắt hẳn terminal / app Claude rồi mở lại.

Gói Free của ElevenLabs: chỉ dùng được giọng "premade" và không được dùng thương mại.
Giọng mặc định là Alice. Đổi giọng: `export ELEVENLABS_VOICE_ID=<voice_id>`.
Video tiếng Việt: `export ELEVENLABS_STT_LANG=vi`.

### Chạy
1. Sửa `brief.md`: chủ đề, công cụ, link trang web, độ dài, khổ video (TikTok: `1080x1920`).
2. Nếu trang web cần đăng nhập, bạn tự đăng nhập 1 lần:
   ```bash
   node scripts/login.mjs <link-trang-web>
   ```
3. Mở Claude Code **trong thư mục này**, rồi gõ:
   ```
   /make-tutorial
   ```

Bạn được hỏi 2 lần: sau dàn ý (duyệt các bước) và khi xong (xem video).
Mọi lỗi và cách sửa nằm trong `review-log.md`.

### Giới hạn
- Chỉ quay được **trang web trong trình duyệt**. Không quay được app máy tính hay điện thoại.
- Google và một số trang chặn đăng nhập trong trình duyệt tự động.
- Mỗi lần kiểm tra lại tốn thêm token Claude và ký tự ElevenLabs.

---

## English

### Requirements
Claude Code, Node.js, ffmpeg, Python 3, an ElevenLabs API key.

### Install
```bash
git clone <this-repo-url>
```
```bash
cd tutorial-video && bash setup.sh
```
Put `export ELEVENLABS_API_KEY=...` in your shell profile (never in this folder). Restart your terminal / Claude app.

### Run
1. Edit `brief.md`.
2. If the site needs login: `node scripts/login.mjs <url>` (you log in by hand; the session is saved to `capture/.auth/`, which is git-ignored).
3. Open Claude Code in this folder and type `/make-tutorial`.

---

## What is inside

| Path | What it does |
|---|---|
| `.claude/skills/make-tutorial/` | Orchestrator: runs the stages, the 3-round limit, 2 human checkpoints |
| `.claude/agents/` | 11 subagents (5 makers, 5 checkers, 1 final reviewer) |
| `checklists/` | Pass/fail checklist for each stage |
| `scripts/capture.mjs` | Runs `shots.json` in Playwright, records video, screenshots, timeline |
| `scripts/probe.mjs` | Checks that UI labels / selectors exist on a live page |
| `scripts/login.mjs` | You log in by hand; saves the session for capture |
| `scripts/tts.py` | ElevenLabs text-to-speech |
| `scripts/stt.py` | ElevenLabs Scribe word timestamps + transcript |
| `scripts/compare_text.py` | Script vs transcript agreement %, word count |
| `setup.sh` | Installs Playwright, Chromium, Remotion skills |

Remotion skills are installed from [remotion-dev/skills](https://github.com/remotion-dev/skills) by `setup.sh`. Remotion has its own [license](https://www.remotion.dev/license) (free for individuals and small teams).
