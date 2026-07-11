const express = require("express");
const { createWebhookProcessor, shouldIgnoreEvent } = require("./webhook-handler");
const { createTelegramUpdateProcessor } = require("./telegram-update-handler");
const { createSubscriberStore } = require("./subscriber-store");

function createApp(config) {
  const app = express();
  const subscriberStore = createSubscriberStore(config);
  const processWebhook = createWebhookProcessor(config, subscriberStore);
  const processTelegramUpdate = createTelegramUpdateProcessor(config, subscriberStore);

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

  app.post(
    "/telegram/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req, res) => {
      const result = await processTelegramUpdate({
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
