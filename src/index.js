const fs = require("fs");
const path = require("path");
const { config } = require("./config");
const logger = require("./logger");
const YouTubeViewBot = require("./youtubeViewBot");

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadProxies() {
  const filePath = path.join(process.cwd(), "proxies.txt");
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf8");
  const proxies = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  logger.info(`Loaded ${proxies.length} proxies from proxies.txt`);
  return proxies;
}

function parseArgs(argv) {
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--query") options.searchQuery = next;
    if (arg === "--proxy") options.proxy = next;
    if (arg === "--url") options.youtubeUrl = next;
    if (arg === "--headless") options.headless = next === "true" || next === "1";
    if (arg === "--min") options.minWatchSeconds = Number(next);
    if (arg === "--max") options.maxWatchSeconds = Number(next);
    if (arg === "--sessions") options.sessionCount = Number(next);
    if (arg === "--randomize") options.randomize = next === "true" || next === "1";
    if (arg === "--stealth") options.stealth = next === "true" || next === "1";
    if (arg === "--locale") options.locale = next;
    if (arg === "--timezone") options.timezone = next;
  }

  return options;
}

async function runSession(sessionIndex, total, mergedOptions, proxies) {
  const sessionOptions = { ...mergedOptions };

  if (proxies.length > 0) {
    sessionOptions.proxy = proxies[Math.floor(Math.random() * proxies.length)];
  }

  try {
    logger.info(`\n=== Session ${sessionIndex}/${total} starting ===`);
    const bot = new YouTubeViewBot(sessionOptions);
    await bot.execute();
    logger.success(`=== Session ${sessionIndex}/${total} completed successfully ===`);
    return true;
  } catch (error) {
    logger.error(`=== Session ${sessionIndex}/${total} failed: ${error.message} ===`);
    return false;
  }
}

async function runBatch(options = {}) {
  const finalOptions = { ...config, ...options };
  const totalSessions = Number(finalOptions.sessionCount || 1);
  const proxies = loadProxies();

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < totalSessions; i += 1) {
    if (i > 0) {
      const delayMs = randomBetween(2000, 5000);
      logger.info(`Waiting ${delayMs}ms before starting next session...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const ok = await runSession(i + 1, totalSessions, finalOptions, proxies);
    if (ok) {
      successCount += 1;
    } else {
      failureCount += 1;
    }
  }

  logger.info(`\nBatch completed: ${successCount} success / ${failureCount} failed`);
}

(async () => {
  try {
    const cliOptions = parseArgs(process.argv.slice(2));
    await runBatch(cliOptions);
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
})();

module.exports = { runBatch, loadProxies, parseArgs };
