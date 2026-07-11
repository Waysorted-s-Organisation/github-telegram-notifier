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

test("returns null for unsupported events", () => {
  const message = buildMessage("issues", {
    action: "opened",
    repository: { full_name: "acme/repo", html_url: "https://github.com/acme/repo" },
    sender: { login: "alice" },
  });
  assert.ok(message.text.includes("issues opened"));
  assert.ok(message.text.includes("acme/repo"));
});
