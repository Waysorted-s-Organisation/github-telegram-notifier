const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldIgnoreEvent } = require("../src/app");
const { readChatIdsEnv } = require("../src/config");
const { createTelegramUpdateProcessor } = require("../src/telegram-update-handler");

test("ignores non-default branch pushes by default", () => {
  const reason = shouldIgnoreEvent(
    "push",
    {
      ref: "refs/heads/feature/test",
      repository: { default_branch: "main" },
      sender: { login: "alice" },
    },
    { includeAllBranches: false, skipBots: true }
  );

  assert.match(reason, /Ignoring non-default branch push/);
});

test("ignores bot senders when enabled", () => {
  const reason = shouldIgnoreEvent(
    "pull_request",
    {
      sender: { login: "dependabot[bot]" },
    },
    { includeAllBranches: true, skipBots: true }
  );

  assert.match(reason, /Ignoring bot sender/);
});

test("allows human events", () => {
  const reason = shouldIgnoreEvent(
    "pull_request",
    {
      sender: { login: "alice" },
    },
    { includeAllBranches: true, skipBots: true }
  );

  assert.equal(reason, null);
});

test("ignores low-signal events in balanced mode", () => {
  const reason = shouldIgnoreEvent(
    "watch",
    {
      action: "started",
      sender: { login: "alice" },
    },
    { includeAllBranches: true, skipBots: true, noiseFilterMode: "balanced" }
  );

  assert.match(reason, /Ignoring low-signal event/);
});

test("parses multiple Telegram chat IDs", () => {
  const previousMulti = process.env.TELEGRAM_CHAT_IDS;
  const previousSingle = process.env.TELEGRAM_CHAT_ID;

  process.env.TELEGRAM_CHAT_IDS = "123, 456 ,789";
  delete process.env.TELEGRAM_CHAT_ID;

  assert.deepEqual(readChatIdsEnv(), ["123", "456", "789"]);

  process.env.TELEGRAM_CHAT_IDS = previousMulti;
  process.env.TELEGRAM_CHAT_ID = previousSingle;
});

test("falls back to single Telegram chat ID", () => {
  const previousMulti = process.env.TELEGRAM_CHAT_IDS;
  const previousSingle = process.env.TELEGRAM_CHAT_ID;

  delete process.env.TELEGRAM_CHAT_IDS;
  process.env.TELEGRAM_CHAT_ID = "123";

  assert.deepEqual(readChatIdsEnv(), ["123"]);

  process.env.TELEGRAM_CHAT_IDS = previousMulti;
  process.env.TELEGRAM_CHAT_ID = previousSingle;
});

test("telegram /subscribe stores a subscriber", async () => {
  const calls = [];
  global.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({ ok: true }),
    };
  };

  const subscribers = new Set();
  const processor = createTelegramUpdateProcessor(
    { telegramBotToken: "token", telegramWebhookSecret: "secret" },
    {
      subscribe: async (chat) => subscribers.add(String(chat.id)),
      unsubscribe: async (chatId) => subscribers.delete(String(chatId)),
      isSubscribed: async (chatId) => subscribers.has(String(chatId)),
    }
  );

  const result = await processor({
    headers: { "x-telegram-bot-api-secret-token": "secret" },
    body: Buffer.from(
      JSON.stringify({
        message: {
          chat: { id: 123, type: "private" },
          text: "/subscribe",
        },
      })
    ),
  });

  assert.equal(result.status, 200);
  assert.ok(subscribers.has("123"));
  assert.equal(calls[0].chat_id, 123);
});
