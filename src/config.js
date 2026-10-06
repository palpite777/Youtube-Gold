const dotenv = require("dotenv");
dotenv.config();

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalized);
}

const config = {
  youtubeUrl: process.env.YOUTUBE_URL || "https://www.youtube.com",
  searchQuery: process.env.SEARCH_QUERY || "lofi hip hop radio",
  minWatchSeconds: getNumber(process.env.MIN_WATCH_SECONDS, 15),
  maxWatchSeconds: getNumber(process.env.MAX_WATCH_SECONDS, 45),
  headless: getBoolean(process.env.HEADLESS, false),
  userAgent: process.env.USER_AGENT || undefined,
  stealth: getBoolean(process.env.STEALTH, true),
  locale: process.env.LOCALE || "en-US",
  timezone: process.env.TIMEZONE || "America/New_York",
  randomize: getBoolean(process.env.RANDOMIZE, true),
  sessionCount: getNumber(process.env.SESSION_COUNT, 1),
  proxy: process.env.PROXY || undefined,
  webUser: process.env.WEB_USER || "admin",
  webPassword: process.env.WEB_PASSWORD || "admin123",
};

module.exports = { config };
