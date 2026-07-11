require("dotenv").config();

const { createApp } = require("./app");
const { getConfig } = require("./config");

const config = getConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`GitHub notifier listening on port ${config.port}`);
});
