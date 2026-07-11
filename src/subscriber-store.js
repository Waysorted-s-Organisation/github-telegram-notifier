const { TableClient } = require("@azure/data-tables");

const PARTITION_KEY = "telegram";
const TABLE_NAME = "telegramsubscribers";

function createSubscriberStore(config) {
  const connectionString = process.env.AzureWebJobsStorage || config.azureWebJobsStorage;

  if (!connectionString) {
    throw new Error("Missing AzureWebJobsStorage for subscriber persistence");
  }

  const client = TableClient.fromConnectionString(connectionString, TABLE_NAME);
  let readyPromise;

  async function ensureReady() {
    if (!readyPromise) {
      readyPromise = client.createTable().catch((error) => {
        if (error.statusCode === 409) {
          return;
        }
        throw error;
      });
    }
    return readyPromise;
  }

  return {
    async subscribe(chat) {
      await ensureReady();
      const entity = {
        partitionKey: PARTITION_KEY,
        rowKey: String(chat.id),
        chatId: String(chat.id),
        chatType: chat.type || "private",
        username: chat.username || "",
        firstName: chat.first_name || "",
        lastName: chat.last_name || "",
        title: chat.title || "",
      };
      await client.upsertEntity(entity, "Merge");
      return entity;
    },

    async unsubscribe(chatId) {
      await ensureReady();
      try {
        await client.deleteEntity(PARTITION_KEY, String(chatId));
      } catch (error) {
        if (error.statusCode !== 404) {
          throw error;
        }
      }
    },

    async isSubscribed(chatId) {
      await ensureReady();
      try {
        await client.getEntity(PARTITION_KEY, String(chatId));
        return true;
      } catch (error) {
        if (error.statusCode === 404) {
          return false;
        }
        throw error;
      }
    },

    async listChatIds() {
      await ensureReady();
      const chatIds = [];
      for await (const entity of client.listEntities({
        queryOptions: { filter: `PartitionKey eq '${PARTITION_KEY}'` },
      })) {
        chatIds.push(String(entity.chatId || entity.rowKey));
      }
      return chatIds;
    },
  };
}

module.exports = {
  createSubscriberStore,
};
