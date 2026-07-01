/**
 * server/middleware/rawBody.js
 * -----------------------------
 * WHY THIS EXISTS:
 *   Razorpay's webhook signature is computed over the RAW request body bytes.
 *   express.json() parses the body and discards the raw buffer — so by the
 *   time our webhook handler runs, we can no longer verify the signature.
 *
 *   This middleware captures the raw Buffer BEFORE parsing, and attaches it
 *   to req.rawBody. The webhook route reads req.rawBody to verify the
 *   signature, then reads req.body (parsed JSON) for the event data.
 *
 * USAGE:
 *   Mount this ONLY on the webhook route — not globally — because it stores
 *   the full request body in memory, which wastes resources on other routes.
 */

const rawBody = (req, res, next) => {
  let data = [];

  req.on("data", (chunk) => {
    data.push(chunk);
  });

  req.on("end", () => {
    // Concatenate all chunks into one Buffer
    req.rawBody = Buffer.concat(data);

    // Also parse as JSON and attach to req.body for convenience
    try {
      req.body = JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      req.body = {};
    }

    next();
  });

  req.on("error", (err) => {
    next(err);
  });
};

module.exports = rawBody;
