import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { createDatabaseBackup, getBackupFile, listDatabaseBackups } from "@/lib/backups";
import { getDatabasePath, recordSecurityEvent } from "@/lib/db";
import { getRequestIp } from "@/lib/request-security";

export const runtime="nodejs";
function download(file:string,name:string){const data=fs.readFileSync(file);return new NextResponse(data,{headers:{"Content-Type":"application/vnd.sqlite3","Content-Disposition":`attachment; filename="${name}"`,"Cache-Control":"no-store"}});}
export async function GET(request:NextRequest){
  const action=request.nextUrl.searchParams.get("action");
  if(action==="list")return NextResponse.json({backups:listDatabaseBackups()},{headers:{"Cache-Control":"no-store"}});
  const requested=request.nextUrl.searchParams.get("file");
  if(requested){const file=getBackupFile(requested);if(!file)return NextResponse.json({error:"备份文件不存在。"},{status:404});return download(file.path,file.item.name);}
  return download(getDatabasePath(),`sza-power-live-${new Date().toISOString().slice(0,10)}.sqlite`);
}
export async function POST(request:NextRequest){
  try{const backup=createDatabaseBackup("manual");recordSecurityEvent({type:"database_backup_created",severity:"info",ip:getRequestIp(request),detail:backup.name});return NextResponse.json({backup},{status:201});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"创建备份失败。"},{status:500});}
}