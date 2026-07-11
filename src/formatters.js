const { getBranchName } = require("./github");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function shortSha(sha = "") {
  return sha.slice(0, 7);
}

function summarizeCommits(commits = []) {
  return commits
    .slice(0, 3)
    .map((commit) => `• <code>${shortSha(commit.id)}</code> ${escapeHtml(commit.message.split("\n")[0])}`)
    .join("\n");
}

function formatPushEvent(payload) {
  const repo = payload.repository.full_name;
  const branch = getBranchName(payload.ref);
  const actor = payload.pusher?.name || payload.sender?.login || "Unknown";
  const compareUrl = payload.compare;
  const commitCount = payload.commits?.length || 0;
  const commitLine = commitCount === 1 ? "1 commit" : `${commitCount} commits`;
  const commitSummary = summarizeCommits(payload.commits || []);
  const createdText = payload.created ? " (new branch push)" : "";

  return {
    text:
      `🚀 <b>Code pushed</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(repo)}</code>\n` +
      `<b>Branch:</b> <code>${escapeHtml(branch)}</code>${createdText}\n` +
      `<b>By:</b> ${escapeHtml(actor)}\n` +
      `<b>Change:</b> ${commitLine}\n` +
      (commitSummary ? `${commitSummary}\n` : "") +
      `<a href="${compareUrl}">View changes</a>`,
  };
}

function formatPullRequestEvent(payload) {
  const pr = payload.pull_request;
  const repo = payload.repository.full_name;
  const action = payload.action;
  const merged = action === "closed" && pr.merged;
  const headline = merged ? "✅ PR merged" : `📣 PR ${escapeHtml(action)}`;

  return {
    text:
      `<b>${headline}</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(repo)}</code>\n` +
      `<b>PR:</b> <a href="${pr.html_url}">#${pr.number} ${escapeHtml(pr.title)}</a>\n` +
      `<b>Author:</b> ${escapeHtml(pr.user.login)}\n` +
      `<b>Base:</b> <code>${escapeHtml(pr.base.ref)}</code>\n` +
      `<b>Head:</b> <code>${escapeHtml(pr.head.ref)}</code>`,
  };
}

function formatPullRequestReviewEvent(payload) {
  const review = payload.review;
  const pr = payload.pull_request;
  const repo = payload.repository.full_name;

  return {
    text:
      `🧾 <b>PR review ${escapeHtml(payload.action)}</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(repo)}</code>\n` +
      `<b>PR:</b> <a href="${pr.html_url}">#${pr.number} ${escapeHtml(pr.title)}</a>\n` +
      `<b>Reviewer:</b> ${escapeHtml(review.user.login)}\n` +
      `<b>State:</b> ${escapeHtml(review.state)}`,
  };
}

function formatWorkflowRunEvent(payload) {
  const workflowRun = payload.workflow_run;
  const repo = payload.repository.full_name;

  return {
    text:
      `⚙️ <b>Workflow ${escapeHtml(payload.action)}</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(repo)}</code>\n` +
      `<b>Name:</b> ${escapeHtml(workflowRun.name)}\n` +
      `<b>Branch:</b> <code>${escapeHtml(workflowRun.head_branch || "unknown")}</code>\n` +
      `<b>Status:</b> ${escapeHtml(workflowRun.status || "unknown")}\n` +
      `<b>Conclusion:</b> ${escapeHtml(workflowRun.conclusion || "pending")}\n` +
      `<a href="${workflowRun.html_url}">View run</a>`,
  };
}

function formatCreateEvent(payload) {
  return {
    text:
      `🌱 <b>${escapeHtml(payload.ref_type)} created</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(payload.repository.full_name)}</code>\n` +
      `<b>Name:</b> <code>${escapeHtml(payload.ref || payload.repository.name)}</code>\n` +
      `<b>By:</b> ${escapeHtml(payload.sender?.login || "Unknown")}`,
  };
}

function formatDeleteEvent(payload) {
  return {
    text:
      `🗑️ <b>${escapeHtml(payload.ref_type)} deleted</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(payload.repository.full_name)}</code>\n` +
      `<b>Name:</b> <code>${escapeHtml(payload.ref)}</code>\n` +
      `<b>By:</b> ${escapeHtml(payload.sender?.login || "Unknown")}`,
  };
}

function formatRepositoryEvent(payload) {
  return {
    text:
      `📦 <b>Repository ${escapeHtml(payload.action)}</b>\n` +
      `<b>Repo:</b> <code>${escapeHtml(payload.repository.full_name)}</code>\n` +
      `<b>Private:</b> ${payload.repository.private ? "yes" : "no"}\n` +
      `<a href="${payload.repository.html_url}">Open repository</a>`,
  };
}

function formatPingEvent(payload) {
  return {
    text:
      `✅ <b>GitHub webhook connected</b>\n` +
      `<b>Hook ID:</b> <code>${escapeHtml(payload.hook_id)}</code>\n` +
      `<b>Target:</b> ${escapeHtml(payload.zen || "Webhook active")}`,
  };
}

function formatGenericEvent(eventName, payload) {
  const repo = payload.repository?.full_name || payload.organization?.login || "unknown";
  const action = payload.action || "updated";
  const actor =
    payload.sender?.login ||
    payload.member?.login ||
    payload.installation?.account?.login ||
    "Unknown";
  const possibleUrl =
    payload.html_url ||
    payload.repository?.html_url ||
    payload.pull_request?.html_url ||
    payload.issue?.html_url ||
    payload.release?.html_url ||
    payload.workflow_run?.html_url ||
    payload.deployment_status?.target_url ||
    payload.check_run?.html_url;

  return {
    text:
      `🔔 <b>${escapeHtml(eventName)} ${escapeHtml(action)}</b>\n` +
      `<b>Repo/Org:</b> <code>${escapeHtml(repo)}</code>\n` +
      `<b>By:</b> ${escapeHtml(actor)}` +
      (possibleUrl ? `\n<a href="${possibleUrl}">Open details</a>` : ""),
  };
}

function buildMessage(eventName, payload) {
  switch (eventName) {
    case "push":
      return formatPushEvent(payload);
    case "pull_request":
      return formatPullRequestEvent(payload);
    case "pull_request_review":
      return formatPullRequestReviewEvent(payload);
    case "workflow_run":
      return formatWorkflowRunEvent(payload);
    case "create":
      return formatCreateEvent(payload);
    case "delete":
      return formatDeleteEvent(payload);
    case "repository":
      return formatRepositoryEvent(payload);
    case "ping":
      return formatPingEvent(payload);
    default:
      return formatGenericEvent(eventName, payload);
  }
}

module.exports = {
  buildMessage,
};
