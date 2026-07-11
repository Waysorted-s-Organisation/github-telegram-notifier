async function sendTelegramMessage({ botToken, chatId, text }) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function sendTelegramMessages({ botToken, chatIds, text }) {
  const results = await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage({ botToken, chatId, text }))
  );

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    throw new Error(
      failures.map((result) => result.reason?.message || "Unknown Telegram delivery failure").join("; ")
    );
  }

  return results.map((result) => result.value);
}

module.exports = {
  sendTelegramMessage,
  sendTelegramMessages,
};
