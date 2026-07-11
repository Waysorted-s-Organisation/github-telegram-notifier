const express = require("express");
const { buildMessage } = require("./formatters");
const { getBranchName, isBotSender, verifySignature } = require("./github");
const { sendTelegramMessage } = require("./telegram");

function shouldIgnoreEvent(eventName, payload, config) {
  if (eventName === "push") {
    const branch = getBranchName(payload.ref);
    const defaultBranch = payload.repository.default_branch;

    if (!config.includeAllBranches && branch !== defaultBranch) {
      return `Ignoring non-default branch push: ${branch}`;
    }
  }

  if (config.skipBots && isBotSender(payload.sender?.login || "")) {
    return `Ignoring bot sender: ${payload.sender.login}`;
  }

  return null;
}

function createApp(config) {
  const app = express();
  const processedDeliveries = new Set();
  const processedDeliveryOrder = [];
  const maxRememberedDeliveries = 1000;

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post(
    "/github/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req, res) => {
      const signature = req.get("x-hub-signature-256");
      const eventName = req.get("x-github-event");
      const deliveryId = req.get("x-github-delivery");

      if (!verifySignature(req.body, signature, config.githubWebhookSecret)) {
        return res.status(401).json({ ok: false, error: "Invalid signature" });
      }

      if (deliveryId && processedDeliveries.has(deliveryId)) {
        return res.json({ ok: true, deduplicated: true });
      }

      let payload;
      try {
        payload = JSON.parse(req.body.toString("utf8"));
      } catch (_error) {
        return res.status(400).json({ ok: false, error: "Invalid JSON payload" });
      }

      const ignoredReason = shouldIgnoreEvent(eventName, payload, config);
      if (ignoredReason) {
        return res.json({ ok: true, ignored: true, reason: ignoredReason });
      }

      const message = buildMessage(eventName, payload);
      if (!message) {
        return res.json({ ok: true, ignored: true, reason: `Unhandled event: ${eventName}` });
      }

      try {
        await sendTelegramMessage({
          botToken: config.telegramBotToken,
          chatId: config.telegramChatId,
          text: message.text,
        });
        if (deliveryId) {
          processedDeliveries.add(deliveryId);
          processedDeliveryOrder.push(deliveryId);
          if (processedDeliveryOrder.length > maxRememberedDeliveries) {
            const expiredId = processedDeliveryOrder.shift();
            processedDeliveries.delete(expiredId);
          }
        }
        return res.json({ ok: true });
      } catch (error) {
        return res.status(502).json({ ok: false, error: error.message });
      }
    }
  );

  return app;
}

module.exports = {
  createApp,
  shouldIgnoreEvent,
};
