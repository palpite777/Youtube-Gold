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
  const logLine = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, "automation.log"), logLine, { encoding: "utf8" });
}

function createLogger(level) {
  return (...messages) => {
    const text = messages.join(" ");
    const prefix = `[${level.toUpperCase().padEnd(5)}]`;
    console.log(`${prefix} ${text}`);
    writeLog(level, text);
  };
}

module.exports = {
  info: createLogger("info"),
  warn: createLogger("warn"),
  error: createLogger("error"),
  debug: createLogger("debug"),
  success: createLogger("success"),
};
