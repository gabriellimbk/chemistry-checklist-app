const crypto = require("crypto");

const cookieName = "chemistry_checklist_student_access";
const sessionHours = 12;

function getSecret() {
  const secret = process.env.STUDENT_SESSION_SECRET || process.env.TEACHER_SESSION_SECRET;
  if (!secret) {
    throw new Error("STUDENT_SESSION_SECRET or TEACHER_SESSION_SECRET is not configured");
  }
  return secret;
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

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createStudentToken(studentId) {
  const payload = encodePayload({
    student_id: studentId,
    exp: Date.now() + sessionHours * 60 * 60 * 1000
  });
  return `${payload}.${sign(payload)}`;
}

function getStudentIdFromCookie(req) {
  const token = parseCookies(req)[cookieName];
  if (!token || !token.includes(".")) {
    return "";
  }
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== sign(payload)) {
    return "";
  }
  try {
    const decoded = decodePayload(payload);
    if (!decoded.student_id || Number(decoded.exp) < Date.now()) {
      return "";
    }
    return String(decoded.student_id);
  } catch (error) {
    return "";
  }
}

function studentCookie(studentId, req) {
  const isLocal = /localhost|127\.0\.0\.1/i.test(req.headers.host || "");
  const secure = isLocal ? "" : "; Secure";
  const maxAge = sessionHours * 60 * 60;
  return `${cookieName}=${encodeURIComponent(createStudentToken(studentId))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = { getStudentIdFromCookie, studentCookie };
