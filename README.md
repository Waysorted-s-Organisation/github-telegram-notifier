# Waysorted GitHub Telegram Notifier

Organization-level GitHub webhook service that sends repository activity to Telegram in real time.

## What it sends

- Push events
- Pull request updates
- Pull request reviews
- Workflow run status updates
- Branch and tag creation/deletion
- Repository creation/changes
- GitHub webhook ping confirmation

## Local setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Create a Telegram bot with `@BotFather` and put the bot token in `.env`.

4. Send your bot a message on Telegram, then fetch the chat ID:

```bash
npm run get-chat-id
```

5. Put the chat ID in `.env`. For multiple recipients, use a comma-separated list in `TELEGRAM_CHAT_IDS`.

6. Set a webhook secret:

```bash
openssl rand -hex 32
```

7. Start the app:

```bash
npm start
```

## Environment variables

```env
PORT=3000
NODE_ENV=development
GITHUB_WEBHOOK_SECRET=replace_me
TELEGRAM_BOT_TOKEN=replace_me
TELEGRAM_CHAT_IDS=replace_me,replace_me_too
INCLUDE_ALL_BRANCHES=false
SKIP_BOTS=true
```

## GitHub webhook

Add an organization webhook in GitHub:

- Payload URL: `https://your-domain.com/github/webhook`
- Content type: `application/json`
- Secret: same value as `GITHUB_WEBHOOK_SECRET`
- SSL verification: enabled

Subscribe to these events:

- Pushes
- Pull requests
- Pull request reviews
- Workflow runs
- Branch or tag creation
- Branch or tag deletion
- Repositories

## Render deployment

This repo includes `render.yaml` and a `Dockerfile`.

1. Push the repo to GitHub.
2. In Render, create a Blueprint from the repository.
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
4. Deploy.
5. Copy the public service URL and use `/github/webhook` as the GitHub org webhook path.
