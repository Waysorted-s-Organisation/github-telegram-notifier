const { createWebhookProcessor } = require("../src/webhook-handler");
const { getConfig } = require("../src/config");

const processor = createWebhookProcessor(getConfig());

module.exports = async function webhook(context, req) {
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
