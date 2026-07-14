"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content-types";
import type { Locale } from "@/lib/navigation";
import { pageText } from "@/lib/i18n";

const fallback = (locale: Locale): SiteContent => ({
  home:{eyebrow:"SZA POWER",title:"SZA POWER",subtitle:""},
  products:{eyebrow:pageText[locale].productsEyebrow,title:pageText[locale].productsTitle,subtitle:pageText[locale].productsSubtitle},
  news:{eyebrow:pageText[locale].newsEyebrow,title:pageText[locale].newsTitle,subtitle:""},
  about:{eyebrow:pageText[locale].aboutEyebrow,title:pageText[locale].aboutTitle,subtitle:pageText[locale].aboutSubtitle},
  support:{eyebrow:pageText[locale].supportEyebrow,title:pageText[locale].supportTitle,subtitle:""},
  contact:{eyebrow:pageText[locale].contactEyebrow,title:pageText[locale].contactTitle,subtitle:pageText[locale].contactSubtitle},
  privacy:{eyebrow:locale==="cn"?"隐私政策":"Privacy",title:locale==="cn"?"您的信息只用于明确的用途。":"Your information stays purposeful.",subtitle:""},
  terms:{eyebrow:locale==="cn"?"使用条款":"Terms",title:locale==="cn"?"清晰的网站使用约定。":"Clear terms for using this website.",subtitle:""}
});
export function useSiteContent(locale: Locale) { const [content,setContent]=useState(()=>fallback(locale)); useEffect(()=>{let active=true;fetch(`/api/site-content?locale=${locale}`, { cache: "no-store" }).then((response)=>response.ok?response.json():null).then((data)=>{if(active&&data?.content)setContent(data.content);}).catch(()=>undefined);return()=>{active=false;};},[locale]); return content; }
