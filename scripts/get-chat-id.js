require("dotenv").config();

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in environment");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  if (!response.ok) {
    throw new Error(`Telegram API error ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();
  const latest = body.result.at(-1);
  if (!latest) {
    throw new Error("No updates found. Send a message to your bot on Telegram, then run this again.");
  }

  const chat = latest.message?.chat || latest.channel_post?.chat;
  if (!chat) {
    throw new Error("Could not find a chat in the latest update.");
  }

  console.log(`Chat ID: ${chat.id}`);
  console.log(`Chat Type: ${chat.type}`);
  if (chat.title) {
    console.log(`Chat Title: ${chat.title}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
