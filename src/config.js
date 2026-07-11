function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readBooleanEnv(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === "true";
}

function readNumberEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return parsed;
}

function getConfig() {
  return {
    port: readNumberEnv("PORT", 3000),
    githubWebhookSecret: readRequiredEnv("GITHUB_WEBHOOK_SECRET"),
    telegramBotToken: readRequiredEnv("TELEGRAM_BOT_TOKEN"),
    telegramChatId: readRequiredEnv("TELEGRAM_CHAT_ID"),
    includeAllBranches: readBooleanEnv("INCLUDE_ALL_BRANCHES", false),
    skipBots: readBooleanEnv("SKIP_BOTS", true),
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

module.exports = {
  getConfig,
};
