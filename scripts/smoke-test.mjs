import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const port = Number(process.env.SMOKE_TEST_PORT ?? 3100);
const base = `http://127.0.0.1:${port}`;
const smokeIp = `2001:db8::${Date.now().toString(16)}`;
const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const buildId = path.join(process.cwd(), ".next", "BUILD_ID");
const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "barryt-smoke-"));
const smokeDatabasePath = path.join(smokeDataDir, "smoke.sqlite");
const smokeAttachmentPath = path.join(smokeDataDir, "support-attachments");
let supportDb;

if (!fs.existsSync(buildId)) {
  console.error("Production build not found. Run npm run build first.");
  process.exit(1);
}

let stdout = "";
let stderr = "";
const server = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      SZA_SQLITE_PATH: smokeDatabasePath,
      SZA_SUPPORT_ATTACHMENT_PATH: smokeAttachmentPath,
      SZA_REQUIRE_MALWARE_SCAN: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
server.stdout.on("data", (chunk) => {
  stdout = (stdout + chunk.toString()).slice(-12_000);
});
server.stderr.on("data", (chunk) => {
  stderr = (stderr + chunk.toString()).slice(-12_000);
});

const results = [];

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
}

async function waitForServer() {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error(`Production server exited with ${server.exitCode}.`);
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Timed out waiting for the production server.");
}

async function request(pathname, expectedStatus = 200, init) {
  const response = await fetch(`${base}${pathname}`, init);
  record(
    `${pathname} returns ${expectedStatus}`,
    response.status === expectedStatus,
    `received ${response.status}`,
  );
  return response;
}

function titleFrom(html) {
  return /<title>(.*?)<\/title>/i.exec(html)?.[1] ?? "";
}

function cookieHeader(response) {
  const values =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie") ?? ""];
  return values
    .filter(Boolean)
    .map((value) => value.split(";")[0])
    .join("; ");
}

