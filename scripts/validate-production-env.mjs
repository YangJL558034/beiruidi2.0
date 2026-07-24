import fs from "node:fs";
import path from "node:path";

const errors = [];
const required = [
  "NEXT_PUBLIC_SITE_URL",
  "SZA_SESSION_SECRET",
  "SZA_ADMIN_EMAIL",
  "SZA_ADMIN_PASSWORD",
  "SZA_SQLITE_PATH",
];
for (const name of required)
  if (!process.env[name]?.trim()) errors.push(`${name} is required.`);

try {
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const localHost =
    siteUrl.hostname === "127.0.0.1" || siteUrl.hostname === "localhost";
  if (siteUrl.protocol !== "https:" && !localHost)
    errors.push("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
  if (siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash)
    errors.push("NEXT_PUBLIC_SITE_URL must contain only the site origin.");
} catch {
  errors.push("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
}

if (
  (process.env.SZA_SESSION_SECRET ?? "").length < 32 ||
  process.env.SZA_SESSION_SECRET?.startsWith("replace-with-")
)
  errors.push("SZA_SESSION_SECRET must contain at least 32 characters.");
if (
  (process.env.SZA_ADMIN_PASSWORD ?? "").length < 12 ||
  process.env.SZA_ADMIN_PASSWORD === "admin123456"
)
  errors.push(
    "SZA_ADMIN_PASSWORD must contain at least 12 characters and must not use the development default.",
  );
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.SZA_ADMIN_EMAIL ?? "")
)
  errors.push("SZA_ADMIN_EMAIL must be a valid email address.");

for (const origin of (process.env.SZA_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)) {
  try {
    const url = new URL(origin);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.origin !== origin.replace(/\/+$/, "")
    )
      throw new Error("Invalid trusted origin");
  } catch {
    errors.push(`Invalid trusted origin: ${origin}`);
  }
}

if (process.env.SZA_SQLITE_PATH) {
  try {
    const databasePath = path.resolve(process.env.SZA_SQLITE_PATH);
    const publicPath = path.resolve("public");
    if (
      databasePath === publicPath ||
      databasePath.startsWith(publicPath + path.sep)
    )
      throw new Error("Database must not be stored under public");
    if (path.extname(databasePath).toLowerCase() !== ".sqlite")
      throw new Error("Database must use the .sqlite extension");
    const databaseDir = path.dirname(databasePath);
    fs.mkdirSync(databaseDir, { recursive: true });
    fs.accessSync(databaseDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    errors.push(
      "SZA_SQLITE_PATH directory must be readable and writable by the application user.",
    );
  }
}

try {
  const attachmentPath = path.resolve(
    process.env.SZA_SUPPORT_ATTACHMENT_PATH ?? "./data/support-attachments",
  );
  const publicPath = path.resolve("public");
  if (
    attachmentPath === publicPath ||
    attachmentPath.startsWith(publicPath + path.sep)
  )
    throw new Error("Support attachments must not be public");
  fs.mkdirSync(attachmentPath, { recursive: true });
  fs.accessSync(attachmentPath, fs.constants.R_OK | fs.constants.W_OK);
} catch {
  errors.push(
    "SZA_SUPPORT_ATTACHMENT_PATH must be a private readable and writable directory outside public.",
  );
}

if (
  process.env.SZA_REQUIRE_MALWARE_SCAN === "true" &&
  !process.env.SZA_CLAMAV_HOST?.trim()
)
  errors.push(
    "SZA_CLAMAV_HOST is required when SZA_REQUIRE_MALWARE_SCAN=true.",
  );

const smtpHost = process.env.SZA_SMTP_HOST?.trim();
const smtpFrom = process.env.SZA_SMTP_FROM?.trim();
if ((smtpHost && !smtpFrom) || (!smtpHost && smtpFrom))
  errors.push("SZA_SMTP_HOST and SZA_SMTP_FROM must be configured together.");

if (errors.length) {
  console.error(
    "Production environment validation failed:\n- " + errors.join("\n- "),
  );
  process.exit(1);
}
