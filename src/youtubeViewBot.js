const { chromium } = require("playwright");
const { config } = require("./config");

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class YouTubeViewBot {
  constructor(options = {}) {
    const runtime = { ...config, ...options };

    this.proxy = runtime.proxy;
    this.youtubeUrl = runtime.youtubeUrl;
    this.searchQuery = runtime.searchQuery;
    this.minWatchSeconds = runtime.minWatchSeconds;
    this.maxWatchSeconds = runtime.maxWatchSeconds;
    this.headless = runtime.headless;
    this.userAgent = runtime.userAgent;
    this.maxSessionSeconds = runtime.maxSessionSeconds;

    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async launch() {
    console.log("[INFO] Initializing browser...");
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
      proxy: this.proxy ? { server: this.proxy } : undefined,
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    });

    this.page = await this.context.newPage();
  }

  async navigateToYoutube() {
    console.log(`[INFO] Opening ${this.youtubeUrl}`);
    await this.page.goto(this.youtubeUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await this.page.waitForLoadState("networkidle");
  }

  async searchAndOpenVideo() {
    console.log(`[INFO] Searching for: ${this.searchQuery}`);

    const searchInput = this.page.locator('input[name="search_query"], input#search');
    await searchInput.waitFor({ state: "visible", timeout: 30000 });
    await searchInput.fill(this.searchQuery);
    await searchInput.press("Enter");

    await this.page.waitForLoadState("networkidle");

    const videoLink = this.page.locator("ytd-video-renderer a#thumbnail").first();
    if ((await videoLink.count()) > 0) {
      await videoLink.click();
      console.log("[INFO] Video opened from the search results.");
      return;
    }

    const firstResult = this.page.locator("a[href*='watch?v=']").first();
    if ((await firstResult.count()) > 0) {
      await firstResult.click();
      console.log("[INFO] First watch result opened.");
      return;
    }

    throw new Error("No video was found for the current search query.");
  }

  async watchVideo() {
    await this.page.waitForLoadState("domcontentloaded");
    await sleep(3000);

    const watchDuration = randomBetween(this.minWatchSeconds, this.maxWatchSeconds);
    console.log(`[INFO] Watching video for ${watchDuration} seconds...`);
    await sleep(watchDuration * 1000);
  }

  async runSession() {
    const startedAt = Date.now();

    await this.launch();
    await this.navigateToYoutube();
    await this.searchAndOpenVideo();
    await this.watchVideo();

    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    console.log(`[INFO] Session finished in ${elapsed} seconds.`);
  }

  async close() {
    if (this.page) {
      await this.page.close().catch(() => {});
    }

    if (this.context) {
      await this.context.close().catch(() => {});
    }

    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
  }
}

async function runBot(options = {}) {
  const bot = new YouTubeViewBot(options);

  try {
    await bot.runSession();
    return bot;
  } finally {
    await bot.close();
  }
}

module.exports = { YouTubeViewBot, runBot, sleep, randomBetween };
