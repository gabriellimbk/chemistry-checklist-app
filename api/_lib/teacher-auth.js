const crypto = require("crypto");
const { supabaseRequest } = require("./supabase");

const cookieName = "chemistry_checklist_teacher_session";
const sessionHours = 8;

function getSecret() {
  const secret = process.env.TEACHER_SESSION_SECRET;
  if (!secret) {
    throw new Error("TEACHER_SESSION_SECRET is not configured");
  }
  return secret;
}

function hashToken(token) {
  return crypto.createHmac("sha256", getSecret()).update(token).digest("hex");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) {
          return [part, ""];
        }
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function sessionCookie(token, req) {
  const isLocal = /localhost|127\.0\.0\.1/i.test(req.headers.host || "");
  const secure = isLocal ? "" : "; Secure";
  const maxAge = sessionHours * 60 * 60;
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function createTeacherSession(req) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000).toISOString();
  await supabaseRequest("chemistry_checklist_app_teacher_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: {
      session_token_hash: hashToken(token),
      expires_at: expiresAt
    }
  });
  return { token, cookie: sessionCookie(token, req), expiresAt };
}

async function validateTeacherSession(req) {
  const token = parseCookies(req)[cookieName];
  if (!token) {
    return false;
  }

  const rows = await supabaseRequest(
    `chemistry_checklist_app_teacher_sessions?session_token_hash=eq.${encodeURIComponent(hashToken(token))}&select=id,expires_at&limit=1`
  );
  if (!Array.isArray(rows) || !rows.length) {
    return false;
  }
  return new Date(rows[0].expires_at).getTime() > Date.now();
}

module.exports = { createTeacherSession, validateTeacherSession };
