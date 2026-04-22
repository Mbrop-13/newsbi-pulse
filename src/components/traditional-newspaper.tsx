"use client";

import Link from "next/link";
import { Clock, ShieldCheck, Radio } from "lucide-react";
import { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useViewStore, type ViewDensity, type ViewFontSize } from "@/lib/stores/use-view-store";

/* ─────────────────────────────────────────────────────────
   Traditional Newspaper Layout — proper editorial hierarchy
   Hero → Secondary Row → Section Blocks → Briefs
   ───────────────────────────────────────────────────────── */

import { BookmarkButton } from "./bookmark-button";
import { ReadingListButton } from "./reading-list-button";

/* ── Helpers for density & fontSize mappings ── */

function getDensityClasses(density: ViewDensity) {
  return {
    sectionGap: density === 'compact' ? 'my-4' : density === 'spacious' ? 'my-10' : 'my-8',
    articlePadding: density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-6' : 'py-4',
    articlePaddingLg: density === 'compact' ? 'py-3' : density === 'spacious' ? 'py-7' : 'py-5',
    heroMb: density === 'compact' ? 'mb-3' : density === 'spacious' ? 'mb-8' : 'mb-6',
    innerGap: density === 'compact' ? 'gap-1' : density === 'spacious' ? 'gap-3' : 'gap-2',
  };
}

function getHeroTitleClass(fontSize: ViewFontSize) {
  if (fontSize === 'sm') return 'text-xl sm:text-2xl';
  if (fontSize === 'lg') return 'text-3xl sm:text-4xl';
  return 'text-2xl sm:text-3xl'; // base
}

function getSecondaryTitleClass(fontSize: ViewFontSize) {
  if (fontSize === 'sm') return 'text-base sm:text-lg';
  if (fontSize === 'lg') return 'text-2xl sm:text-3xl';
  return 'text-xl sm:text-2xl'; // base
}

function getBriefTitleClass(fontSize: ViewFontSize) {
  if (fontSize === 'sm') return 'text-sm';
  if (fontSize === 'lg') return 'text-lg';
  return 'text-base'; // base
}

function getHeroSummaryClass(fontSize: ViewFontSize) {
  if (fontSize === 'sm') return 'text-sm sm:text-base';
  if (fontSize === 'lg') return 'text-lg sm:text-xl';
  return 'text-base sm:text-lg'; // base
}

function getSecondarySummaryClass(fontSize: ViewFontSize) {
  if (fontSize === 'sm') return 'text-xs';
  if (fontSize === 'lg') return 'text-base';
  return 'text-sm'; // base
}

function getHeroImageClass(density: ViewDensity) {
  if (density === 'compact') return 'h-[140px] sm:h-[180px]';
  if (density === 'spacious') return 'h-[220px] sm:h-[280px]';
  return 'h-[180px] sm:h-[240px]'; // comfortable
}

function getSecondaryImageClass(density: ViewDensity) {
  if (density === 'compact') return 'h-32 sm:h-36';
  if (density === 'spacious') return 'h-48 sm:h-56';
  return 'h-40 sm:h-48'; // comfortable
}

