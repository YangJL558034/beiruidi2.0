"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AccessTracker() {
  const pathname = usePathname();
  useEffect(()=>{
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    fetch("/api/telemetry/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:pathname}),keepalive:true}).catch(()=>undefined);
  },[pathname]);
  return null;
}