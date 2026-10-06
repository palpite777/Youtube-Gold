const express = require("express");
const basicAuth = require("express-basic-auth");
const path = require("path");
const fs = require("fs");
const { config } = require("./config");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_USER = process.env.WEB_USER || config.webUser || "admin";
const WEB_PASSWORD = process.env.WEB_PASSWORD || config.webPassword || "admin123";

let automationState = {
  running: false,
  status: "idle",
  output: "Waiting for start.",
  logs: [],
};

const logFilePath = path.join(process.cwd(), "logs", "automation.log");

function ensureLogDir() {
  const dir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLogTail(limit = 80) {
  ensureLogDir();
  if (!fs.existsSync(logFilePath)) return [];

  const content = fs.readFileSync(logFilePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  return lines.slice(-limit);
}

function updateLogs() {
  automationState.logs = readLogTail(80);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  basicAuth({
    users: { [WEB_USER]: WEB_PASSWORD },
    challenge: true,
    unauthorizedResponse: "Unauthorized access",
  })
);

app.get("/api/status", (req, res) => {
  updateLogs();
  res.json({
    running: automationState.running,
    status: automationState.status,
    output: automationState.output,
    logs: automationState.logs,
  });
});

app.post("/api/start", async (req, res) => {
  if (automationState.running) {
    return res.json({ ok: false, message: "Automation is already running." });
  }

  const body = req.body || {};
  const searchQuery = body.searchQuery || config.searchQuery;
  const sessionCount = Number(body.sessionCount || config.sessionCount || 1);
  const proxiesText = body.proxies || "";

  if (proxiesText.trim()) {
    const proxyList = proxiesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    fs.writeFileSync(path.join(process.cwd(), "proxies.txt"), proxyList.join("\n"), "utf8");
    logger.info(`Saved ${proxyList.length} proxies from web panel`);
  } else if (fs.existsSync(path.join(process.cwd(), "proxies.txt"))) {
    fs.unlinkSync(path.join(process.cwd(), "proxies.txt"));
  }

  automationState.running = true;
  automationState.status = "starting";
  automationState.output = `Initializing automation for: ${searchQuery}`;
  updateLogs();

  (async () => {
    try {
      const { runBatch } = require("./index");

      automationState.status = "running";
      automationState.output = `Running ${sessionCount} session(s) for: ${searchQuery}`;
      updateLogs();

      await runBatch({
        searchQuery,
        sessionCount,
        headless: false,
        stealth: true,
        randomize: true,
      });

      automationState.status = "completed";
      automationState.output = "Automation finished successfully.";
    } catch (error) {
      automationState.status = "error";
      automationState.output = error.message;
      logger.error(error.message);
    } finally {
      automationState.running = false;
      updateLogs();
    }
  })();

  return res.json({ ok: true, message: "Automation started successfully." });
});

app.post("/api/stop", (req, res) => {
  automationState.running = false;
  automationState.status = "stopped";
  automationState.output = "Automation stopped by user.";
  updateLogs();

  res.json({ ok: true, message: "Stop signal sent" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  logger.info(`Web panel started at http://localhost:${PORT}`);
  logger.info(`Login: ${WEB_USER}/${WEB_PASSWORD}`);
  updateLogs();
  console.log(`Web panel started at http://localhost:${PORT}`);
  console.log(`Login: ${WEB_USER}/${WEB_PASSWORD}`);
});

module.exports = { app, automationState };
