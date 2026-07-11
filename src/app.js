const express = require("express");
const { createWebhookProcessor, shouldIgnoreEvent } = require("./webhook-handler");

function createApp(config) {
  const app = express();
  const processWebhook = createWebhookProcessor(config);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post(
    "/github/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req, res) => {
      const result = await processWebhook({
        headers: req.headers,
        body: req.body,
      });
      return res.status(result.status).json(result.body);
    }
  );

  return app;
}

module.exports = {
  createApp,
  shouldIgnoreEvent,
};
