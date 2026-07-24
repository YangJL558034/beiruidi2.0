import fs from "node:fs";
import path from "node:path";
import {
  checkpointDatabase,
  closeDatabaseConnection,
  getDatabasePath,
} from "@/lib/db";
import { supportAttachmentDir } from "@/lib/support-files";

export type DatabaseBackup = {
  name: string;
  size: number;
  createdAt: string;
  kind: "automatic" | "manual";
  attachmentFiles: number;
};
function backupDir() {
  return path.join(path.dirname(getDatabasePath()), "backups");
}
let lastAutomaticCheck = 0;

function ensureDir() {
  fs.mkdirSync(backupDir(), { recursive: true });
}
function safeName(value: string) {
  const name = path.basename(value);
  return /^[a-zA-Z0-9._-]+\.sqlite$/.test(name) ? name : "";
}
function info(name: string): DatabaseBackup | null {
  const clean = safeName(name);
  if (!clean) return null;
  const file = path.join(backupDir(), clean);
  if (!fs.existsSync(file)) return null;
  const stat = fs.statSync(file);
  return {
    name: clean,
    size: stat.size,
    createdAt: stat.mtime.toISOString(),
    kind: clean.startsWith("automatic-") ? "automatic" : "manual",
    attachmentFiles: fs.existsSync(`${file}.attachments`)
      ? fs.readdirSync(`${file}.attachments`).length
      : 0,
  };
}
export function listDatabaseBackups() {
  ensureDir();
  return fs
    .readdirSync(backupDir())
    .map(info)
    .filter((item): item is DatabaseBackup => Boolean(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function createDatabaseBackup(kind: "automatic" | "manual" = "manual") {
  ensureDir();
  checkpointDatabase();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `${kind}-${stamp}.sqlite`;
  fs.copyFileSync(getDatabasePath(), path.join(backupDir(), name));
  const attachments = supportAttachmentDir();
  const attachmentBackup = path.join(backupDir(), `${name}.attachments`);
  if (fs.existsSync(attachments))
    fs.cpSync(attachments, attachmentBackup, { recursive: true });
  prune(kind, kind === "automatic" ? 30 : 20);
  return info(name)!;
}
function prune(kind: "automatic" | "manual", keep: number) {
  const items = listDatabaseBackups().filter((item) => item.kind === kind);
  for (const item of items.slice(keep)) {
    fs.unlinkSync(path.join(backupDir(), item.name));
    fs.rmSync(path.join(backupDir(), `${item.name}.attachments`), {
      recursive: true,
      force: true,
    });
  }
}

export function restoreDatabaseBackup(name: string) {
  const backup = getBackupFile(name);
  if (!backup) throw new Error("备份文件不存在。");
  const databasePath = getDatabasePath();
  const attachments = supportAttachmentDir();
  const attachmentBackup = `${backup.path}.attachments`;
  createDatabaseBackup("manual");
  closeDatabaseConnection();
  for (const suffix of ["-wal", "-shm"])
    fs.rmSync(`${databasePath}${suffix}`, { force: true });
  fs.copyFileSync(backup.path, databasePath);
  fs.rmSync(attachments, { recursive: true, force: true });
  fs.mkdirSync(attachments, { recursive: true });
  if (fs.existsSync(attachmentBackup)) {
    fs.cpSync(attachmentBackup, attachments, { recursive: true });
  }
  getDatabasePath();
  return info(name);
}
export function getBackupFile(name: string) {
  const item = info(name);
  return item ? { item, path: path.join(backupDir(), item.name) } : null;
}
export function ensureAutomaticBackup(enabled = true, hours = 24) {
  if (!enabled) return null;
  if (Date.now() - lastAutomaticCheck < 60_000) return null;
  lastAutomaticCheck = Date.now();
  const latest = listDatabaseBackups().find(
    (item) => item.kind === "automatic",
  );
  const interval = Math.max(1, Math.min(168, hours)) * 60 * 60_000;
  return !latest || Date.parse(latest.createdAt) <= Date.now() - interval
    ? createDatabaseBackup("automatic")
    : null;
}
