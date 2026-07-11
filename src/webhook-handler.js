const { buildMessage } = require("./formatters");
const { getBranchName, isBotSender, verifySignature } = require("./github");
const { shouldIgnoreForNoise } = require("./noise-filter");
const { sendTelegramMessages } = require("./telegram");

function readHeader(headers, key) {
  const lowercaseKey = key.toLowerCase();
  return headers[key] || headers[lowercaseKey] || null;
}

function normalizeRawBody(body) {
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }
  return Buffer.from(JSON.stringify(body || {}), "utf8");
}

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

  const noiseReason = shouldIgnoreForNoise(eventName, payload, config.noiseFilterMode);
  if (noiseReason) {
    return noiseReason;
  }

  return null;
}

function uniqueChatIds(staticChatIds, dynamicChatIds) {
  return [...new Set([...(staticChatIds || []), ...(dynamicChatIds || [])])];
}

function createWebhookProcessor(config, subscriberStore) {
  const processedDeliveries = new Set();
  const processedDeliveryOrder = [];
  const maxRememberedDeliveries = 1000;

  return async function processWebhook({ headers, body }) {
    const rawBody = normalizeRawBody(body);
    const signature = readHeader(headers, "x-hub-signature-256");
    const eventName = readHeader(headers, "x-github-event");
    const deliveryId = readHeader(headers, "x-github-delivery");

    if (!verifySignature(rawBody, signature, config.githubWebhookSecret)) {
      return { status: 401, body: { ok: false, error: "Invalid signature" } };
    }

    if (deliveryId && processedDeliveries.has(deliveryId)) {
      return { status: 200, body: { ok: true, deduplicated: true } };
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch (_error) {
      return { status: 400, body: { ok: false, error: "Invalid JSON payload" } };
    }

    const ignoredReason = shouldIgnoreEvent(eventName, payload, config);
    if (ignoredReason) {
      return { status: 200, body: { ok: true, ignored: true, reason: ignoredReason } };
    }

    const message = buildMessage(eventName, payload);

    try {
      const dynamicChatIds = subscriberStore ? await subscriberStore.listChatIds() : [];
      const chatIds = uniqueChatIds(config.telegramChatIds, dynamicChatIds);

      await sendTelegramMessages({
        botToken: config.telegramBotToken,
        chatIds,
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

      return { status: 200, body: { ok: true } };
    } catch (error) {
      return { status: 502, body: { ok: false, error: error.message } };
    }
  };
}

module.exports = {
  createWebhookProcessor,
  shouldIgnoreEvent,
};
