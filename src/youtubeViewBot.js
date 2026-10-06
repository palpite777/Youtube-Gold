const { chromium } = require("playwright");
const { config } = require("./config");
const logger = require("./logger");

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function humanMouseMove(page, targetX, targetY, steps = 5) {
  const viewport = page.viewportSize();
  if (!viewport) return;

  const startX = randomBetween(0, viewport.width);
  const startY = randomBetween(0, viewport.height);

  for (let i = 0; i < steps; i++) {
    const progress = i / steps;
    const ease = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    const x = startX + (targetX - startX) * ease;
    const y = startY + (targetY - startY) * ease;

    await page.mouse.move(Math.round(x), Math.round(y));
    await sleep(randomBetween(10, 50));
  }
}

async function organicScroll(page, distance = 300, steps = 5) {
  for (let i = 0; i < steps; i++) {
    const amount = (distance / steps) + randomBetween(-20, 20);
    await page.evaluate((value) => {
      window.scrollBy({ top: value, behavior: "smooth" });
    }, amount);
    await sleep(randomBetween(200, 600));
  }
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

class YouTubeViewBot {
  constructor(options = {}) {
    const runtime = { ...config, ...options };

    this.proxy = runtime.proxy;
    this.youtubeUrl = runtime.youtubeUrl;
    this.searchQuery = runtime.searchQuery;
    this.minWatchSeconds = runtime.minWatchSeconds;
    this.maxWatchSeconds = runtime.maxWatchSeconds;
    this.headless = runtime.headless;
    this.userAgent = runtime.userAgent || USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    this.stealth = runtime.stealth !== false;
    this.locale = runtime.locale || "en-US";
    this.timezone = runtime.timezone || "America/New_York";
    this.randomize = runtime.randomize !== false;

    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async applyStealth() {
    if (!this.stealth) return;

    logger.debug("🛡️ Applying stealth measures...");

    await this.page.addInitScript(`
      // Remove webdriver flag
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });

      // Mask plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' }
        ],
        configurable: true
      });

      // Mask language
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
      });

      Object.defineProperty(navigator, 'language', {
        get: () => 'en-US',
        configurable: true
      });

      // Mask screen resolution
      Object.defineProperty(screen, 'width', { get: () => 1920, configurable: true });
      Object.defineProperty(screen, 'height', { get: () => 1080, configurable: true });
      Object.defineProperty(screen, 'availWidth', { get: () => 1920, configurable: true });
      Object.defineProperty(screen, 'availHeight', { get: () => 1040, configurable: true });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
      Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });

      // Mask WebGL
      try {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return 'Intel Inc.';
          if (parameter === 37446) return 'Intel Iris OpenGL Engine';
          return getParameter.call(this, parameter);
        };
      } catch(e) {}

      // Inject Chrome runtime
      window.chrome = {
        runtime: {
          connect: () => ({}),
          getURL: (path) => 'chrome-extension://test/' + path
        }
      };

      // Hide headless
      Object.defineProperty(navigator, 'headless', {
        get: () => false,
        configurable: true
      });

      // Block detection tools
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0]?.toString?.() || '';
        const blocked = ['detectbot', 'anti-bot', 'fingerprint', 'bot-detection', 'captcha-check'];
        if (blocked.some(p => url.toLowerCase().includes(p))) {
          return Promise.reject(new Error('Blocked'));
        }
        return originalFetch.apply(this, args);
      };

      window.userActivated = true;
      Object.defineProperty(document, 'readyState', {
        get: () => 'complete',
        set: () => {}
      });
    `);

    // Route requests and block detection tools
    await this.page.route("**/*", (route) => {
      const url = route.request().url().toLowerCase();
      const blocked = [
        "detectbot",
        "anti-bot",
        "fingerprint",
        "bot-detection",
        "captcha-check",
        "verify-bot",
        "bot-check"
      ];

      if (blocked.some((p) => url.includes(p))) {
        logger.debug(`🚫 Blocked detection request: ${url}`);
        route.abort();
      } else {
        route.continue();
      }
    });

    logger.debug("✅ Stealth measures applied");
  }

  async launch() {
    logger.info("🚀 Launching browser with stealth mode...");

    const launchArgs = [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-default-browser-check",
      "--no-first-run",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-background-networking",
      "--disable-extensions",
      "--disable-sync",
      "--disable-translate",
      "--disable-notifications",
      "--disable-media-session-api"
    ];

    if (this.headless) {
      launchArgs.push("--headless=new");
    }

    this.browser = await chromium.launch({
      headless: this.headless,
      args: launchArgs,
    });

    logger.debug("✓ Browser launched");

    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: this.locale,
      timezoneId: this.timezone,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });

    logger.debug("✓ Context created");

    this.page = await this.context.newPage();
    logger.debug("✓ Page created");

    await this.applyStealth();
  }

  async navigateToYoutube() {
    logger.info(`📺 Opening ${this.youtubeUrl}`);

    await this.page.goto(this.youtubeUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    logger.debug("✓ Page loaded");

    await this.page.waitForLoadState("networkidle").catch(() => {
      logger.warn("⚠️ Network idle timeout, continuing...");
    });

    await sleep(randomBetween(2000, 5000));
    logger.debug("Simulating initial page exploration...");
    await organicScroll(this.page, randomBetween(200, 400), randomBetween(2, 4));
    await sleep(randomBetween(1500, 3000));
  }

  async searchAndOpenVideo() {
    logger.info(`🔍 Searching for: "${this.searchQuery}"`);

    const searchInput = this.page.locator('input[name="search_query"], input#search').first();
    await searchInput.waitFor({ state: "visible", timeout: 20000 });
    logger.debug("✓ Search input found");

    const box = await searchInput.boundingBox();
    if (box) {
      await humanMouseMove(this.page, box.x + box.width / 2, box.y + box.height / 2, 4);
    }

    await sleep(randomBetween(300, 800));
    await searchInput.click();
    await sleep(randomBetween(200, 500));

    logger.debug("Typing search query...");
    for (const character of this.searchQuery) {
      await this.page.keyboard.type(character);
      await sleep(randomBetween(50, 150));
    }

    await sleep(randomBetween(800, 1500));
    logger.debug("Submitting search...");
    await this.page.keyboard.press("Enter");

    await this.page.waitForLoadState("networkidle").catch(() => {
      logger.warn("⚠️ Search results network idle timeout");
    });
    await sleep(randomBetween(2000, 4000));

    logger.debug("✓ Search completed");
  }

  async selectVideo() {
    logger.info("👀 Browsing search results and selecting video...");

    await organicScroll(this.page, randomBetween(300, 600), randomBetween(2, 3));
    await sleep(randomBetween(1000, 2000));

    const videoLink = this.page.locator("ytd-video-renderer a#thumbnail").first();
    if ((await videoLink.count()) > 0) {
      const box = await videoLink.boundingBox();
      if (box) {
        await humanMouseMove(this.page, box.x + box.width / 2, box.y + box.height / 2, 4);
        await sleep(randomBetween(500, 1200));
      }
      logger.info("🎬 Clicking on video...");
      await videoLink.click();
      await sleep(randomBetween(2000, 4000));
      return;
    }

    const fallback = this.page.locator("a[href*='watch?v=']").first();
    if ((await fallback.count()) > 0) {
      const box = await fallback.boundingBox();
      if (box) {
        await humanMouseMove(this.page, box.x + box.width / 2, box.y + box.height / 2, 4);
      }
      await fallback.click();
      await sleep(randomBetween(2000, 4000));
      return;
    }

    throw new Error("No video result found");
  }

  async watchVideo() {
    await sleep(randomBetween(3000, 6000));

    const duration = this.randomize
      ? randomBetween(this.minWatchSeconds, this.maxWatchSeconds)
      : this.minWatchSeconds;

    logger.info(`⏱️ Starting watch simulation. Targeted time: ${duration} seconds.`);

    const startTime = Date.now();
    let lastScrollTime = Date.now();

    while ((Date.now() - startTime) / 1000 < duration) {
      await sleep(randomBetween(1000, 3000));

      // Simula interações orgânicas de tempos em tempos enquanto assiste
      const currentTime = Date.now();
      if (currentTime - lastScrollTime > randomBetween(15000, 30000)) {
        logger.debug("Simulating reader attention shift (organic scroll/mouse movement)...");
        
        // Pequena rolagem para simular leitura de comentários ou recomendações
        await organicScroll(this.page, randomBetween(100, 250), 2);
        
        // Move o mouse aleatoriamente pela tela do player
        const viewport = this.page.viewportSize();
        if (viewport) {
          await humanMouseMove(
            this.page, 
            randomBetween(100, viewport.width - 100), 
            randomBetween(100, viewport.height - 100), 
            6
          );
        }
        
        lastScrollTime = currentTime;
      }
    }

    logger.info(`✅ Finished watch session successfully. Total time: ${Math.round((Date.now() - startTime) / 1000)} seconds.`);
  }

  async close() {
    logger.info("🔒 Closing bot session and cleaning up browser processes...");
    if (this.page) await this.page.close().catch(() => {});
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    logger.debug("✓ Browser closed and resources cleaned");
  }

  async execute() {
    try {
      await this.launch();
      await this.navigateToYoutube();
      await this.searchAndOpenVideo();
      await this.selectVideo();
      await this.watchVideo();
    } catch (err) {
      logger.error(`❌ Automation failed during execution cycle: ${err.message}`);
      throw err;
    } finally {
      await this.close();
    }
  }
}

module.exports = YouTubeViewBot;
