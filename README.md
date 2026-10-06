# Youtube-Gold

Advanced browser automation tool for opening YouTube, searching for a video, and simulating a watch session using Playwright.

This version is a more robust and modular iteration of the original idea, with:
- environment-based configuration,
- multi-session execution,
- randomized watch times,
- structured logging,
- better CLI control.

## Structure

- `src/config.js` — reads environment variables
- `src/logger.js` — logs to console and `logs/automation.log`
- `src/youtubeViewBot.js` — browser automation logic
- `src/index.js` — CLI entrypoint
- `main.py` — Python version
- `Dockerfile` — containerized run option

## Prerequisites

- Node.js 18+
- Playwright browser binaries

## Install

```bash
git clone https://github.com/palpite777/Youtube-Gold.git
cd Youtube-Gold
npm install
npx playwright install chromium
```

## Environment

```bash
cp .env.example .env
```

Example variables:

```env
PROXY=
YOUTUBE_URL=https://www.youtube.com
SEARCH_QUERY=lofi hip hop radio
MIN_WATCH_SECONDS=15
MAX_WATCH_SECONDS=45
HEADLESS=false
SESSION_COUNT=1
RANDOMIZE=true
LOG_LEVEL=info
```

## Run

```bash
npm start
```

### Optional CLI parameters

```bash
node src/index.js --query "python tutorial" --min 20 --max 60 --headless true --sessions 3
```

### Multiple sessions

```bash
npm run multi
```

## Python version

```bash
pip install -r requirements.txt
python main.py
```

## Docker

```bash
docker build -t youtube-gold .
docker run --env-file .env youtube-gold
```

## Notes

Use this project only in controlled testing or educational environments. Respect platform rules, legal requirements, and your local policies.
