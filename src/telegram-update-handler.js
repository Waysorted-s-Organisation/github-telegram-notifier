const { sendTelegramMessage } = require("./telegram");

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

function getChatAndText(update) {
  const message = update.message || update.edited_message || update.channel_post || null;
  if (!message) {
    return {};
  }

  return {
    chat: message.chat,
    text: message.text || "",
  };
}

async function reply(config, chatId, text) {
  await sendTelegramMessage({
    botToken: config.telegramBotToken,
    chatId,
    text,
  });
}

function createTelegramUpdateProcessor(config, subscriberStore) {
  return async function processTelegramUpdate({ headers, body }) {
    const secretHeader = readHeader(headers, "x-telegram-bot-api-secret-token");
    if (config.telegramWebhookSecret && secretHeader !== config.telegramWebhookSecret) {
      return { status: 401, body: { ok: false, error: "Invalid Telegram webhook secret" } };
    }

    let update;
    try {
      update = JSON.parse(normalizeRawBody(body).toString("utf8"));
    } catch (_error) {
      return { status: 400, body: { ok: false, error: "Invalid Telegram payload" } };
    }

    const { chat, text } = getChatAndText(update);
    if (!chat || !text) {
      return { status: 200, body: { ok: true, ignored: true } };
    }

    const command = text.trim().split(/\s+/)[0].toLowerCase();

    if (command === "/start" || command === "/subscribe") {
      await subscriberStore.subscribe(chat);
      await reply(
        config,
        chat.id,
        [
          "Subscribed to Waysorted GitHub updates.",
          "",
          "Commands:",
          "/status - check subscription",
          "/unsubscribe - stop updates",
          "/subscribe - subscribe again",
        ].join("\n")
      );
      return { status: 200, body: { ok: true, action: "subscribed" } };
    }

    if (command === "/unsubscribe") {
      await subscriberStore.unsubscribe(chat.id);
      await reply(config, chat.id, "Unsubscribed. Send /subscribe anytime to enable updates again.");
      return { status: 200, body: { ok: true, action: "unsubscribed" } };
    }

    if (command === "/status") {
      const subscribed = await subscriberStore.isSubscribed(chat.id);
      await reply(
        config,
        chat.id,
        subscribed
          ? "You are subscribed to Waysorted GitHub updates."
          : "You are not subscribed. Send /subscribe to start receiving updates."
      );
      return { status: 200, body: { ok: true, action: "status" } };
    }

    await reply(
      config,
      chat.id,
      "Send /subscribe to receive GitHub updates, /unsubscribe to stop, or /status to check your subscription."
    );
    return { status: 200, body: { ok: true, action: "help" } };
  };
}

module.exports = {
  createTelegramUpdateProcessor,
};
