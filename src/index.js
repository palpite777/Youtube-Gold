const fs = require("fs");
const path = require("path");
const { config } = require("./config");
const logger = require("./logger");
const YouTubeViewBot = require("./youtubeViewBot");

/**
 * Load proxies from proxies.txt file
 * Format: one proxy per line (http://proxy:port or socks5://proxy:port)
 * @returns {string[]} Array of proxy URLs
 */
function loadProxies() {
  const proxiesFile = path.join(process.cwd(), "proxies.txt");

  if (!fs.existsSync(proxiesFile)) {
    logger.debug("proxies.txt not found - running without proxy rotation");
    return [];
  }

  try {
    const content = fs.readFileSync(proxiesFile, "utf-8");
    const proxies = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    if (proxies.length === 0) {
      logger.warn("proxies.txt is empty or contains only comments");
      return [];
    }

    logger.info(`✓ Loaded ${proxies.length} proxy/proxies from proxies.txt`);
    return proxies;
  } catch (error) {
    logger.error(`Failed to load proxies: ${error.message}`);
    return [];
  }
}

/**
 * Get a random proxy from the loaded list
 * @param {string[]} proxies Array of proxies
 * @returns {string|undefined} Random proxy or undefined if no proxies
 */
function getRandomProxy(proxies) {
  if (!proxies || proxies.length === 0) {
    return undefined;
  }
  return proxies[Math.floor(Math.random() * proxies.length)];
}

/**
 * Random delay between min and max milliseconds
 * @param {number} min Minimum delay in ms
 * @param {number} max Maximum delay in ms
 * @returns {Promise<void>}
 */
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Parse CLI arguments to override config
 * @param {string[]} argv Process arguments
 * @returns {object} Merged options
 */
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

/**
 * Execute a single bot session
 * @param {number} sessionIndex Current session index (1-based)
 * @param {number} totalSessions Total number of sessions
 * @param {object} options Bot options
 * @param {string[]} proxies Array of available proxies
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function executeSession(sessionIndex, totalSessions, options, proxies) {
  const sessionId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const sessionOptions = { ...options };

  // Assign random proxy if available
  if (proxies && proxies.length > 0) {
    sessionOptions.proxy = getRandomProxy(proxies);
    logger.info(
      `[Session ${sessionIndex}/${totalSessions}] (ID: ${sessionId}) Using proxy: ${sessionOptions.proxy}`
    );
  } else {
    logger.info(`[Session ${sessionIndex}/${totalSessions}] (ID: ${sessionId}) Starting without proxy`);
  }

  try {
    logger.info(`\n${"-".repeat(70)}`);
    logger.info(`Session ${sessionIndex}/${totalSessions} | ID: ${sessionId} | START`);
    logger.info(`${"-".repeat(70)}\n`);

    const bot = new YouTubeViewBot(sessionOptions);
    const startTime = Date.now();

    await bot.execute();

    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.success(`\n✅ Session ${sessionIndex}/${totalSessions} (ID: ${sessionId}) COMPLETED in ${duration}s\n`);
    return true;
  } catch (error) {
    logger.error(
      `\n❌ Session ${sessionIndex}/${totalSessions} (ID: ${sessionId}) FAILED: ${error.message}\n`
    );
    return false;
  }
}

/**
 * Main execution function - runs all sessions with proper parallelization
 * @param {object} userOptions CLI/environment options
 */
async function runAllSessions(userOptions = {}) {
  logger.info(`\n${"|\n".repeat(3)}`);
  logger.info(
    `╔═══════════════════════════════════════════════════════════════════╗`
  );
  logger.info(
    `║            🎬 YouTube Gold - Stealth Automation Engine             ║`
  );
  logger.info(
    `╚═══════════════════════════════════════════════════════════════════╝`
  );
  logger.info(`|\n`.repeat(3));

  // Merge configuration: environment > CLI args > defaults
  const mergedOptions = { ...config, ...userOptions };
  const sessionCount = Number(mergedOptions.sessionCount || 1);

  // Load proxies
  const proxies = loadProxies();
  logger.info(
    `\n⚙️  Configuration loaded: ${sessionCount} session(s) | Stealth: ${mergedOptions.stealth !== false ? "ON" : "OFF"}`
  );
  if (proxies.length > 0) {
    logger.info(`📍 Proxy rotation: ${proxies.length} proxy/proxies available`);
  }
  logger.info(`🎯 Target: "${mergedOptions.searchQuery}" | Duration: ${mergedOptions.minWatchSeconds}-${mergedOptions.maxWatchSeconds}s\n`);

  const results = {
    successful: 0,
    failed: 0,
    total: sessionCount,
    startTime: Date.now(),
    sessions: [],
  };

  // Execute sessions sequentially with delays to avoid VM spikes
  for (let index = 0; index < sessionCount; index += 1) {
    const sessionIndex = index + 1;

    // Add random delay before each session to simulate human connections
    if (index > 0) {
      const delayMs = randomBetween(2000, 5000);
      logger.info(
        `⏰ Waiting ${Math.round(delayMs / 1000)}s before next session to simulate human behavior...`
      );
      await randomDelay(2000, 5000);
    }

    const success = await executeSession(sessionIndex, sessionCount, mergedOptions, proxies);

    if (success) {
      results.successful += 1;
    } else {
      results.failed += 1;
    }

    results.sessions.push({
      index: sessionIndex,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  // Summary report
  const totalDuration = Math.round((Date.now() - results.startTime) / 1000);
  logger.info(`\n${"|\n".repeat(2)}`);
  logger.info(`╔═══════════════════════════════════════════════════════════════════╗`);
  logger.info(`║                     📊 EXECUTION SUMMARY REPORT                    ║`);
  logger.info(`╚═══════════════════════════════════════════════════════════════════╝`);
  logger.info(`|\n`);
  logger.info(`Total Sessions:    ${results.total}`);
  logger.success(`✅ Successful:      ${results.successful}`);
  logger.error(`❌ Failed:          ${results.failed}`);
  logger.info(`⏱️  Total Duration:  ${totalDuration}s`);
  logger.info(`\n`);

  // Detailed session log
  logger.debug("Session Details:");
  results.sessions.forEach((session) => {
    const status = session.success ? "✅ SUCCESS" : "❌ FAILED";
    logger.debug(`  [${session.index}] ${status} at ${session.timestamp}`);
  });

  logger.info(`\n${"|\n".repeat(2)}`);

  if (results.failed === 0) {
    logger.success(`🎉 All sessions completed successfully!\n`);
    process.exit(0);
  } else if (results.successful > 0) {
    logger.warn(`⚠️  Some sessions failed. ${results.successful}/${results.total} successful.\n`);
    process.exit(0); // Exit gracefully even with partial failures
  } else {
    logger.error(`💥 All sessions failed. Check logs for details.\n`);
    process.exit(1);
  }
}

/**
 * Helper function for random numbers
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Main entry point
 */
(async () => {
  try {
    const cliOptions = parseArgs(process.argv.slice(2));
    await runAllSessions(cliOptions);
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
})();

module.exports = { runAllSessions, loadProxies, getRandomProxy, parseArgs };
