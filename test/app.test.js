const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldIgnoreEvent } = require("../src/app");

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