function cookieValue(cookie, name) {
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function adminSession(email, role) {
  const secret = process.env.SZA_SESSION_SECRET;
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role,
      expiresAt: Date.now() + 60 * 60_000,
      nonce: crypto.randomUUID(),
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const token = `${payload}.${signature}`;
  const csrf = crypto
    .createHmac("sha256", secret)
    .update(`csrf:${token}`)
    .digest("base64url");
  return {
    cookie: `sza_admin_session=${token}; sza_admin_csrf=${csrf}`,
    csrf,
  };
}

async function run() {
  await waitForServer();

  const health = await request("/api/health");
  const healthBody = await health.json();
  record(
    "health check reports database availability",
    healthBody.ok === true && healthBody.database?.available === true,
  );
  record(
    "health check reports mail delivery readiness",
    typeof healthBody.mail?.configured === "boolean",
  );

  const pagePaths = [
    "/en",
    "/cn",
    "/en/products",
    "/cn/products",
    "/en/shop",
    "/cn/shop",
    "/en/news",
    "/cn/news",
    "/en/services",
    "/cn/services",
    "/en/cases",
    "/cn/cases",
    "/en/faq",
    "/cn/faq",
    "/en/about",
    "/cn/about",
    "/en/support",
    "/cn/support",
    "/en/contact",
    "/cn/contact",
    "/en/privacy",
    "/cn/privacy",
    "/en/terms",
    "/cn/terms",
  ];
  for (const pathname of pagePaths) {
    const response = await request(pathname);
    const html = await response.text();
    record(`${pathname} has BarryT title`, titleFrom(html).includes("BarryT"));
    record(
      `${pathname} has canonical metadata`,
      /rel="canonical"/i.test(html),
    );
  }
  const englishTermsResponse = await request("/en/terms");
  const englishTermsHtml = await englishTermsResponse.text();
  record(
    "English terms page has an English browser title",
    titleFrom(englishTermsHtml).startsWith("Terms of Use"),
    titleFrom(englishTermsHtml),
  );
  record(
    "English terms page declares English canonical and hreflang",
    /rel="canonical" href="[^"]*\/en\/terms"/i.test(englishTermsHtml) &&
      /hreflang="zh-CN"/i.test(englishTermsHtml),
  );
  const chineseTermsResponse = await request("/cn/terms");
  const chineseTermsHtml = await chineseTermsResponse.text();
  record(
    "Chinese terms page has a Chinese browser title",
    titleFrom(chineseTermsHtml).startsWith("使用条款"),
    titleFrom(chineseTermsHtml),
  );

  for (const [pathname, schemaType] of [
    ["/en/services", '"@type":"Service"'],
    ["/en/cases", '"@type":"CollectionPage"'],
    ["/en/faq", '"@type":"FAQPage"'],
    ["/en/support", '"@type":"FAQPage"'],
  ]) {
    const response = await request(pathname);
    const html = await response.text();
    record(`${pathname} includes ${schemaType}`, html.includes(schemaType));
    record(
      `${pathname} includes breadcrumb structured data`,
      html.includes('"@type":"BreadcrumbList"'),
    );
  }

  const productsResponse = await request("/api/products?locale=en");
  const { products } = await productsResponse.json();
  record("products API returns published data", Array.isArray(products) && products.length > 0);
  for (const product of products) {
    const response = await request(`/en/products/${encodeURIComponent(product.slug)}`);
    const html = await response.text();
    record(
      `product ${product.slug} has product structured data`,
      html.includes('"@type":"Product"'),
    );
  }

  const postsResponse = await request("/api/posts?locale=en");
  const { posts } = await postsResponse.json();
  record("posts API returns published data", Array.isArray(posts) && posts.length > 0);
  for (const post of posts) {
    const response = await request(`/en/news/${encodeURIComponent(post.slug)}`);
    const html = await response.text();
    record(
      `article ${post.slug} has article structured data`,
      html.includes('"@type":"Article"'),
    );
  }

  const root = await request("/cn");
  const requiredHeaders = [
    "content-security-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "permissions-policy",
    "referrer-policy",
    "x-content-type-options",
    "x-frame-options",
  ];
  for (const header of requiredHeaders)
    record(`security header ${header}`, Boolean(root.headers.get(header)));

  for (const [pathname, location] of [
    ["/admin", "/admin/login?next=%2Fadmin"],
    ["/cn/admin", "/admin"],
    ["/en/admin", "/admin"],
    ["/cn/admin/login", "/admin/login"],
  ]) {
    const response = await request(pathname, 307, { redirect: "manual" });
    record(
      `${pathname} redirects to protected canonical path`,
      response.headers.get("location") === location,
      response.headers.get("location") ?? "missing location",
    );
  }

  const adminLogin = await request("/admin/login");
  const adminHtml = await adminLogin.text();
  record("admin pages are noindex", /name="robots" content="noindex/i.test(adminHtml));
  for (const [pathname, expectedText] of [
    ["/cn/account/login", "登录账户"],
    ["/cn/account/register", "创建账户"],
    ["/en/account/login", "Sign in"],
    ["/en/account/register", "Create your account"],
  ]) {
    const response = await request(pathname);
    const html = await response.text();
    record(
      `${pathname} renders the customer authentication flow`,
      html.includes(expectedText),
    );
    record(
      `${pathname} is excluded from search indexing`,
      /name="robots" content="noindex/i.test(html),
    );
  }
  const captchaResponse = await request("/api/auth/captcha");
  const captchaBody = await captchaResponse.json();
  record(
    "captcha API returns an id and an image",
    typeof captchaBody.id === "string" &&
      captchaBody.id.length > 0 &&
      typeof captchaBody.image === "string" &&
      captchaBody.image.startsWith("data:image/"),
  );
  const invalidCaptchaLogin = await request("/api/auth/login", 400, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
    },
    body: JSON.stringify({
      email: "admin@sza-power.com",
      password: "not-a-real-password",
      captchaId: captchaBody.id,
      captcha: "WRONG",
    }),
  });
  const invalidCaptchaBody = await invalidCaptchaLogin.json();
  record(
    "invalid captcha response requests a safe refresh",
    invalidCaptchaBody.refreshCaptcha === true &&
      typeof invalidCaptchaBody.error === "string",
  );
  await request("/api/admin/products", 401);

  await request("/api/customer/auth/session");
  await fetch(`${base}/api/customer/auth/request-code`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({
      email: "schema-init@example.com",
      purpose: "register",
      locale: "en",
    }),
  });
  supportDb = new DatabaseSync(smokeDatabasePath);
  const customerEmail = `customer-${Date.now()}@example.com`;
  const verificationStamp = new Date().toISOString();
  const registrationCaptchaResponse = await request(
    "/api/auth/captcha?mode=numeric",
  );
  const registrationCaptcha = await registrationCaptchaResponse.json();
  const registrationCaptchaSvg = Buffer.from(
    String(registrationCaptcha.image).split(",")[1],
    "base64",
  ).toString("utf8");
  const registrationCaptchaAnswer =
    registrationCaptchaSvg.match(/>(\d{6})<\/text>/)?.[1] ?? "";
  record(
    "registration captcha is generated as six digits",
    /^\d{6}$/.test(registrationCaptchaAnswer),
  );
  const rejectedRegistration = await request(
    "/api/customer/auth/register",
    400,
    {
      method: "POST",
      headers: { "content-type": "application/json", origin: base },
      body: JSON.stringify({
        email: `rejected-${Date.now()}@example.com`,
        password: "Customer-test-password-2026",
        captchaId: registrationCaptcha.id,
        captcha:
          registrationCaptchaAnswer === "000000" ? "111111" : "000000",
        consent: true,
      }),
    },
  );
  const rejectedRegistrationBody = await rejectedRegistration.json();
  record(
    "incorrect registration captcha is rejected and requires refresh",
    rejectedRegistrationBody.refreshCaptcha === true,
  );
  const validRegistrationCaptchaResponse = await request(
    "/api/auth/captcha?mode=numeric",
  );
  const validRegistrationCaptcha = await validRegistrationCaptchaResponse.json();
  const validRegistrationCaptchaSvg = Buffer.from(
    String(validRegistrationCaptcha.image).split(",")[1],
    "base64",
  ).toString("utf8");
  const validRegistrationCaptchaAnswer =
    validRegistrationCaptchaSvg.match(/>(\d{6})<\/text>/)?.[1] ?? "";
  const register = await request("/api/customer/auth/register", 201, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({
      name: "Smoke Customer",
      email: customerEmail,
      password: "Customer-test-password-2026",
      captchaId: validRegistrationCaptcha.id,
      captcha: validRegistrationCaptchaAnswer,
      consent: true,
    }),
  });
  const customerCookie = cookieHeader(register);
  const customerCsrf = decodeURIComponent(
    cookieValue(customerCookie, "sza_customer_csrf") ?? "",
  );
  record(
    "customer registration issues an authenticated session and CSRF token",
    customerCookie.includes("sza_customer_session=") &&
      customerCsrf.length >= 32,
  );
  const unverifiedCustomer = supportDb
    .prepare("SELECT email_verified_at FROM customers WHERE email=?")
    .get(customerEmail);
  record(
    "numeric-captcha registration does not falsely mark email as verified",
    unverifiedCustomer?.email_verified_at === "",
  );
  const customerSessionResponse = await request(
    "/api/customer/auth/session",
    200,
    { headers: { cookie: customerCookie } },
  );
  const customerSessionBody = await customerSessionResponse.json();
  record(
    "customer session returns only the authenticated account",
    customerSessionBody.authenticated === true &&
      customerSessionBody.customer?.email === customerEmail &&
      !JSON.stringify(customerSessionBody).includes("password_hash"),
  );
  await request("/api/customer/inquiry-bag", 401);
  const bagProduct = supportDb
    .prepare(
      "SELECT id FROM products WHERE status='published' AND shop_enabled=1 AND inventory_status!='out_of_stock' ORDER BY id LIMIT 1",
    )
    .get();
  await request("/api/customer/inquiry-bag", 403, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: customerCookie,
    },
    body: JSON.stringify({
      items: [{ productId: Number(bagProduct.id), quantity: 2 }],
    }),
  });
  const saveBag = await request("/api/customer/inquiry-bag", 200, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: customerCookie,
      "x-sza-customer-csrf": customerCsrf,
    },
    body: JSON.stringify({
      items: [{ productId: Number(bagProduct.id), quantity: 2 }],
    }),
  });
  record(
    "authenticated customer can persist an account-bound inquiry bag",
    (await saveBag.json()).items?.[0]?.quantity === 2,
  );
  const readBag = await request("/api/customer/inquiry-bag", 200, {
    headers: { cookie: customerCookie },
  });
  record(
    "customer inquiry bag persists across requests",
    (await readBag.json()).items?.[0]?.productId === Number(bagProduct.id),
  );
  const conversationResponse = await request(
    "/api/customer/conversations",
    201,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: base,
        cookie: customerCookie,
        "x-sza-customer-csrf": customerCsrf,
      },
      body: JSON.stringify({ subject: "Smoke support chat" }),
    },
  );
  const conversationBody = await conversationResponse.json();
  const conversationId = conversationBody.conversation?.id;
  record(
    "customer can create a persistent support conversation",
    Number.isInteger(conversationId) && conversationId > 0,
  );
  await request(
    `/api/customer/conversations/${conversationId}/messages`,
    201,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: base,
        cookie: customerCookie,
        "x-sza-customer-csrf": customerCsrf,
      },
      body: JSON.stringify({ body: "I need product support." }),
    },
  );
  const attachmentForm = new FormData();
  attachmentForm.set(
    "file",
    new Blob([
      Uint8Array.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
      ]),
    ], { type: "image/png" }),
    "product-proof.png",
  );
  const attachmentResponse = await request(
    `/api/customer/conversations/${conversationId}/attachments`,
    201,
    {
      method: "POST",
      headers: {
        origin: base,
        cookie: customerCookie,
        "x-sza-customer-csrf": customerCsrf,
      },
      body: attachmentForm,
    },
  );
  const attachmentBody = await attachmentResponse.json();
  const attachmentId = attachmentBody.attachment?.id;
  record(
    "customer attachment is validated and stored outside public",
    Number.isInteger(attachmentId) &&
      fs.readdirSync(smokeAttachmentPath).length === 1,
  );
  await request(`/api/support/attachments/${attachmentId}`, 404);
  const authorizedAttachment = await request(
    `/api/support/attachments/${attachmentId}`,
    200,
    { headers: { cookie: customerCookie } },
  );
  record(
    "authorized attachment download is private and non-cacheable",
    authorizedAttachment.headers.get("cache-control")?.includes("no-store") ===
      true,
  );
  await authorizedAttachment.arrayBuffer();

  const ownerAuth = adminSession(process.env.SZA_ADMIN_EMAIL, "owner");
  const defaultMailSettingsResponse = await request("/api/admin/system", 200, {
    headers: { cookie: ownerAuth.cookie },
  });
  const defaultMailSettings = (await defaultMailSettingsResponse.json())
    .settings;
  record(
    "mail settings default to the NetEase 163 SMTP preset",
    defaultMailSettings?.smtpProvider === "163" &&
      defaultMailSettings?.smtpHost === "smtp.163.com" &&
      defaultMailSettings?.smtpPort === 465,
  );
  const qqMailSettingsResponse = await request("/api/admin/system", 200, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: ownerAuth.cookie,
      "x-sza-csrf": ownerAuth.csrf,
    },
    body: JSON.stringify({
      ...defaultMailSettings,
      smtpProvider: "qq",
      smtpHost: "untrusted.example.com",
      smtpPort: 2525,
    }),
  });
  const qqMailSettings = (await qqMailSettingsResponse.json()).settings;
  record(
    "QQ mail preset enforces the official SMTP host and secure port",
    qqMailSettings?.smtpProvider === "qq" &&
      qqMailSettings?.smtpHost === "smtp.qq.com" &&
      qqMailSettings?.smtpPort === 465,
  );
  const staffListResponse = await request("/api/admin/support", 200, {
    headers: { cookie: ownerAuth.cookie },
  });
  const staffListBody = await staffListResponse.json();
  record(
    "support supervisor workspace receives waiting customer conversations",
    staffListBody.conversations?.some(
      (item) => item.id === conversationId && item.status === "waiting",
    ),
  );
  const salesEmail = `sales-${Date.now()}@example.com`;
  const salesResult = supportDb
    .prepare(
      "INSERT INTO admins (email,password_hash,role,display_name,active,must_change_password,created_at,updated_at) VALUES (?,?,?,?,1,0,?,?)",
    )
    .run(
      salesEmail,
      "test-only-not-login-capable",
      "sales",
      "Smoke Sales",
      verificationStamp,
      verificationStamp,
    );
  const salesId = Number(salesResult.lastInsertRowid);
  const salesAuth = adminSession(salesEmail, "sales");
  const salesBefore = await request("/api/admin/support", 200, {
    headers: { cookie: salesAuth.cookie },
  });
  record(
    "sales role cannot see unassigned conversations",
    (await salesBefore.json()).conversations?.length === 0,
  );
  await request("/api/admin/support", 200, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: ownerAuth.cookie,
      "x-sza-csrf": ownerAuth.csrf,
    },
    body: JSON.stringify({
      action: "assign",
      conversationId,
      toAdminId: salesId,
    }),
  });
  const salesAfter = await request("/api/admin/support", 200, {
    headers: { cookie: salesAuth.cookie },
  });
  record(
    "assigned sales role sees only its assigned conversation",
    (await salesAfter.json()).conversations?.some(
      (item) => item.id === conversationId,
    ),
  );
  await request("/api/admin/support", 201, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: salesAuth.cookie,
      "x-sza-csrf": salesAuth.csrf,
    },
    body: JSON.stringify({
      action: "message",
      conversationId,
      body: "Support reply from assigned sales.",
    }),
  });
  const customerMessages = await request(
    `/api/customer/conversations/${conversationId}/messages`,
    200,
    { headers: { cookie: customerCookie } },
  );
  record(
    "customer receives staff reply in persistent history",
    (await customerMessages.json()).messages?.some(
      (item) => item.body === "Support reply from assigned sales.",
    ),
  );
  await request("/api/admin/support", 200, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: salesAuth.cookie,
      "x-sza-csrf": salesAuth.csrf,
    },
    body: JSON.stringify({
      action: "status",
      conversationId,
      status: "closed",
    }),
  });
  const completedConversations = await request(
    "/api/admin/support?status=closed",
    200,
    { headers: { cookie: salesAuth.cookie } },
  );
  record(
    "assigned sales can mark a conversation completed and find it in the completed list",
    (await completedConversations.json()).conversations?.some(
      (item) => item.id === conversationId && item.status === "closed",
    ),
  );
  const exportResponse = await request("/api/customer/data", 200, {
    headers: { cookie: customerCookie },
  });
  record(
    "customer can export account and conversation data",
    exportResponse.headers
      .get("content-disposition")
      ?.includes("barryt-customer-") === true,
  );
  const exportBody = JSON.parse(await exportResponse.text());
  record(
    "customer data export includes the account-bound inquiry bag",
    exportBody.inquiryBag?.[0]?.quantity === 2,
  );
  const backupResponse = await request("/api/admin/backup", 201, {
    method: "POST",
    headers: {
      origin: base,
      cookie: ownerAuth.cookie,
      "x-sza-csrf": ownerAuth.csrf,
    },
  });
  const backupBody = await backupResponse.json();
  record(
    "backup includes private support attachment snapshot",
    backupBody.backup?.attachmentFiles === 1,
  );
  supportDb.close();
  supportDb = null;
  await request("/api/admin/backup", 200, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: ownerAuth.cookie,
      "x-sza-csrf": ownerAuth.csrf,
    },
    body: JSON.stringify({
      file: backupBody.backup.name,
      confirm: "RESTORE",
    }),
  });
  const restoredAttachment = await request(
    `/api/support/attachments/${attachmentId}`,
    200,
    { headers: { cookie: customerCookie } },
  );
  await restoredAttachment.arrayBuffer();
  record(
    "backup restore recovers the database and private attachments",
    fs.readdirSync(smokeAttachmentPath).length === 1,
  );
  const deleteResponse = await request("/api/customer/data", 200, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: customerCookie,
      "x-sza-customer-csrf": customerCsrf,
    },
    body: JSON.stringify({
      confirm: ` ${customerEmail.toUpperCase()} `,
    }),
  });
  record(
    "customer can permanently delete the account with normalized email confirmation",
    (await deleteResponse.json()).ok === true &&
      fs.readdirSync(smokeAttachmentPath).length === 0,
  );
  const deletedSession = await request("/api/customer/auth/session", 200, {
    headers: { cookie: customerCookie },
  });
  record(
    "deleted customer session can no longer access the account",
    (await deletedSession.json()).authenticated === false,
  );
  await request(`/api/support/attachments/${attachmentId}`, 404, {
    headers: { cookie: customerCookie },
  });
  await request("/api/inquiries", 400, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": smokeIp,
    },
    body: JSON.stringify({ name: "", email: "invalid", message: "" }),
  });
  await request("/api/inquiries", 400, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      "x-forwarded-for": smokeIp,
    },
    body: JSON.stringify({
      name: "Consent validation",
      email: "qa@example.com",
      message: "This request must not be stored without consent.",
    }),
  });
  const search = await request("/api/search?q=USB-C&locale=cn");
  const searchBody = await search.json();
  record(
    "search API returns matching content",
    searchBody.products?.length > 0 || searchBody.posts?.length > 0,
  );

  const sitemap = await request("/sitemap.xml");
  const sitemapText = await sitemap.text();
  record("sitemap includes localized products", sitemapText.includes("/en/products/"));
  const robots = await request("/robots.txt");
  const robotsText = await robots.text();
  record("robots excludes admin and API", robotsText.includes("Disallow: /admin") && robotsText.includes("Disallow: /api"));
  record(
    "robots explicitly permits major AI search crawlers",
    robotsText.includes("OAI-SearchBot") &&
      robotsText.includes("ClaudeBot") &&
      robotsText.includes("PerplexityBot"),
  );
  const llms = await request("/llms.txt");
  const llmsText = await llms.text();
  record(
    "llms.txt identifies official products, services, and citation limits",
    llmsText.includes("SZA POWER") &&
      llmsText.includes("/en/services") &&
      llmsText.includes("Do not infer fixed prices"),
  );

  for (const [pathname, location] of [
    ["/cn/blog", "/cn/news"],
    ["/en/product", "/en/products"],
  ]) {
    const response = await request(pathname, 308, { redirect: "manual" });
    record(
      `${pathname} redirects to the canonical route`,
      response.headers.get("location") === location,
      response.headers.get("location") ?? "missing location",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const video = fs
    .readdirSync(uploadsDir)
    .find((name) => /\.(?:mp4|webm|ogg)$/i.test(name));
  if (video) {
    const response = await request(
      `/api/media/${encodeURIComponent(video)}`,
      206,
      { headers: { range: "bytes=0-1023" } },
    );
    record(
      "media endpoint supports byte ranges",
      response.headers.get("content-range")?.startsWith("bytes 0-1023/") === true &&
        Number(response.headers.get("content-length")) === 1024,
    );
    await response.arrayBuffer();
  }

  const failures = results.filter((result) => !result.passed);
  console.log(
    JSON.stringify(
      {
        passed: results.length - failures.length,
        failed: failures.length,
        failures,
      },
      null,
      2,
    ),
  );
  if (failures.length) process.exitCode = 1;
}

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (server.exitCode === null) server.kill();
  await new Promise((resolve) => {
    if (server.exitCode !== null) return resolve();
    const timer = setTimeout(resolve, 3_000);
    server.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  if (process.exitCode) {
    if (stdout.trim()) console.error(`\nServer stdout:\n${stdout.trim()}`);
    if (stderr.trim()) console.error(`\nServer stderr:\n${stderr.trim()}`);
  }
  try {
    supportDb?.close();
  } catch {}
  fs.rmSync(smokeDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
