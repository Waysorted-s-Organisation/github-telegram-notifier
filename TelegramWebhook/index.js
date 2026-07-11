const { createTelegramUpdateProcessor } = require("../src/telegram-update-handler");
const { getConfig } = require("../src/config");
const { createSubscriberStore } = require("../src/subscriber-store");

const config = getConfig();
const subscriberStore = createSubscriberStore(config);
const processor = createTelegramUpdateProcessor(config, subscriberStore);

module.exports = async function telegramWebhook(context, req) {
  const result = await processor({
    headers: req.headers || {},
    body: req.rawBody || req.body || "",
  });

  context.res = {
    status: result.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: result.body,
  };
};
