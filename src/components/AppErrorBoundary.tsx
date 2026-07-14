"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props={children:ReactNode};
type State={hasError:boolean};
export class AppErrorBoundary extends Component<Props,State>{
  state:State={hasError:false};
  static getDerivedStateFromError():State{return {hasError:true};}
  componentDidCatch(error:Error,info:ErrorInfo){
    fetch("/api/telemetry/error",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:error.message,stack:error.stack,componentStack:info.componentStack,path:window.location.pathname}),keepalive:true}).catch(()=>undefined);
  }
  render(){
    if(this.state.hasError)return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] px-6 text-center"><div><h1 className="text-2xl font-semibold">页面暂时无法加载</h1><p className="mt-3 text-sm text-slate-500">错误已记录，请刷新页面或稍后再试。</p><button type="button" onClick={()=>window.location.reload()} className="mt-6 rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white">刷新页面</button></div></main>;
    return this.props.children;
  }
}