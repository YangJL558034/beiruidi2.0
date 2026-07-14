"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import type { LocalizedProduct as Product, LocalizedPost as Post } from "@/lib/content-types";
import { withLocale } from "@/lib/i18n";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: "cn" | "en";
}

interface SearchResult {
  products: Product[];
  posts: Post[];
}

export function SearchModal({ isOpen, onClose, locale }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ products: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ products: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&locale=${locale}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults({ products: [], posts: [] });
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(query);
    }, 200);
    return () => clearTimeout(debounce);
  }, [query, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleLinkClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const hasResults = results.products.length > 0 || results.posts.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-20 z-[101] w-full max-w-3xl -translate-x-1/2"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-black/10">
                <Search size={20} className="text-[#6e6e73]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={locale === "cn" ? "搜索产品、新闻..." : "Search products, news..."}
                  className="flex-1 text-base bg-transparent outline-none placeholder:text-[#6e6e73]"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-[#6e6e73]" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : query.trim() === "" ? (
                  <div className="px-5 py-8 text-center text-sm text-[#6e6e73]">
                    {locale === "cn" ? "输入关键词开始搜索" : "Enter keywords to search"}
                  </div>
                ) : !hasResults ? (
                  <div className="px-5 py-8 text-center text-sm text-[#6e6e73]">
                    {locale === "cn" ? "未找到相关结果" : "No results found"}
                  </div>
                ) : (
                  <div className="p-4">
                    {results.products.length > 0 && (
                      <div className="mb-6">
                        <p className="mb-3 px-2 text-xs font-medium text-[#6e6e73] uppercase tracking-wider">
                          {locale === "cn" ? "产品" : "Products"}
                        </p>
                        <div className="space-y-2">
                          {results.products.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 }}
                              className="group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleLinkClick(withLocale(`/products/${product.slug}`, locale))}
                            >
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {product.image && (
                                  <Image unoptimized src={product.image} alt={product.name} width={64} height={64} className="h-full w-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-[#6e6e73] truncate">
                                  {product.subtitle}
                                </p>
                              </div>
                              <ArrowRight size={16} className="text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.posts.length > 0 && (
                      <div>
                        <p className="mb-3 px-2 text-xs font-medium text-[#6e6e73] uppercase tracking-wider">
                          {locale === "cn" ? "新闻" : "News"}
                        </p>
                        <div className="space-y-2">
                          {results.posts.map((post) => (
                            <motion.div
                              key={post.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleLinkClick(withLocale(`/news/${post.slug}`, locale))}
                            >
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {post.image && (
                                  <Image unoptimized src={post.image} alt={post.title} width={64} height={64} className="h-full w-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                                  {post.title}
                                </p>
                                <p className="text-xs text-[#6e6e73] truncate">
                                  {post.excerpt}
                                </p>
                              </div>
                              <ArrowRight size={16} className="text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
