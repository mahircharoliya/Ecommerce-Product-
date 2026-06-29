/**
 * server/middleware/logger.js
 * ----------------------------
 * Simple request logger — logs method, path, status and response time.
 */

function logger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const color  =
      status >= 500 ? "\x1b[31m" : // red
      status >= 400 ? "\x1b[33m" : // yellow
      status >= 200 ? "\x1b[32m" : // green
                      "\x1b[0m";

    console.log(
      `${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${status} (${ms}ms)\x1b[0m`
    );
  });

  next();
}

module.exports = logger;
