const { runBot } = require("./youtubeViewBot");

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
  }

  return options;
}

(async () => {
  const options = parseArgs(process.argv.slice(2));

  try {
    await runBot(options);
    console.log("[INFO] Automation finished successfully.");
  } catch (error) {
    console.error("[ERROR] Automation failed:");
    console.error(error.message);
    process.exit(1);
  }
})();
