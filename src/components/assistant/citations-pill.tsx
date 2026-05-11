"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ExternalLink } from 'lucide-react';

export function CitationsPill({ citations }: { citations: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  // Extract unique hostnames for the avatars
  const uniqueDomains = Array.from(new Set(citations.map(url => {
    try { return new URL(url).hostname; } catch { return ''; }
  }))).filter(Boolean);

  const previewDomains = uniqueDomains.slice(0, 3);

  return (
    <div className="w-full my-3">
      {/* ── Sources Pill Button ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-fit px-2 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-gray-200/60 dark:border-white/10 rounded-full transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex -space-x-1.5 pl-0.5">
          {previewDomains.map((domain, i) => (
            <div
              key={domain}
              className="w-[22px] h-[22px] rounded-full border border-white dark:border-[#141821] bg-white dark:bg-gray-800 overflow-hidden shrink-0 shadow-sm flex items-center justify-center"
              style={{ zIndex: previewDomains.length - i }}
            >
              <img 
                src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} 
                alt={domain} 
                className="w-3.5 h-3.5 object-contain" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
                }} 
              />
            </div>
          ))}
        </div>
        <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 pr-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {citations.length} fuentes
        </span>
      </button>

      {/* ── Expanded Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="
              w-full max-w-sm
              bg-white dark:bg-[#141821]
              border border-gray-200/80 dark:border-white/10
              rounded-2xl shadow-sm
              overflow-hidden
            ">
              <div className="max-h-[300px] overflow-y-auto hidden-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                {citations.map((url, i) => {
                  let domain = url;
                  try { domain = new URL(url).hostname; } catch {}
                  return (
                    <a 
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#1890FF]/5 dark:hover:bg-[#1890FF]/5 transition-colors group"
                    >
                      <span className="text-xs font-black text-gray-300 dark:text-gray-700 w-4 text-right tabular-nums shrink-0">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center">
                        <img 
                          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} 
                          alt="" 
                          className="w-4 h-4 object-contain"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
                          }} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#1890FF] transition-colors">{decodeURIComponent(url)}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{domain.replace('www.', '')}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-[#1890FF] shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
