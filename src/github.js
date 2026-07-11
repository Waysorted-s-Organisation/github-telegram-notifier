const crypto = require("node:crypto");

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const actual = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function getBranchName(ref = "") {
  return ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : ref;
}

function isBotSender(login = "") {
  return login.endsWith("[bot]") || login === "web-flow";
}

module.exports = {
  getBranchName,
  isBotSender,
  verifySignature,
};
