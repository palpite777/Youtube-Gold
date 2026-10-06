# Youtube-Gold

Automated browser tool for opening YouTube, searching for a video, and simulating a viewing session.

This project is designed as a configurable Playwright automation script with a cleaner project structure and environment-based settings.

## Project structure

- `src/config.js` — environment configuration
- `src/youtubeViewBot.js` — browser automation logic
- `src/index.js` — CLI entrypoint
- `main.py` — Python version using Playwright
- `index.js` — top-level wrapper

## Prerequisites

- Node.js 18+
- Playwright browser binaries

## Install

```bash
npm install
npx playwright install chromium
```

## Environment

Copy the example file and adjust the values:

```bash
cp .env.example .env
```

Example:

```env
PROXY=
YOUTUBE_URL=https://www.youtube.com
SEARCH_QUERY=lofi hip hop radio
MIN_WATCH_SECONDS=15
MAX_WATCH_SECONDS=45
HEADLESS=false
```

## Run

```bash
npm start
```

Optional command-line arguments:

```bash
node src/index.js --query "python tutorial" --min 20 --max 60 --headless true
```

## Python version

```bash
pip install -r requirements.txt
python main.py
```

## Notes

This tool is intended for testing, research, and controlled educational scenarios only. Use it responsibly and in accordance with platform terms and local laws.
