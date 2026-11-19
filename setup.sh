#!/usr/bin/env bash
# One-time setup. Run from this folder:  bash setup.sh
set -e
cd "$(dirname "$0")"

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
miss() { printf "  \033[31m✗\033[0m %s\n" "$1"; MISSING=1; }

echo "1. Checking tools"
MISSING=0
command -v node    >/dev/null && ok "node $(node --version)"         || miss "node — install: brew install node"
command -v npm     >/dev/null && ok "npm $(npm --version)"           || miss "npm — comes with node"
command -v ffmpeg  >/dev/null && ok "ffmpeg"                         || miss "ffmpeg — install: brew install ffmpeg"
command -v python3 >/dev/null && ok "python3 $(python3 --version | cut -d' ' -f2)" || miss "python3 — install: brew install python"
command -v claude  >/dev/null && ok "claude (Claude Code)"           || echo "  ! claude CLI not found. You can still use the Claude desktop app."
if [ "$MISSING" = 1 ]; then echo; echo "Install the missing tools above, then run: bash setup.sh"; exit 1; fi

echo; echo "2. Installing Playwright + Chromium (screen capture)"
npm install --no-fund --no-audit
npx playwright install chromium

echo; echo "3. Installing Remotion skills for Claude Code (video assembly)"
npx -y skills add remotion-dev/skills -a claude-code -y

echo; echo "4. Checking ElevenLabs key (voiceover)"
if [ -n "$ELEVENLABS_API_KEY" ]; then
  ok "ELEVENLABS_API_KEY is set"
else
  echo "  ! ELEVENLABS_API_KEY is not set. Add it to your shell profile (never to this folder):"
  echo "      echo 'export ELEVENLABS_API_KEY=your_key_here' >> ~/.zshrc"
  echo "    Then restart your terminal / the Claude app."
fi

echo; echo "Done. Next: edit brief.md, open Claude Code in this folder, type /make-tutorial"
