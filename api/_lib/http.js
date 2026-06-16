function sendJson(res, statusCode, payload, headers = {}) {
  res.statusCode = statusCode;
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, details) {
  const payload = { error: message };
  if (details) {
    payload.details = details;
  }
  sendJson(res, statusCode, payload);
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function methodNotAllowed(res, allowed = "GET") {
  res.setHeader("Allow", allowed);
  sendError(res, 405, "Method not allowed");
}

module.exports = { methodNotAllowed, readJson, sendError, sendJson };
