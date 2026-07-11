const test = require("node:test");
const assert = require("node:assert/strict");

const { buildMessage } = require("../src/formatters");

test("formats push events", () => {
  const payload = {
    ref: "refs/heads/main",
    compare: "https://github.com/acme/repo/compare/a...b",
    repository: { full_name: "acme/repo" },
    pusher: { name: "alice" },
    commits: [
      { id: "1234567890", message: "fix: improve webhook" },
      { id: "abcdef1234", message: "chore: add logs" },
    ],
  };

  const message = buildMessage("push", payload);
  assert.ok(message.text.includes("Code pushed"));
  assert.ok(message.text.includes("acme/repo"));
  assert.ok(message.text.includes("fix: improve webhook"));
});

test("formats issues events", () => {
  const message = buildMessage("issues", {
    action: "opened",
    repository: { full_name: "acme/repo", html_url: "https://github.com/acme/repo" },
    issue: {
      number: 42,
      title: "Webhook bug",
      html_url: "https://github.com/acme/repo/issues/42",
      user: { login: "alice" },
    },
    sender: { login: "alice" },
  });
  assert.ok(message.text.includes("Issue opened"));
  assert.ok(message.text.includes("acme/repo"));
});

test("formats release events", () => {
  const message = buildMessage("release", {
    action: "published",
    repository: { full_name: "acme/repo" },
    release: {
      html_url: "https://github.com/acme/repo/releases/tag/v1.0.0",
      name: "v1.0.0",
      tag_name: "v1.0.0",
    },
  });

  assert.ok(message.text.includes("Release published"));
  assert.ok(message.text.includes("v1.0.0"));
});
