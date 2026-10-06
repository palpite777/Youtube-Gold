const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(process.cwd(), "logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  ensureLogDir();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, "automation.log"), logLine, { encoding: "utf8" });
}

function logger(level) {
  return (...messages) => {
    const text = messages.join(" ");
    console.log(`[${level.toUpperCase()}] ${text}`);
    writeLog(level, text);
  };
}

module.exports = {
  info: logger("info"),
  warn: logger("warn"),
  error: logger("error"),
  debug: logger("debug"),
};
