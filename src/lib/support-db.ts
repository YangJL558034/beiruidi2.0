import crypto from "node:crypto";
import type { AdminRole } from "@/lib/content-types";
import { getDatabaseConnection } from "@/lib/db";
import { hashOpaqueToken } from "@/lib/customer-session";
import type {
  CustomerAccount,
  QuickReply,
  SupportAttachment,
  SupportConversation,
  SupportMessage,
  SupportNote,
  SupportStaff,
} from "@/lib/support-types";

type Row = Record<string, string | number | null>;
type ConversationStatus = SupportConversation["status"];
type SenderType = SupportMessage["senderType"];

const MAX_PASSWORD_LENGTH = 512;
const MIN_CUSTOMER_PASSWORD_LENGTH = 10;

function now() {
  return new Date().toISOString();
}

function text(row: Row, key: string) {
  return String(row[key] ?? "");
}

function number(row: Row, key: string) {
  return Number(row[key] ?? 0);
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function ensure() {
  const database = getDatabaseConnection();
  const root = globalThis as typeof globalThis & {
    __szaSupportDbReady?: boolean;
  };
  if (root.__szaSupportDbReady) return database;
  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      email_verified_at TEXT NOT NULL,
      privacy_consent_at TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_inquiry_bag (
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(customer_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS support_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      subject TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'waiting',
      assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      customer_unread INTEGER NOT NULL DEFAULT 0,
      staff_unread INTEGER NOT NULL DEFAULT 0,
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      uploaded_by_type TEXT NOT NULL,
      uploaded_by_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      storage_name TEXT UNIQUE NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      scan_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      sender_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      sender_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      body TEXT NOT NULL DEFAULT '',
      message_type TEXT NOT NULL DEFAULT 'text',
      attachment_id INTEGER REFERENCES support_attachments(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      from_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      to_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      actor_admin_id INTEGER NOT NULL REFERENCES admins(id),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      author_admin_id INTEGER NOT NULL REFERENCES admins(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_conversation_tags (
      conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES support_tags(id) ON DELETE CASCADE,
      PRIMARY KEY(conversation_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS support_quick_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES admins(id),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_staff_presence (
      admin_id INTEGER PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'offline',
      last_seen_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_type TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL DEFAULT 0,
      detail TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(token_hash, expires_at);
    CREATE INDEX IF NOT EXISTS idx_customer_inquiry_bag_updated ON customer_inquiry_bag(customer_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_verification_email ON customer_verification_codes(email, purpose, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_support_customer ON support_conversations(customer_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_support_assignment ON support_conversations(assigned_admin_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_support_messages ON support_messages(conversation_id, id);
    CREATE INDEX IF NOT EXISTS idx_support_attachment_conversation ON support_attachments(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_support_audit_created ON support_audit_logs(created_at DESC);
  `);
  const adminColumns = database
    .prepare("PRAGMA table_info(admins)")
    .all() as Array<{ name: string }>;
  if (!adminColumns.some((column) => column.name === "display_name"))
    database.exec(
      "ALTER TABLE admins ADD COLUMN display_name TEXT NOT NULL DEFAULT '';",
    );
  if (!adminColumns.some((column) => column.name === "active"))
    database.exec(
      "ALTER TABLE admins ADD COLUMN active INTEGER NOT NULL DEFAULT 1;",
    );
  if (!adminColumns.some((column) => column.name === "must_change_password"))
    database.exec(
      "ALTER TABLE admins ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;",
    );
  root.__szaSupportDbReady = true;
  return database;
}

export function hashPassword(password: string) {
  if (
    password.length < MIN_CUSTOMER_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  )
    throw new Error(`密码长度必须为 ${MIN_CUSTOMER_PASSWORD_LENGTH} 至 ${MAX_PASSWORD_LENGTH} 个字符。`);
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto
    .scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
    .toString("hex");
  return `scrypt$16384$8$1$${salt}$${digest}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt$") || password.length > MAX_PASSWORD_LENGTH)
    return false;
  const [, n, r, p, salt, expected] = stored.split("$");
  if (!n || !r || !p || !salt || !expected) return false;
  const actual = crypto
    .scryptSync(password, salt, 32, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
    .toString("hex");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  );
}

function mapCustomer(row: Row): CustomerAccount {
  return {
    id: number(row, "id"),
    email: text(row, "email"),
    name: text(row, "name"),
    status: (["disabled", "pending_deletion"].includes(text(row, "status"))
      ? text(row, "status")
      : "active") as CustomerAccount["status"],
    emailVerifiedAt: text(row, "email_verified_at"),
    privacyConsentAt: text(row, "privacy_consent_at"),
    mustChangePassword: number(row, "must_change_password") === 1,
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

export function getCustomerByEmail(email: string) {
  const row = ensure()
    .prepare("SELECT * FROM customers WHERE email = ? LIMIT 1")
    .get(email.trim().toLowerCase()) as Row | undefined;
  return row ? mapCustomer(row) : null;
}

export function getCustomerById(id: number) {
  const row = ensure()
    .prepare("SELECT * FROM customers WHERE id = ? LIMIT 1")
    .get(id) as Row | undefined;
  return row ? mapCustomer(row) : null;
}

export function createVerificationCode(
  email: string,
  purpose: "register" | "login",
  code: string,
  minutes = 10,
) {
  const database = ensure();
  const normalized = email.trim().toLowerCase();
  database
    .prepare(
      "UPDATE customer_verification_codes SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL",
    )
    .run(now(), normalized, purpose);
  database
    .prepare(
      "INSERT INTO customer_verification_codes (email,purpose,code_hash,expires_at,created_at) VALUES (?,?,?,?,?)",
    )
    .run(
      normalized,
      purpose,
      hashOpaqueToken(`${normalized}:${code}`),
      new Date(Date.now() + minutes * 60_000).toISOString(),
      now(),
    );
}

export function consumeVerificationCode(
  email: string,
  purpose: "register" | "login",
  code: string,
) {
  const database = ensure();
  const normalized = email.trim().toLowerCase();
  const row = database
    .prepare(
      "SELECT * FROM customer_verification_codes WHERE email = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
    )
    .get(normalized, purpose) as Row | undefined;
  if (!row || text(row, "expires_at") <= now() || number(row, "attempts") >= 5)
    return false;
  const expected = text(row, "code_hash");
  const actual = hashOpaqueToken(`${normalized}:${code}`);
  const valid =
    actual.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  if (!valid) {
    database
      .prepare(
        "UPDATE customer_verification_codes SET attempts = attempts + 1 WHERE id = ?",
      )
      .run(number(row, "id"));
    return false;
  }
  database
    .prepare(
      "UPDATE customer_verification_codes SET used_at = ? WHERE id = ?",
    )
    .run(now(), number(row, "id"));
  return true;
}

export function createCustomer(input: {
  email: string;
  password: string;
  name: string;
  emailVerified?: boolean;
}) {
  const database = ensure();
  const stamp = now();
  const result = database
    .prepare(
      "INSERT INTO customers (email,password_hash,name,email_verified_at,privacy_consent_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
      clean(input.name, 120),
      input.emailVerified === false ? "" : stamp,
      stamp,
      stamp,
      stamp,
    );
  return getCustomerById(Number(result.lastInsertRowid));
}

export function authenticateCustomer(email: string, password: string) {
  const row = ensure()
    .prepare("SELECT * FROM customers WHERE email = ? LIMIT 1")
    .get(email.trim().toLowerCase()) as Row | undefined;
  if (
    !row ||
    text(row, "status") !== "active" ||
    !verifyPassword(password, text(row, "password_hash"))
  )
    return null;
  return mapCustomer(row);
}

export function markCustomerLogin(customerId: number) {
  const stamp = now();
  ensure()
    .prepare(
      "UPDATE customers SET last_login_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(stamp, stamp, customerId);
}

export type CustomerInquiryBagLine = {
  productId: number;
  quantity: number;
};

export function getCustomerInquiryBag(
  customerId: number,
): CustomerInquiryBagLine[] {
  return (
    ensure()
      .prepare(
        `SELECT bag.product_id,bag.quantity
         FROM customer_inquiry_bag bag
         JOIN products product ON product.id=bag.product_id
         WHERE bag.customer_id=?
           AND product.status='published'
           AND product.shop_enabled=1
           AND product.inventory_status!='out_of_stock'
         ORDER BY bag.updated_at DESC,bag.product_id`,
      )
      .all(customerId) as Row[]
  ).map((row) => ({
    productId: number(row, "product_id"),
    quantity: number(row, "quantity"),
  }));
}

export function replaceCustomerInquiryBag(
  customerId: number,
  input: CustomerInquiryBagLine[],
) {
  const database = ensure();
  const normalized = Array.from(
    input.reduce((items, line) => {
      const productId = Number(line.productId);
      const quantity = Number(line.quantity);
      if (
        Number.isInteger(productId) &&
        productId > 0 &&
        Number.isInteger(quantity) &&
        quantity > 0
      )
        items.set(productId, Math.min(999, quantity));
      return items;
    }, new Map<number, number>()),
  ).slice(0, 50);
  const validProduct = database.prepare(
    `SELECT id FROM products
     WHERE id=? AND status='published' AND shop_enabled=1
       AND inventory_status!='out_of_stock'`,
  );
  const stamp = now();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare("DELETE FROM customer_inquiry_bag WHERE customer_id=?")
      .run(customerId);
    const insert = database.prepare(
      `INSERT INTO customer_inquiry_bag
       (customer_id,product_id,quantity,created_at,updated_at)
       VALUES (?,?,?,?,?)`,
    );
    for (const [productId, quantity] of normalized) {
      if (validProduct.get(productId))
        insert.run(customerId, productId, quantity, stamp, stamp);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return getCustomerInquiryBag(customerId);
}

export function createCustomerSession(input: {
  customerId: number;
  token: string;
  maxAgeSeconds: number;
  ip: string;
  userAgent: string;
}) {
  ensure()
    .prepare(
      "INSERT INTO customer_sessions (customer_id,token_hash,expires_at,last_seen_at,ip,user_agent,created_at) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      input.customerId,
      hashOpaqueToken(input.token),
      new Date(Date.now() + input.maxAgeSeconds * 1000).toISOString(),
      now(),
      clean(input.ip, 64),
      clean(input.userAgent, 400),
      now(),
    );
}

export function customerForSession(token: string) {
  if (!token) return null;
  const database = ensure();
  const row = database
    .prepare(
      `SELECT c.* FROM customer_sessions s
       JOIN customers c ON c.id=s.customer_id
       WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND c.status='active'
       LIMIT 1`,
    )
    .get(hashOpaqueToken(token), now()) as Row | undefined;
  if (!row) return null;
  database
    .prepare(
      "UPDATE customer_sessions SET last_seen_at = ? WHERE token_hash = ?",
    )
    .run(now(), hashOpaqueToken(token));
  return mapCustomer(row);
}

export function revokeCustomerSession(token: string) {
  if (!token) return;
  ensure()
    .prepare(
      "UPDATE customer_sessions SET revoked_at = ? WHERE token_hash = ?",
    )
    .run(now(), hashOpaqueToken(token));
}

export function createCustomerPasswordReset(customerId: number, token: string) {
  const database = ensure();
  database
    .prepare(
      "UPDATE customer_password_resets SET used_at=? WHERE customer_id=? AND used_at IS NULL",
    )
    .run(now(), customerId);
  database
    .prepare(
      "INSERT INTO customer_password_resets (customer_id,token_hash,expires_at,created_at) VALUES (?,?,?,?)",
    )
    .run(
      customerId,
      hashOpaqueToken(token),
      new Date(Date.now() + 30 * 60_000).toISOString(),
      now(),
    );
}

export function resetCustomerPassword(token: string, password: string) {
  const database = ensure();
  const row = database
    .prepare(
      "SELECT * FROM customer_password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>? LIMIT 1",
    )
    .get(hashOpaqueToken(token), now()) as Row | undefined;
  if (!row) return false;
  const customerId = number(row, "customer_id");
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        "UPDATE customers SET password_hash=?,must_change_password=0,updated_at=? WHERE id=?",
      )
      .run(hashPassword(password), now(), customerId);
    database
      .prepare(
        "UPDATE customer_password_resets SET used_at=? WHERE id=?",
      )
      .run(now(), number(row, "id"));
    database
      .prepare(
        "UPDATE customer_sessions SET revoked_at=? WHERE customer_id=? AND revoked_at IS NULL",
      )
      .run(now(), customerId);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function setCustomerTemporaryPassword(
  email: string,
  temporaryPassword: string,
) {
  const customer = getCustomerByEmail(email);
  if (!customer) throw new Error("客户账号不存在。");
  if (temporaryPassword.length < 12)
    throw new Error("一次性临时密码至少需要 12 个字符。");
  ensure()
    .prepare(
      "UPDATE customers SET password_hash=?,must_change_password=1,updated_at=? WHERE id=?",
    )
    .run(hashPassword(temporaryPassword), now(), customer.id);
  ensure()
    .prepare(
      "UPDATE customer_sessions SET revoked_at=? WHERE customer_id=? AND revoked_at IS NULL",
    )
    .run(now(), customer.id);
}

export function changeCustomerPassword(
  customerId: number,
  currentPassword: string,
  nextPassword: string,
) {
  const database = ensure();
  const row = database
    .prepare("SELECT password_hash FROM customers WHERE id=? AND status='active'")
    .get(customerId) as Row | undefined;
  if (!row || !verifyPassword(currentPassword, text(row, "password_hash")))
    throw new Error("当前密码不正确。");
  database
    .prepare(
      "UPDATE customers SET password_hash=?,must_change_password=0,updated_at=? WHERE id=?",
    )
    .run(hashPassword(nextPassword), now(), customerId);
}

function staffId(email: string) {
  const row = ensure()
    .prepare("SELECT id FROM admins WHERE email=? AND active=1 LIMIT 1")
    .get(email.trim().toLowerCase()) as Row | undefined;
  return row ? number(row, "id") : 0;
}

export function getSupportStaff(): SupportStaff[] {
  const rows = ensure()
    .prepare(
      `SELECT a.id,a.email,a.display_name,a.role,a.active,a.must_change_password,
       COALESCE(p.status,'offline') presence,COALESCE(p.last_seen_at,'') last_seen_at
       FROM admins a LEFT JOIN support_staff_presence p ON p.admin_id=a.id
       WHERE a.role IN ('owner','support','sales') ORDER BY a.active DESC,a.role,a.id`,
    )
    .all() as Row[];
  return rows.map((row) => ({
    id: number(row, "id"),
    email: text(row, "email"),
    displayName: text(row, "display_name") || text(row, "email").split("@")[0],
    role: text(row, "role") as AdminRole,
    active: number(row, "active") === 1,
    mustChangePassword: number(row, "must_change_password") === 1,
    presence: (["online", "away"].includes(text(row, "presence"))
      ? text(row, "presence")
      : "offline") as SupportStaff["presence"],
    lastSeenAt: text(row, "last_seen_at"),
  }));
}

export function createSupportStaff(input: {
  email: string;
  displayName: string;
  role: "support" | "sales";
  password: string;
}) {
  if (input.password.length < 12)
    throw new Error("客服与销售临时密码至少需要 12 个字符。");
  const database = ensure();
  const stamp = now();
  const result = database
    .prepare(
      "INSERT INTO admins (email,password_hash,role,display_name,active,must_change_password,created_at,updated_at) VALUES (?,?,?,?,1,1,?,?)",
    )
    .run(
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
      input.role,
      clean(input.displayName, 120),
      stamp,
      stamp,
    );
  return getSupportStaff().find(
    (item) => item.id === Number(result.lastInsertRowid),
  );
}

export function updateSupportStaff(input: {
  id: number;
  displayName?: string;
  role?: "support" | "sales";
  active?: boolean;
  temporaryPassword?: string;
}) {
  const database = ensure();
  const current = database
    .prepare("SELECT id,role FROM admins WHERE id=? LIMIT 1")
    .get(input.id) as Row | undefined;
  if (!current || text(current, "role") === "owner")
    throw new Error("不能通过客服工作台修改主管理员。");
  if (input.displayName !== undefined)
    database
      .prepare("UPDATE admins SET display_name=?,updated_at=? WHERE id=?")
      .run(clean(input.displayName, 120), now(), input.id);
  if (input.role)
    database
      .prepare("UPDATE admins SET role=?,updated_at=? WHERE id=?")
      .run(input.role, now(), input.id);
  if (input.active !== undefined)
    database
      .prepare("UPDATE admins SET active=?,updated_at=? WHERE id=?")
      .run(input.active ? 1 : 0, now(), input.id);
  if (input.temporaryPassword)
    if (input.temporaryPassword.length < 12)
      throw new Error("一次性临时密码至少需要 12 个字符。");
  if (input.temporaryPassword)
    database
      .prepare(
        "UPDATE admins SET password_hash=?,must_change_password=1,updated_at=? WHERE id=?",
      )
      .run(hashPassword(input.temporaryPassword), now(), input.id);
  return getSupportStaff().find((item) => item.id === input.id);
}

export function setStaffPresence(
  email: string,
  status: "online" | "away" | "offline",
) {
  const id = staffId(email);
  if (!id) return;
  ensure()
    .prepare(
      `INSERT INTO support_staff_presence (admin_id,status,last_seen_at) VALUES (?,?,?)
       ON CONFLICT(admin_id) DO UPDATE SET status=excluded.status,last_seen_at=excluded.last_seen_at`,
    )
    .run(id, status, now());
}

function tagsFor(conversationId: number) {
  return (
    ensure()
      .prepare(
        `SELECT t.name FROM support_tags t
         JOIN support_conversation_tags ct ON ct.tag_id=t.id
         WHERE ct.conversation_id=? ORDER BY t.name`,
      )
      .all(conversationId) as Row[]
  ).map((row) => text(row, "name"));
}

function mapConversation(row: Row): SupportConversation {
  return {
    id: number(row, "id"),
    customerId: number(row, "customer_id"),
    customerEmail: text(row, "customer_email"),
    customerName: text(row, "customer_name"),
    subject: text(row, "subject"),
    status: (["active", "closed"].includes(text(row, "status"))
      ? text(row, "status")
      : "waiting") as ConversationStatus,
    assignedAdminId: number(row, "assigned_admin_id") || undefined,
    assignedName: text(row, "assigned_name") || undefined,
    customerUnread: number(row, "customer_unread"),
    staffUnread: number(row, "staff_unread"),
    tags: tagsFor(number(row, "id")),
    lastMessage: text(row, "last_message") || undefined,
    lastMessageAt: text(row, "last_message_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

const conversationSelect = `
  SELECT c.*,u.email customer_email,u.name customer_name,
  COALESCE(NULLIF(a.display_name,''),a.email,'') assigned_name,
  (SELECT CASE WHEN m.message_type='attachment' THEN '[附件]' ELSE m.body END
   FROM support_messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) last_message
  FROM support_conversations c
  JOIN customers u ON u.id=c.customer_id
  LEFT JOIN admins a ON a.id=c.assigned_admin_id
`;

export function getOrCreateConversation(customerId: number, subject = "") {
  const database = ensure();
  const existing = database
    .prepare(
      `${conversationSelect} WHERE c.customer_id=? AND c.status!='closed' ORDER BY c.id DESC LIMIT 1`,
    )
    .get(customerId) as Row | undefined;
  if (existing) return mapConversation(existing);
  const stamp = now();
  const result = database
    .prepare(
      "INSERT INTO support_conversations (customer_id,subject,status,last_message_at,created_at,updated_at) VALUES (?,?, 'waiting',?,?,?)",
    )
    .run(customerId, clean(subject, 200), stamp, stamp, stamp);
  return getCustomerConversations(customerId).find(
    (item) => item.id === Number(result.lastInsertRowid),
  );
}

export function getCustomerConversations(customerId: number) {
  const rows = ensure()
    .prepare(
      `${conversationSelect} WHERE c.customer_id=? ORDER BY c.updated_at DESC`,
    )
    .all(customerId) as Row[];
  return rows.map(mapConversation);
}

export function getConversationById(conversationId: number) {
  const row = ensure()
    .prepare(`${conversationSelect} WHERE c.id=? LIMIT 1`)
    .get(conversationId) as Row | undefined;
  return row ? mapConversation(row) : null;
}

export function customerCanAccessConversation(
  customerId: number,
  conversationId: number,
) {
  return Boolean(
    ensure()
      .prepare(
        "SELECT 1 FROM support_conversations WHERE id=? AND customer_id=?",
      )
      .get(conversationId, customerId),
  );
}

export function staffCanAccessConversation(
  email: string,
  role: AdminRole,
  conversationId: number,
) {
  if (role === "owner" || role === "support") return true;
  const id = staffId(email);
  return Boolean(
    id &&
      ensure()
        .prepare(
          "SELECT 1 FROM support_conversations WHERE id=? AND assigned_admin_id=?",
        )
        .get(conversationId, id),
  );
}

export function getStaffConversations(input: {
  email: string;
  role: AdminRole;
  status?: string;
  query?: string;
}) {
  const database = ensure();
  const conditions: string[] = ["1=1"];
  const args: Array<string | number> = [];
  if (input.role === "sales") {
    conditions.push("c.assigned_admin_id=?");
    args.push(staffId(input.email));
  }
  if (["waiting", "active", "closed"].includes(input.status ?? "")) {
    conditions.push("c.status=?");
    args.push(input.status!);
  } else if (input.status === "unanswered") {
    conditions.push("c.staff_unread>0");
  }
  const query = clean(input.query, 120);
  if (query) {
    conditions.push(
      "(u.email LIKE ? OR u.name LIKE ? OR c.subject LIKE ? OR EXISTS (SELECT 1 FROM support_messages sm WHERE sm.conversation_id=c.id AND sm.body LIKE ?))",
    );
    const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;
    args.push(pattern, pattern, pattern, pattern);
  }
  const rows = database
    .prepare(
      `${conversationSelect} WHERE ${conditions.join(" AND ")} ORDER BY c.updated_at DESC LIMIT 200`,
    )
    .all(...args) as Row[];
  return rows.map(mapConversation);
}

function mapAttachment(row: Row): SupportAttachment {
  const id = number(row, "id");
  const mime = text(row, "mime_type");
  return {
    id,
    conversationId: number(row, "conversation_id"),
    originalName: text(row, "original_name"),
    mimeType: mime,
    size: number(row, "size"),
    sha256: text(row, "sha256"),
    scanStatus: text(row, "scan_status") === "clean" ? "clean" : "rejected",
    createdAt: text(row, "created_at"),
    downloadUrl: `/api/support/attachments/${id}`,
    isImage: mime.startsWith("image/"),
  };
}

export function createAttachmentRecord(input: {
  conversationId: number;
  customerId: number;
  uploadedByType: "customer" | "staff";
  uploadedById: number;
  originalName: string;
  storageName: string;
  mimeType: string;
  size: number;
  sha256: string;
}) {
  const result = ensure()
    .prepare(
      `INSERT INTO support_attachments
       (conversation_id,customer_id,uploaded_by_type,uploaded_by_id,original_name,storage_name,mime_type,size,sha256,scan_status,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,'clean',?)`,
    )
    .run(
      input.conversationId,
      input.customerId,
      input.uploadedByType,
      input.uploadedById,
      clean(input.originalName, 240),
      input.storageName,
      input.mimeType,
      input.size,
      input.sha256,
      now(),
    );
  return getAttachment(Number(result.lastInsertRowid));
}

export function getAttachment(id: number) {
  const row = ensure()
    .prepare("SELECT * FROM support_attachments WHERE id=? LIMIT 1")
    .get(id) as Row | undefined;
  return row ? { ...mapAttachment(row), storageName: text(row, "storage_name"), customerId: number(row, "customer_id") } : null;
}

export function createSupportMessage(input: {
  conversationId: number;
  senderType: SenderType;
  senderCustomerId?: number;
  senderAdminId?: number;
  body?: string;
  attachmentId?: number;
}) {
  const database = ensure();
  const body = clean(input.body, 6000);
  if (!body && !input.attachmentId) throw new Error("消息内容不能为空。");
  const stamp = now();
  const result = database
    .prepare(
      `INSERT INTO support_messages
       (conversation_id,sender_type,sender_customer_id,sender_admin_id,body,message_type,attachment_id,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(
      input.conversationId,
      input.senderType,
      input.senderCustomerId ?? null,
      input.senderAdminId ?? null,
      body,
      input.attachmentId ? "attachment" : "text",
      input.attachmentId ?? null,
      stamp,
    );
  const unreadColumn =
    input.senderType === "customer" ? "staff_unread" : "customer_unread";
  database
    .prepare(
      `UPDATE support_conversations
       SET ${unreadColumn}=${unreadColumn}+1,last_message_at=?,updated_at=?,
       status=CASE WHEN status='closed' THEN 'waiting' ELSE status END WHERE id=?`,
    )
    .run(stamp, stamp, input.conversationId);
  return getConversationMessages(input.conversationId).find(
    (item) => item.id === Number(result.lastInsertRowid),
  );
}

export function getConversationMessages(conversationId: number, after = 0) {
  const rows = ensure()
    .prepare(
      `SELECT m.*,COALESCE(NULLIF(a.display_name,''),a.email,'') staff_name,
       COALESCE(u.name,u.email,'') customer_name,
       at.id attachment_record_id,at.original_name,at.mime_type,at.size,at.sha256,at.scan_status,at.created_at attachment_created_at
       FROM support_messages m
       LEFT JOIN admins a ON a.id=m.sender_admin_id
       LEFT JOIN customers u ON u.id=m.sender_customer_id
       LEFT JOIN support_attachments at ON at.id=m.attachment_id
       WHERE m.conversation_id=? AND m.id>? ORDER BY m.id LIMIT 500`,
    )
    .all(conversationId, after) as Row[];
  return rows.map((row) => {
    const attachmentId = number(row, "attachment_record_id");
    return {
      id: number(row, "id"),
      conversationId: number(row, "conversation_id"),
      senderType: text(row, "sender_type") as SenderType,
      senderName:
        text(row, "sender_type") === "staff"
          ? text(row, "staff_name")
          : text(row, "sender_type") === "customer"
            ? text(row, "customer_name")
            : "System",
      body: text(row, "body"),
      messageType:
        text(row, "message_type") === "attachment" ? "attachment" : "text",
      attachment: attachmentId
        ? {
            id: attachmentId,
            conversationId,
            originalName: text(row, "original_name"),
            mimeType: text(row, "mime_type"),
            size: number(row, "size"),
            sha256: text(row, "sha256"),
            scanStatus:
              text(row, "scan_status") === "clean" ? "clean" : "rejected",
            createdAt: text(row, "attachment_created_at"),
            downloadUrl: `/api/support/attachments/${attachmentId}`,
            isImage: text(row, "mime_type").startsWith("image/"),
          }
        : undefined,
      createdAt: text(row, "created_at"),
    } satisfies SupportMessage;
  });
}

export function markConversationRead(
  conversationId: number,
  reader: "customer" | "staff",
) {
  ensure()
    .prepare(
      `UPDATE support_conversations SET ${reader === "customer" ? "customer_unread" : "staff_unread"}=0 WHERE id=?`,
    )
    .run(conversationId);
}

export function assignConversation(input: {
  conversationId: number;
  toAdminId: number;
  actorEmail: string;
}) {
  const database = ensure();
  const actorId = staffId(input.actorEmail);
  const current = database
    .prepare(
      "SELECT assigned_admin_id FROM support_conversations WHERE id=? LIMIT 1",
    )
    .get(input.conversationId) as Row | undefined;
  if (!current || !actorId) throw new Error("会话或操作账号不存在。");
  const target = database
    .prepare(
      "SELECT id FROM admins WHERE id=? AND active=1 AND role IN ('owner','support','sales')",
    )
    .get(input.toAdminId);
  if (!target) throw new Error("目标销售账号不可用。");
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        "UPDATE support_conversations SET assigned_admin_id=?,status='active',updated_at=? WHERE id=?",
      )
      .run(input.toAdminId, now(), input.conversationId);
    database
      .prepare(
        "INSERT INTO support_assignment_history (conversation_id,from_admin_id,to_admin_id,actor_admin_id,created_at) VALUES (?,?,?,?,?)",
      )
      .run(
        input.conversationId,
        number(current, "assigned_admin_id") || null,
        input.toAdminId,
        actorId,
        now(),
      );
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function updateConversationStatus(
  conversationId: number,
  status: ConversationStatus,
) {
  if (!["waiting", "active", "closed"].includes(status))
    throw new Error("无效的会话状态。");
  ensure()
    .prepare(
      "UPDATE support_conversations SET status=?,updated_at=? WHERE id=?",
    )
    .run(status, now(), conversationId);
}

export function addConversationNote(
  conversationId: number,
  authorEmail: string,
  body: string,
) {
  const authorId = staffId(authorEmail);
  const cleanBody = clean(body, 3000);
  if (!authorId || !cleanBody) throw new Error("备注内容不能为空。");
  ensure()
    .prepare(
      "INSERT INTO support_notes (conversation_id,author_admin_id,body,created_at) VALUES (?,?,?,?)",
    )
    .run(conversationId, authorId, cleanBody, now());
}

export function getConversationNotes(conversationId: number): SupportNote[] {
  return (
    ensure()
      .prepare(
        `SELECT n.*,COALESCE(NULLIF(a.display_name,''),a.email) author_name
         FROM support_notes n JOIN admins a ON a.id=n.author_admin_id
         WHERE n.conversation_id=? ORDER BY n.id DESC`,
      )
      .all(conversationId) as Row[]
  ).map((row) => ({
    id: number(row, "id"),
    conversationId: number(row, "conversation_id"),
    authorName: text(row, "author_name"),
    body: text(row, "body"),
    createdAt: text(row, "created_at"),
  }));
}

export function setConversationTags(conversationId: number, tags: string[]) {
  const database = ensure();
  const normalized = Array.from(
    new Set(tags.map((item) => clean(item, 40)).filter(Boolean)),
  ).slice(0, 12);
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare("DELETE FROM support_conversation_tags WHERE conversation_id=?")
      .run(conversationId);
    for (const tag of normalized) {
      database
        .prepare(
          "INSERT OR IGNORE INTO support_tags (name,created_at) VALUES (?,?)",
        )
        .run(tag, now());
      database
        .prepare(
          "INSERT INTO support_conversation_tags (conversation_id,tag_id) SELECT ?,id FROM support_tags WHERE name=?",
        )
        .run(conversationId, tag);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getQuickReplies(): QuickReply[] {
  return (
    ensure()
      .prepare(
        "SELECT * FROM support_quick_replies WHERE active=1 ORDER BY title",
      )
      .all() as Row[]
  ).map((row) => ({
    id: number(row, "id"),
    title: text(row, "title"),
    body: text(row, "body"),
    createdBy: number(row, "created_by"),
    active: number(row, "active") === 1,
  }));
}

export function saveQuickReply(
  actorEmail: string,
  input: { id?: number; title: string; body: string; active?: boolean },
) {
  const database = ensure();
  const authorId = staffId(actorEmail);
  if (!authorId) throw new Error("操作账号不存在。");
  const title = clean(input.title, 120);
  const body = clean(input.body, 3000);
  if (!title || !body) throw new Error("快捷回复标题和内容不能为空。");
  if (input.id)
    database
      .prepare(
        "UPDATE support_quick_replies SET title=?,body=?,active=?,updated_at=? WHERE id=?",
      )
      .run(title, body, input.active === false ? 0 : 1, now(), input.id);
  else
    database
      .prepare(
        "INSERT INTO support_quick_replies (title,body,created_by,active,created_at,updated_at) VALUES (?,?,?,1,?,?)",
      )
      .run(title, body, authorId, now(), now());
}

export function auditSupport(input: {
  actorType: "customer" | "staff" | "system";
  actorId: number;
  action: string;
  targetType: string;
  targetId?: number;
  detail?: string;
  ip?: string;
}) {
  ensure()
    .prepare(
      "INSERT INTO support_audit_logs (actor_type,actor_id,action,target_type,target_id,detail,ip,created_at) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      input.actorType,
      input.actorId,
      clean(input.action, 100),
      clean(input.targetType, 100),
      input.targetId ?? 0,
      clean(input.detail, 1000),
      clean(input.ip, 64),
      now(),
    );
}

export function exportCustomerData(customerId: number) {
  const customer = getCustomerById(customerId);
  if (!customer) return null;
  const inquiryBag = getCustomerInquiryBag(customerId);
  const conversations = getCustomerConversations(customerId).map(
    (conversation) => ({
      ...conversation,
      messages: getConversationMessages(conversation.id),
    }),
  );
  return { exportedAt: now(), customer, inquiryBag, conversations };
}

export function deleteCustomerData(customerId: number) {
  const database = ensure();
  const files = (
    database
      .prepare(
        "SELECT storage_name FROM support_attachments WHERE customer_id=?",
      )
      .all(customerId) as Row[]
  ).map((row) => text(row, "storage_name"));
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM customers WHERE id=?").run(customerId);
    database.exec("COMMIT");
    return files;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getStaffId(email: string) {
  return staffId(email);
}
