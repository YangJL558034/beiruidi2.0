import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const allowed = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["application/pdf", [".pdf"]],
  ["text/plain", [".txt"]],
  ["text/csv", [".csv"]],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    [".docx"],
  ],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    [".xlsx"],
  ],
]);

export function supportAttachmentDir() {
  const configured = process.env.SZA_SUPPORT_ATTACHMENT_PATH?.trim();
  const directory = configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "data", "support-attachments");
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg")
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mimeType === "image/png")
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  if (mimeType === "image/webp")
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  if (mimeType === "application/pdf")
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (
    mimeType.includes("openxmlformats-officedocument")
  )
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (mimeType.startsWith("text/"))
    return !buffer.subarray(0, Math.min(buffer.length, 1024)).includes(0);
  return false;
}

function scanWithClamAv(buffer: Buffer) {
  const host = process.env.SZA_CLAMAV_HOST?.trim();
  if (!host) return Promise.resolve<"not_configured">("not_configured");
  const port = Number(process.env.SZA_CLAMAV_PORT ?? 3310);
  return new Promise<"clean">((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("恶意文件扫描服务超时。"));
    }, 15_000);
    let response = "";
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < buffer.length; offset += 64 * 1024) {
        const chunk = buffer.subarray(offset, offset + 64 * 1024);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(chunk.length);
        socket.write(size);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
    });
    socket.on("end", () => {
      clearTimeout(timer);
      if (response.includes("FOUND"))
        reject(new Error("文件未通过恶意内容检测。"));
      else if (response.includes("OK")) resolve("clean");
      else reject(new Error("恶意文件扫描服务返回异常。"));
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function validateAndStoreSupportFile(file: File) {
  const maxBytes = Math.min(
    Math.max(Number(process.env.SZA_SUPPORT_MAX_FILE_BYTES ?? 10_485_760), 1),
    25_000_000,
  );
  if (file.size <= 0 || file.size > maxBytes)
    throw new Error(`附件大小必须小于 ${Math.floor(maxBytes / 1024 / 1024)} MB。`);
  const mimeType = file.type.toLowerCase();
  const extensions = allowed.get(mimeType);
  const extension = path.extname(file.name).toLowerCase();
  if (!extensions?.includes(extension))
    throw new Error("不支持此文件类型。仅允许图片、PDF、TXT、CSV、DOCX 和 XLSX。");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(buffer, mimeType))
    throw new Error("文件内容与扩展名不匹配。");
  const scanResult = await scanWithClamAv(buffer);
  if (
    scanResult === "not_configured" &&
    process.env.SZA_REQUIRE_MALWARE_SCAN === "true"
  )
    throw new Error("恶意文件扫描服务未配置，已拒绝上传。");
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const storageName = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${extension}`;
  const destination = path.join(supportAttachmentDir(), storageName);
  fs.writeFileSync(destination, buffer, { flag: "wx", mode: 0o600 });
  return {
    storageName,
    originalName: path.basename(file.name).slice(0, 240),
    mimeType,
    size: buffer.length,
    sha256,
  };
}

export function supportFilePath(storageName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(storageName))
    throw new Error("Invalid attachment path.");
  return path.join(supportAttachmentDir(), storageName);
}

export function removeSupportFiles(storageNames: string[]) {
  for (const name of storageNames) {
    try {
      fs.rmSync(supportFilePath(name), { force: true });
    } catch {}
  }
}
