"use client";

import { useEffect, useState, useRef } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Pencil, Save, X, ImageIcon, Video, Download, Trash2, Upload, XCircle } from "lucide-react";
import type { AccessLog, AdminRole, SecurityEvent } from "@/lib/content-types";

type Backup={name:string;size:number;createdAt:string;kind:"automatic"|"manual"};
type AdminUser={id:number;email:string;role:AdminRole;createdAt:string;updatedAt:string};
type EditMode="none"|"email"|"password";
type MediaFile={filename:string;url:string;type:"image"|"video";extension:string;size:number;createdAt:string};
function bytes(value:number){if(value<1024) return `${value} B`;if(value<1024*1024)return `${(value/1024).toFixed(1)} KB`;return `${(value/1024/1024).toFixed(1)} MB`;}
function when(value:string){return new Date(value).toLocaleString("zh-CN",{hour12:false});}

export function AdminOperations(){
  const [backups,setBackups]=useState<Backup[]>([]);
  const [logs,setLogs]=useState<AccessLog[]>([]);
  const [events,setEvents]=useState<SecurityEvent[]>([]);
  const [admins,setAdmins]=useState<AdminUser[]>([]);
  const [media,setMedia]=useState<MediaFile[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [mediaError,setMediaError]=useState("");
  const [uploading,setUploading]=useState(false);
  const [deleting,setDeleting]=useState<string>("");
  const [editing,setEditing]=useState<{id:number;mode:EditMode;email:string;password:string}>({id:0,mode:"none",email:"",password:""});
  const fileInputRef=useRef<HTMLInputElement>(null);
  async function load(){
    const [backupResponse,monitorResponse,adminResponse,mediaResponse]=await Promise.all([adminFetch("/api/admin/backup?action=list"),adminFetch("/api/admin/monitoring?limit=80"),adminFetch("/api/admin/admins"),adminFetch("/api/admin/media")]);
    if(backupResponse.ok){const data=await backupResponse.json();setBackups(data.backups??[]);}
    if(monitorResponse.ok){const data=await monitorResponse.json();setLogs(data.accessLogs??[]);setEvents(data.securityEvents??[]);}
    if(adminResponse.ok){const data=await adminResponse.json();setAdmins(data.admins??[]);}
    if(mediaResponse.ok){const data=await mediaResponse.json();setMedia(data.media??[]);}
  }
  useEffect(()=>{const timer=window.setTimeout(()=>{void load();},0);return()=>window.clearTimeout(timer);},[]);
  async function changeRole(id:number,role:AdminRole){const response=await adminFetch("/api/admin/admins",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,role})});if(response.ok)await load();else setError((await response.json().catch(()=>null))?.error??"角色更新失败");}
  async function saveEdit(){
    if(editing.mode==="none")return;
    const payload:Record<string,unknown>={id:editing.id};
    if(editing.mode==="email")payload.email=editing.email;
    if(editing.mode==="password")payload.password=editing.password;
    const response=await adminFetch("/api/admin/admins",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(response.ok){await load();setEditing({id:0,mode:"none",email:"",password:""});setError("");}
    else setError((await response.json().catch(()=>null))?.error??"更新失败");
  }
  async function createBackup(){
    setBusy(true);setError("");
    try{const response=await adminFetch("/api/admin/backup",{method:"POST"});if(!response.ok)throw new Error((await response.json().catch(()=>null))?.error??"备份失败");await load();}catch(error){setError(error instanceof Error?error.message:"备份失败");}finally{setBusy(false);}
  }
  async function uploadMedia(event:React.ChangeEvent<HTMLInputElement>){
    const files=event.target.files;
    if(!files||files.length===0)return;
    setUploading(true);
    setMediaError("");
    try{
      const formData=new FormData();
      formData.append("file",files[0]);
      const response=await adminFetch("/api/admin/media",{method:"POST",body:formData});
      if(!response.ok)throw new Error((await response.json().catch(()=>null))?.error??"上传失败");
      await load();
    }catch(error){
      setMediaError(error instanceof Error?error.message:"上传失败");
    }finally{
      setUploading(false);
      if(fileInputRef.current)fileInputRef.current.value="";
    }
  }
  async function deleteMedia(filename:string){
    setDeleting(filename);
    try{
      const response=await adminFetch("/api/admin/media",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename})});
      if(response.ok)await load();
      else setMediaError((await response.json().catch(()=>null))?.error??"删除失败");
    }catch(error){
      setMediaError(error instanceof Error?error.message:"删除失败");
    }finally{
      setDeleting("");
    }
  }
  const startEdit=(admin:AdminUser,mode:EditMode)=>{
    setEditing({id:admin.id,mode,email:admin.email,password:""});
    setError("");
  };
  return <section className="grid gap-5 xl:col-span-2">
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">数据库备份</h2><p className="mt-1 text-sm text-slate-500">自动备份按系统设置运行，备份文件保存在服务器受保护目录。</p></div><button type="button" onClick={()=>void createBackup()} disabled={busy} className="min-h-10 rounded-md bg-[#2f6df6] px-4 text-sm font-semibold text-white disabled:opacity-60">{busy?"备份中...":"立即备份"}</button></div>
      {error?<p className="mt-3 text-sm text-rose-600">{error}</p>:null}
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="px-2 py-2">类型</th><th className="px-2 py-2">文件</th><th className="px-2 py-2">大小</th><th className="px-2 py-2">时间</th><th className="px-2 py-2">操作</th></tr></thead><tbody>{backups.slice(0,12).map((item)=><tr key={item.name} className="border-b border-slate-50"><td className="px-2 py-2">{item.kind==="automatic"?"自动":"手动"}</td><td className="max-w-[260px] truncate px-2 py-2 font-mono text-xs" title={item.name}>{item.name}</td><td className="px-2 py-2 text-slate-500">{bytes(item.size)}</td><td className="whitespace-nowrap px-2 py-2 text-slate-500">{when(item.createdAt)}</td><td className="px-2 py-2"><a className="font-semibold text-blue-600 hover:underline" href={`/api/admin/backup?file=${encodeURIComponent(item.name)}`}>下载</a></td></tr>)}</tbody></table>{!backups.length?<p className="py-5 text-center text-sm text-slate-500">还没有备份，点击“立即备份”创建第一份。</p>:null}</div>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">访问日志（含 IP）</h2><p className="mt-1 text-sm text-slate-500">最近 80 条前台访问记录，用于排查代理、移动端和异常流量。</p><div className="mt-4 max-h-80 overflow-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="sticky top-0 bg-white text-slate-500"><tr><th className="px-2 py-2">时间</th><th className="px-2 py-2">IP</th><th className="px-2 py-2">路径</th><th className="px-2 py-2">设备</th></tr></thead><tbody>{logs.map((item)=><tr key={item.id} className="border-t border-slate-50"><td className="whitespace-nowrap px-2 py-2 text-slate-500">{when(item.createdAt)}</td><td className="px-2 py-2 font-mono">{item.ip}</td><td className="max-w-[160px] truncate px-2 py-2">{item.path}</td><td className="max-w-[220px] truncate px-2 py-2 text-slate-500" title={item.userAgent}>{item.userAgent||"-"}</td></tr>)}</tbody></table>{!logs.length?<p className="py-5 text-center text-sm text-slate-500">暂无访问日志。</p>:null}</div></div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">安全事件</h2><p className="mt-1 text-sm text-slate-500">登录失败、锁定、CSRF 和备份异常会记录在这里。</p><div className="mt-4 max-h-80 overflow-auto"><div className="grid gap-2">{events.slice(0,40).map((item)=><div key={item.id} className="rounded-md bg-slate-50 p-3 text-xs"><div className="flex justify-between gap-2"><span className={`font-semibold ${item.severity==="critical"?"text-rose-600":item.severity==="warning"?"text-amber-600":"text-slate-700"}`}>{item.type}</span><span className="text-slate-400">{when(item.createdAt)}</span></div><p className="mt-1 text-slate-500">{item.ip||"-"} · {item.actor||"system"}</p><p className="mt-1 break-words text-slate-700">{item.detail}</p></div>)}{!events.length?<p className="py-5 text-center text-sm text-slate-500">暂无安全事件。</p>:null}</div></div></div>    </div>
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">媒体管理</h2><p className="mt-1 text-sm text-slate-500">管理上传的图片和视频文件，支持预览、下载和删除操作。</p></div><button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#2f6df6] px-4 text-sm font-semibold text-white disabled:opacity-60"><Upload size={16}/>{uploading?"上传中...":"上传媒体"}</button></div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg" onChange={(event)=>void uploadMedia(event)} className="hidden"/>
      {mediaError?<p className="mt-3 text-sm text-rose-600 flex items-center gap-1.5"><XCircle size={14}/>{mediaError}</p>:null}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">{media.map((item)=><div key={item.filename} className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        {item.type==="image"?<img src={item.url} alt={item.filename} className="w-full h-full object-cover"/>
        :<div className="w-full h-full flex flex-col items-center justify-center bg-slate-100"><Video size={32} className="text-slate-400"/><span className="mt-2 text-xs text-slate-500">{item.extension.toUpperCase()}</span></div>}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a href={item.url} target="_blank" className="grid size-8 place-items-center rounded-full bg-white/90 hover:bg-white"><Download size={16}/></a>
          <button onClick={()=>void deleteMedia(item.filename)} disabled={deleting===item.filename} className="grid size-8 place-items-center rounded-full bg-rose-500/90 hover:bg-rose-500 disabled:opacity-50"><Trash2 size={16} className="text-white"/></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-xs text-white truncate" title={item.filename}>{item.filename}</p>
          <p className="text-xs text-white/70">{bytes(item.size)} · {when(item.createdAt)}</p>
        </div>
      </div>)}{!media.length?<div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400"><ImageIcon size={48}/><p className="mt-3 text-sm">暂无媒体文件</p><p className="text-xs">点击上方“上传媒体”按钮添加</p></div>:null}</div>
    </div>
    {admins.length?<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">后台账号与权限</h2><p className="mt-1 text-sm text-slate-500">所有者可管理角色；编辑可维护产品、资讯和页面内容；客服只处理客户留言。</p><div className="mt-4 grid gap-2">{admins.map((admin)=>{
      const isEditing=editing.id===admin.id;
      return <div key={admin.id} className={`rounded-md px-3 py-3 text-sm ${isEditing?"bg-blue-50 border border-blue-200":"bg-slate-50"}`}>
        {!isEditing?<>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">{admin.email}</span>
            <div className="flex flex-wrap items-center gap-2">
              <select value={admin.role} onChange={(event)=>void changeRole(admin.id,event.target.value as AdminRole)} className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"><option value="owner">所有者</option><option value="editor">编辑</option><option value="support">客服</option></select>
              <button onClick={()=>startEdit(admin,"email")} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"><Pencil size={14}/>修改邮箱</button>
              <button onClick={()=>startEdit(admin,"password")} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"><Pencil size={14}/>修改密码</button>
            </div>
          </div>
        </>:<>
          {editing.mode==="email"?<div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">修改邮箱</span>
              <button onClick={()=>setEditing({id:0,mode:"none",email:"",password:""})} className="grid size-7 place-items-center rounded-md hover:bg-blue-100"><X size={14}/></button>
            </div>
            <input type="email" value={editing.email} onChange={(event)=>setEditing({...editing,email:event.target.value})} className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" placeholder="输入新邮箱"/>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setEditing({id:0,mode:"none",email:"",password:""})} className="min-h-9 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-700">取消</button>
              <button onClick={()=>void saveEdit()} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#2f6df6] px-3 text-xs font-semibold text-white"><Save size={14}/>保存邮箱</button>
            </div>
          </div>:null}
          {editing.mode==="password"?<div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">修改密码（至少 10 位）</span>
              <button onClick={()=>setEditing({id:0,mode:"none",email:"",password:""})} className="grid size-7 place-items-center rounded-md hover:bg-blue-100"><X size={14}/></button>
            </div>
            <input type="password" value={editing.password} onChange={(event)=>setEditing({...editing,password:event.target.value})} className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" placeholder="输入新密码"/>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setEditing({id:0,mode:"none",email:"",password:""})} className="min-h-9 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-700">取消</button>
              <button onClick={()=>void saveEdit()} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#2f6df6] px-3 text-xs font-semibold text-white"><Save size={14}/>保存密码</button>
            </div>
          </div>:null}
        </>}
      </div>;
    })}</div></div>:null}
  </section>
}