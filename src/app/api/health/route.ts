import { NextResponse } from "next/server";
import { getDatabasePath } from "@/lib/db";
import fs from "node:fs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{const file=getDatabasePath();const stat=fs.statSync(file);return NextResponse.json({ok:true,service:"sza-power",database:{available:true,updatedAt:stat.mtime.toISOString()}},{headers:{"Cache-Control":"no-store"}});}
  catch{return NextResponse.json({ok:false,service:"sza-power"},{status:503,headers:{"Cache-Control":"no-store"}});}
}