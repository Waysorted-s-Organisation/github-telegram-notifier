function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readChatIdsEnv() {
  const multiValue = process.env.TELEGRAM_CHAT_IDS;
  const singleValue = process.env.TELEGRAM_CHAT_ID;
  const rawValue = multiValue || singleValue;

  if (!rawValue) {
    throw new Error("Missing required environment variable: TELEGRAM_CHAT_IDS or TELEGRAM_CHAT_ID");
  }

  const chatIds = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    throw new Error("No valid Telegram chat IDs were provided");
  }

  return chatIds;
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

function readStringEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined ? fallback : value;
}

function getConfig() {
  return {
    port: readNumberEnv("PORT", 3000),
    azureWebJobsStorage: process.env.AzureWebJobsStorage || "",
    githubWebhookSecret: readRequiredEnv("GITHUB_WEBHOOK_SECRET"),
    telegramBotToken: readRequiredEnv("TELEGRAM_BOT_TOKEN"),
    telegramChatIds: readChatIdsEnv(),
    telegramWebhookSecret: readStringEnv("TELEGRAM_WEBHOOK_SECRET", ""),
    includeAllBranches: readBooleanEnv("INCLUDE_ALL_BRANCHES", false),
    skipBots: readBooleanEnv("SKIP_BOTS", true),
    noiseFilterMode: readStringEnv("NOISE_FILTER_MODE", "balanced"),
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

module.exports = {
  getConfig,
  readChatIdsEnv,
};
