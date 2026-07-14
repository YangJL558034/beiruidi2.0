import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./ProductDetailClient";
import { getProductBySlug, getProducts } from "@/lib/db";
import { getRequestLocale } from "@/lib/i18n-server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params; const locale=await getRequestLocale(); const product=getProductBySlug(slug,false,locale);
  if(!product)return {title:locale==="cn"?"产品未找到":"Product not found",robots:{index:false,follow:false}};
  const title=product.name; const description=product.description||product.subtitle;
  return {title,description,alternates:{canonical:`/${locale}/products/${product.slug}`,languages:{en:`/en/products/${product.slug}`,"zh-CN":`/cn/products/${product.slug}`}},openGraph:{title,description,type:"website",images:product.image?[{url:product.image,alt:product.name}]:undefined}};
}

export default async function ProductDetailPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const locale=await getRequestLocale(); const product=getProductBySlug(slug,false,locale);
  if(!product)notFound();
  const related=getProducts({locale}).filter((item)=>item.slug!==slug).slice(0,3);
  const schema={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,image:product.images,brand:{"@type":"Brand",name:"SZA POWER"},offers:{"@type":"Offer",priceCurrency:"USD",price:product.price,availability:"https://schema.org/InStock"}};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/><ProductDetailClient product={product} related={related} locale={locale}/></>;
}