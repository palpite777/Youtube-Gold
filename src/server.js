const express = require("express");
const basicAuth = require("express-basic-auth");
const path = require("path");
const fs = require("fs");
const { config } = require("./config");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_USER = process.env.WEB_USER || config.webUser;
const WEB_PASSWORD = process.env.WEB_PASSWORD || config.webPassword;
const authConfigured = Boolean(WEB_USER && WEB_PASSWORD &&
  WEB_USER !== "admin" && WEB_PASSWORD !== "admin123");

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
  return content.split(/\r?\n/).filter(Boolean).slice(-limit);
}

function updateLogs() {
  automationState.logs = readLogTail(80);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
  if (!authConfigured) {
    return res.status(503).send(
      "Painel indisponível: configure WEB_USER e WEB_PASSWORD como variáveis de ambiente seguras."
    );
  }
  return basicAuth({
    users: { [WEB_USER]: WEB_PASSWORD },
    challenge: true,
    unauthorizedResponse: "Unauthorized access",
  })(req, res, next);
});

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
    return res.status(409).json({ ok: false, message: "Automation is already running." });
  }

  const body = req.body || {};
  const searchQuery = body.searchQuery || config.searchQuery;
  const sessionCount = Number(body.sessionCount || config.sessionCount || 1);

  if (!Number.isInteger(sessionCount) || sessionCount < 1 || sessionCount > 5) {
    return res.status(400).json({ ok: false, message: "sessionCount must be an integer from 1 to 5." });
  }

  automationState.running = true;
  automationState.status = "starting";
  automationState.output = "Starting task.";
  updateLogs();

  (async () => {
    try {
      const { runBatch } = require("./index");
      automationState.status = "running";
      automationState.output = "Task running.";
      updateLogs();
      await runBatch({ searchQuery, sessionCount, headless: true });
      automationState.status = "completed";
      automationState.output = "Task finished.";
    } catch (error) {
      automationState.status = "error";
      automationState.output = "Task failed. Check server logs for details.";
      logger.error(error.message);
    } finally {
      automationState.running = false;
      updateLogs();
    }
  })();

  return res.status(202).json({ ok: true, message: "Task accepted." });
});

app.post("/api/stop", (req, res) => {
  return res.status(501).json({
    ok: false,
    message: "A reliable stop controller is not yet implemented; no false success reported.",
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Web panel listening on port ${PORT}`);
    updateLogs();
    console.log(`Web panel listening on port ${PORT}`);
  });
}

module.exports = { app, automationState };
