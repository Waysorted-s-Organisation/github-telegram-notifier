const BALANCED_IGNORED_EVENTS = new Set([
  "watch",
  "public",
  "page_build",
  "project",
  "project_card",
  "project_column",
  "label",
  "milestone",
  "org_block",
  "team",
  "team_add",
  "membership",
  "member",
  "meta",
]);

function shouldIgnoreForNoise(eventName, payload, mode) {
  if (mode === "off") {
    return null;
  }

  if (eventName === "ping") {
    return null;
  }

  if (BALANCED_IGNORED_EVENTS.has(eventName)) {
    return `Ignoring low-signal event: ${eventName}`;
  }

  if (eventName === "repository" && ["edited", "renamed"].includes(payload.action)) {
    return `Ignoring low-signal repository action: ${payload.action}`;
  }

  if (eventName === "pull_request_review_comment" && payload.action === "created") {
    return null;
  }

  if (eventName === "issues" && ["opened", "closed", "reopened"].includes(payload.action)) {
    return null;
  }

  if (eventName === "issue_comment" && payload.action === "created") {
    return null;
  }

  return null;
}

module.exports = {
  shouldIgnoreForNoise,
};