/* ── Thin horizontal rule ── */
function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-t-2 border-gray-900 dark:border-gray-200 ${className}`} />;
}
function ThinRule({ className = "" }: { className?: string }) {
  return <hr className={`border-t border-gray-300 dark:border-gray-700 ${className}`} />;
}

/* ── Date masthead ── */
function Masthead() {
  const now = new Date();
  const formatted = now.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="text-center py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 font-medium">
        {formatted}
      </p>
    </div>
  );
}

/* ── Hero Article (big story at top) ── */
function HeroArticle({ article, density, fontSize }: { article: NewsArticle; density: ViewDensity; fontSize: ViewFontSize }) {
  const hasEnriched = !!(article.enriched_content && article.enriched_content.length > 50);
  const titleClass = getHeroTitleClass(fontSize);
  const summaryClass = getHeroSummaryClass(fontSize);
  const imageClass = getHeroImageClass(density);
  const contentToDisplay = article.summary ? `${article.summary}\n\n${article.content || ""}` : (article.content || "");

  return (
    <article className="group">
      <Link href={`/article/${article.slug || article.id}`} className="block focus:outline-none">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1890FF]">{article.category}</span>
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-[0.15em]">{article.sources?.[0]?.name || "Noticias"}</span>
          {article.is_live && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
              <Radio className="w-3 h-3 animate-pulse" /> En Vivo
            </span>
          )}
        </div>
        <h2 className={`font-serif font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-gray-50 mb-3 group-hover:text-[#1890FF] transition-colors ${titleClass}`}>
          {article.title}
        </h2>
        {article.image_url && (
          <div className="w-full mb-4 overflow-hidden rounded-none relative">
            <img
              src={article.image_url}
              alt={article.title}
              className={`w-full object-cover rounded-none grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 ${imageClass}`}
            />
            
            {/* Hover Actions Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ReadingListButton 
                article={{
                  id: article.id,
                  title: article.title,
                  category: article.category,
                  image_url: article.image_url || undefined,
                  slug: article.slug,
                  published_at: article.published_at,
                  source: article.sources?.[0]?.name
                }}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#1890FF] hover:text-white border-none" 
              />
              <BookmarkButton articleId={article.id} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#1890FF] hover:text-white border-none" />
            </div>
          </div>
        )}
        <div className={`text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none prose-p:m-0 line-clamp-[14] font-serif ${summaryClass}`}>
          <ReactMarkdown>{contentToDisplay}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-3 mt-4 text-xs text-gray-500 uppercase tracking-wider font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(article.published_at)}</span>
          {hasEnriched && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#1890FF]" /> IA</span>
            </>
          )}
        </div>
      </Link>
    </article>
  );
}

/* ── Secondary Article (medium, used in 2-3 col rows) ── */
function SecondaryArticle({ article, showImage = true, density, fontSize }: { article: NewsArticle; showImage?: boolean; density: ViewDensity; fontSize: ViewFontSize }) {
  const hasEnriched = !!(article.enriched_content && article.enriched_content.length > 50);
  const titleClass = getSecondaryTitleClass(fontSize);
  const summaryClass = getSecondarySummaryClass(fontSize);
  const imageClass = getSecondaryImageClass(density);

  return (
    <article className="group flex flex-col">
      <Link href={`/article/${article.slug || article.id}`} className="flex flex-col gap-2 focus:outline-none">
        {showImage && article.image_url && (
          <div className="w-full overflow-hidden mb-2 rounded-none relative">
            <img
              src={article.image_url}
              alt={article.title}
              className={`w-full object-cover rounded-none grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 ${imageClass}`}
            />
            {/* Hover Actions Overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ReadingListButton 
                article={{
                  id: article.id,
                  title: article.title,
                  category: article.category,
                  image_url: article.image_url || undefined,
                  slug: article.slug,
                  published_at: article.published_at,
                  source: article.sources?.[0]?.name
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#1890FF] hover:text-white border-none scale-90" 
              />
              <BookmarkButton articleId={article.id} className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#1890FF] hover:text-white border-none scale-90" />
            </div>
          </div>
        )}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1890FF]">{article.category}</span>
        <h3 className={`font-serif font-bold leading-tight text-gray-900 dark:text-gray-50 group-hover:text-[#1890FF] transition-colors ${titleClass}`}>
          {article.title}
        </h3>
        <div className={`text-gray-600 dark:text-gray-400 leading-relaxed prose dark:prose-invert max-w-none prose-p:m-0 line-clamp-3 font-serif ${summaryClass}`}>
          <ReactMarkdown>{article.summary || ""}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          <Clock className="w-3 h-3" />
          <span>{formatDate(article.published_at)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>{article.sources?.[0]?.name || "Noticias"}</span>
        </div>
      </Link>
    </article>
  );
}

/* ── Brief Article (headline-only, for dense sidebar-like areas) ── */
function BriefArticle({ article, index, density, fontSize }: { article: NewsArticle; index: number; density: ViewDensity; fontSize: ViewFontSize }) {
  const briefTitleClass = getBriefTitleClass(fontSize);
  const pyClass = density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-4' : 'py-3';

  return (
    <article className={`group ${pyClass} border-b border-gray-200 dark:border-gray-800 last:border-b-0`}>
      <Link href={`/article/${article.slug || article.id}`} className="flex gap-3 focus:outline-none">
        <span className="text-2xl font-serif font-light text-gray-300 dark:text-gray-700 leading-none mt-0.5 shrink-0 w-7 text-right">
          {(index + 1).toString().padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1890FF] block mb-1">{article.category}</span>
          <h4 className={`font-serif font-semibold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-[#1890FF] transition-colors line-clamp-2 ${briefTitleClass}`}>
            {article.title}
          </h4>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">{article.sources?.[0]?.name} · {formatDate(article.published_at)}</p>
        </div>
      </Link>
    </article>
  );
}

/* ── Section Header (e.g. "Más Noticias") ── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <h2 className="font-serif font-bold text-lg sm:text-xl uppercase tracking-wider text-gray-900 dark:text-gray-100 whitespace-nowrap">{title}</h2>
      <div className="flex-1 border-t-2 border-gray-900 dark:border-gray-200" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

interface TraditionalNewspaperProps {
  articles: NewsArticle[];
}

export function TraditionalNewspaper({ articles }: TraditionalNewspaperProps) {
  const { density, fontSize } = useViewStore();

  if (articles.length === 0) return null;

  const dc = getDensityClasses(density);

  // Split articles into hierarchy zones
  const hero = articles[0];
  const heroSidebar = articles.slice(1, 3);       // 2 sidebar articles next to hero
  const secondaryRow = articles.slice(3, 6);      // 3 secondary articles
  const midSection = articles.slice(6, 12);       // 6 articles for 2-col section
  const briefs = articles.slice(12, 20);          // 8 brief headlines
  const moreArticles = articles.slice(20);        // everything else

  // Group "more" articles into sections by category
  const sections = new Map<string, NewsArticle[]>();
  moreArticles.forEach(a => {
    const cat = a.category || "General";
    if (!sections.has(cat)) sections.set(cat, []);
    sections.get(cat)!.push(a);
  });

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Zone 1: HERO + SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-8 lg:pr-6 lg:border-r border-gray-200 dark:border-gray-800">
          <HeroArticle article={hero} density={density} fontSize={fontSize} />
        </div>
        {heroSidebar.length > 0 && (
          <div className="lg:col-span-4 lg:pl-6 flex flex-col gap-0 mt-6 lg:mt-0">
            {heroSidebar.map((article, i) => (
              <div
                key={article.id}
                className={`${dc.articlePadding} ${i > 0 ? "border-t border-gray-200 dark:border-gray-800" : ""}`}
              >
                <SecondaryArticle article={article} showImage={i === 0} density={density} fontSize={fontSize} />
              </div>
            ))}
          </div>
        )}
      </div>
      <ThinRule className={dc.sectionGap} />

      {/* ── Zone 2: SECONDARY ROW (3 columns with vertical dividers) ── */}
      {secondaryRow.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {secondaryRow.map((article, i) => (
              <div
                key={article.id}
                className={`px-0 md:px-5 ${dc.articlePadding} md:py-0 ${
                  i > 0 ? "border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800" : ""
                }`}
              >
                <SecondaryArticle article={article} showImage={i === 0} density={density} fontSize={fontSize} />
              </div>
            ))}
          </div>
          <Rule className={dc.sectionGap} />
        </>
      )}

      {/* ── Zone 3: MID SECTION (2-col: articles left, briefs right) ── */}
      {(midSection.length > 0 || briefs.length > 0) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: 2-col secondary articles */}
            <div className="lg:col-span-8 lg:pr-6 lg:border-r border-gray-200 dark:border-gray-800">
              <SectionHeader title="Más Noticias" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mt-4">
                {midSection.map((article, i) => (
                  <div
                    key={article.id}
                    className={`${dc.articlePaddingLg} ${
                      i % 2 === 1 ? "sm:pl-5 sm:border-l border-gray-200 dark:border-gray-800" : "sm:pr-5"
                    } ${i >= 2 ? "border-t border-gray-200 dark:border-gray-800" : ""}`}
                  >
                    <SecondaryArticle article={article} showImage={i < 2} density={density} fontSize={fontSize} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Brief headlines */}
            {briefs.length > 0 && (
              <div className="lg:col-span-4 lg:pl-6 mt-6 lg:mt-0">
                <SectionHeader title="Titulares" />
                <div className="mt-2">
                  {briefs.map((article, i) => (
                    <BriefArticle key={article.id} article={article} index={i} density={density} fontSize={fontSize} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <Rule className={dc.sectionGap} />
        </>
      )}

      {/* ── Zone 4: ADDITIONAL SECTIONS BY CATEGORY ── */}
      {Array.from(sections.entries()).map(([category, catArticles]) => (
        <div key={category} className={density === 'compact' ? 'mb-6' : density === 'spacious' ? 'mb-14' : 'mb-10'}>
          <SectionHeader title={category} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mt-4">
            {catArticles.slice(0, 6).map((article, i) => (
              <div
                key={article.id}
                className={`${dc.articlePaddingLg} px-0 sm:px-4 first:pl-0 ${
                  i > 0 ? "border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800" : ""
                }`}
              >
                <SecondaryArticle article={article} showImage={i === 0} density={density} fontSize={fontSize} />
              </div>
            ))}
          </div>
          <ThinRule className="mt-6" />
        </div>
      ))}
    </div>
  );
}
