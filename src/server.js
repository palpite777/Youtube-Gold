// Vercel is configured to use src/server.js as the Node.js entrypoint.
// Export a request handler (not an object containing an Express app) so
// function invocation works in the serverless runtime. The dashboard-only
// handler intentionally keeps automation disabled in this deployment.
const handler = require("../api/index");

module.exports = handler;
