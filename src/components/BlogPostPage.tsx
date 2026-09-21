import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  User,
  Share2,
  Bookmark,
  Sparkles,
  ChefHat,
  CalendarCheck,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import {
  BlogItem,
  WebsiteContent,
  fetchWebsiteBlogs,
  fetchWebsiteContent,
} from "../api/website";
import { useWebsiteTheme, WebsiteThemePreference } from "../utils/useWebsiteTheme";

export function getBlogSlug(titleOrBlog: string | { title: string }): string {
  const title = typeof titleOrBlog === "string" ? titleOrBlog : titleOrBlog.title;
  if (!title) return "";
  return title
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_");
}

export function matchBlog(blogs: BlogItem[], identifier?: string): BlogItem | null {
  if (!identifier || blogs.length === 0) return blogs[0] || null;
  const normalized = decodeURIComponent(identifier).trim().toLowerCase();
  const normalizedSpaces = normalized.replace(/[_-]+/g, " ");

  // 1. Direct ID match
  const byId = blogs.find((b) => b.id.toLowerCase() === normalized);
  if (byId) return byId;

  // 2. Exact Title match (with spaces or underscores)
  const byExactTitle = blogs.find((b) => {
    const bTitleNorm = b.title.trim().toLowerCase();
    const bTitleUnderscores = bTitleNorm.replace(/[^a-z0-9\s_-]/g, "").replace(/\s+/g, "_");
    return (
      bTitleNorm === normalized ||
      bTitleNorm === normalizedSpaces ||
      bTitleUnderscores === normalized
    );
  });
  if (byExactTitle) return byExactTitle;

  // 3. Partial or substring match
  const bySubstring = blogs.find((b) => {
    const bTitle = b.title.toLowerCase();
    return bTitle.includes(normalizedSpaces) || normalizedSpaces.includes(bTitle);
  });
  if (bySubstring) return bySubstring;

  return blogs[0] || null;
}

interface BlogPostPageProps {
  blogId?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  branchName?: string;
  websiteTheme?: WebsiteThemePreference;
  onBack: () => void;
  onNavigateBookTable: () => void;
  onSelectBlog: (slugOrId: string) => void;
  onNavigateEdit?: () => void;
}

export function BlogPostPage({
  blogId,
  restaurantName,
  restaurantAddress,
  branchName,
  websiteTheme,
  onBack,
  onNavigateBookTable,
  onSelectBlog,
  onNavigateEdit,
}: BlogPostPageProps) {
  const { themePreference, cycleTheme, isDark } = useWebsiteTheme(websiteTheme);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchWebsiteBlogs().then(setBlogs).catch(() => {});
    fetchWebsiteContent().then(setContent).catch(() => {});
  }, [blogId]);

  const activeBlog = matchBlog(blogs, blogId);

  const otherBlogs = blogs.filter((b) => b.id !== activeBlog?.id && b.isPublished !== false);

  const displayName =
    content?.restaurantName && content.restaurantName !== "Lord Of The Drinks"
      ? content.restaurantName
      : restaurantName || "Table & Thyme";

  const displayLocation =
    content?.address ||
    restaurantAddress ||
    (branchName ? `${branchName}, Central Boulevard` : "Connaught Place, Central Boulevard, New Delhi 110001");

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className={`min-h-screen antialiased transition-colors duration-200 ${
        isDark
          ? "bg-[#0a0f0d] text-[#d6e2dc] selection:bg-[#f4bc83] selection:text-[#121b17]"
          : "bg-[#f8f7f4] text-[#24312e] selection:bg-[#f4bc83] selection:text-[#24312e]"
      }`}
    >
      {/* Top Notification Bar */}
      <div
        className={`px-4 py-2 text-center text-xs font-semibold border-b transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#141b19] text-[#f4bc83]"
            : "border-[#e5e1d5] bg-[#f1efe8] text-[#9c6328]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div
            className={`hidden sm:flex items-center gap-2 text-[11px] ${
              isDark ? "text-[#8ea399]" : "text-[#62736b]"
            }`}
          >
            <MapPin size={13} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
            <span>{displayLocation}</span>
          </div>

          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles size={13} className={`animate-pulse ${isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}`} />
            <span>The Culinary & Mixology Journal</span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`hidden md:flex items-center gap-2 text-[11px] ${
                isDark ? "text-[#8ea399]" : "text-[#62736b]"
              }`}
            >
              <Phone size={13} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
              <span>{content?.phone || "+91 98201 11001"}</span>
            </div>

            {/* Quick Theme Switcher */}
            <button
              onClick={cycleTheme}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                isDark
                  ? "border-[#2d3f37] bg-[#1b2723] text-[#f4bc83] hover:bg-[#25352f]"
                  : "border-[#d8d3c5] bg-white text-[#9c6328] hover:bg-[#faf9f6]"
              }`}
              title={`Theme: ${themePreference.toUpperCase()} (Click to toggle System/Light/Dark)`}
            >
              {themePreference === "system" ? (
                <Laptop size={11} />
              ) : isDark ? (
                <Moon size={11} />
              ) : (
                <Sun size={11} />
              )}
              <span className="capitalize">{themePreference}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Header Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? "border-[#24332e]/80 bg-[#0f1614]/95 text-white"
            : "border-[#dfe1dc] bg-white/95 text-[#24312e] shadow-2xs"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              isDark
                ? "border-[#2b3d36] bg-[#16221e] text-[#cfe0d6] hover:border-[#f4bc83] hover:text-white"
                : "border-[#dfe1dc] bg-[#fbfaf7] text-[#24312e] hover:border-[#315a3d] hover:bg-white"
            }`}
          >
            <ArrowLeft size={16} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
            <span>Back to Blogs</span>
          </button>

          {/* Restaurant Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={onBack}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49755] to-[#f4bc83] text-[#16211e] shadow-md font-bold">
              <ChefHat size={20} />
            </div>
            <div>
              <span className={`display-font text-lg font-extrabold tracking-wider ${isDark ? "text-white" : "text-[#24312e]"}`}>
                {displayName}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBookTable}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d49755] via-[#f4bc83] to-[#e4a362] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#141c19] shadow-md hover:scale-105 transition active:scale-95"
            >
              <CalendarCheck size={14} />
              <span className="hidden sm:inline">Reserve Table</span>
            </button>
          </div>
        </div>
      </header>

      {activeBlog ? (
        <main className="py-12 md:py-16">
          <article className="mx-auto max-w-4xl px-4 sm:px-6">
            {/* Breadcrumb */}
            <nav className={`flex items-center gap-2 text-xs font-semibold ${isDark ? "text-[#7c9187]" : "text-[#62736b]"}`}>
              <button onClick={onBack} className={isDark ? "hover:text-[#f4bc83] transition" : "hover:text-[#9c6328] transition"}>
                Home
              </button>
              <ChevronRight size={12} />
              <button onClick={onBack} className={isDark ? "hover:text-[#f4bc83] transition" : "hover:text-[#9c6328] transition"}>
                Blogs
              </button>
              <ChevronRight size={12} />
              <span className={`font-bold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}>{activeBlog.category}</span>
            </nav>

            {/* Header / Meta */}
            <div className="mt-6">
              <span className={`inline-block rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${
                isDark
                  ? "bg-[#f4bc83]/15 text-[#f4bc83] border-[#f4bc83]/30"
                  : "bg-[#b97a38]/10 text-[#9c6328] border-[#b97a38]/30"
              }`}>
                {activeBlog.category}
              </span>

              <h1 className={`display-font mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-[1.15] ${
                isDark ? "text-white" : "text-[#1c2a26]"
              }`}>
                {activeBlog.title}
              </h1>

              {activeBlog.excerpt && (
                <p className={`mt-5 text-base sm:text-xl font-medium leading-relaxed border-l-2 pl-4 ${
                  isDark ? "text-[#b4c9bf] border-[#f4bc83]" : "text-[#4b5e55] border-[#b97a38]"
                }`}>
                  {activeBlog.excerpt}
                </p>
              )}

              {/* Author, Date, Reading Time & Share */}
              <div className={`mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-4 text-xs ${
                isDark ? "border-[#202f29] text-[#9ab0a5]" : "border-[#e0ddd2] text-[#62736b]"
              }`}>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isDark ? "bg-[#22332c] text-[#f4bc83]" : "bg-[#ece9df] text-[#9c6328]"
                    }`}>
                      <User size={14} />
                    </div>
                    <div>
                      <p className={`font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}>{activeBlog.author}</p>
                      <p className={`text-[10px] ${isDark ? "text-[#788d82]" : "text-[#788a80]"}`}>Editorial Contributor</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
                    <span>{activeBlog.publishDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock3 size={13} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
                    <span>{activeBlog.readTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateEdit && (
                    <button
                      onClick={onNavigateEdit}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        isDark
                          ? "border-[#2b3c35] bg-[#14201c] text-[#f4bc83] hover:border-[#f4bc83] hover:bg-[#1f2f29]"
                          : "border-[#dfe1dc] bg-white text-[#9c6328] hover:border-[#9c6328] hover:bg-[#faf9f6]"
                      }`}
                      title="Edit this article in Manager Dashboard"
                    >
                      <Pencil size={13} />
                      <span>Edit Blog</span>
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      isDark
                        ? "border-[#2b3c35] bg-[#14201c] text-[#cfe0d6] hover:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-white text-[#24312e] hover:border-[#9c6328]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-600 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={14} className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"} />
                        <span>Share Article</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Cover Photography */}
            <div className={`mt-8 overflow-hidden rounded-3xl border shadow-xl ${
              isDark ? "border-[#263730] bg-[#15211d]" : "border-[#dfe1dc] bg-white"
            }`}>
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={activeBlog.imageUrl}
                  alt={activeBlog.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Article Content Body */}
            <div className={`mt-10 space-y-6 text-base sm:text-lg leading-relaxed ${
              isDark ? "text-[#c6d7cf]" : "text-[#34443c]"
            }`}>
              {activeBlog.content.split("\n\n").map((paragraph, idx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                // Check if paragraph looks like a quote
                if (trimmed.startsWith('"') || trimmed.startsWith("“")) {
                  return (
                    <blockquote
                      key={idx}
                      className={`my-8 rounded-2xl border-l-4 p-6 text-lg sm:text-xl font-semibold italic shadow-sm ${
                        isDark
                          ? "border-[#f4bc83] bg-[#141f1c] text-white"
                          : "border-[#b97a38] bg-white text-[#1c2a26]"
                      }`}
                    >
                      {trimmed}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Highlights / Takeaways Card */}
            <div className={`mt-12 rounded-3xl border p-6 sm:p-8 ${
              isDark ? "border-[#2b3c36] bg-[#121c19]" : "border-[#dfe1dc] bg-white shadow-xs"
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
              }`}>
                <Sparkles size={16} />
                <span>Blog Highlights</span>
              </div>
              <h3 className={`display-font mt-2 text-xl font-bold sm:text-2xl ${
                isDark ? "text-white" : "text-[#1c2a26]"
              }`}>
                The Essence of {displayName}
              </h3>
              <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-[#9cb1a6]" : "text-[#55635d]"}`}>
                Every evening at {displayName} is an orchestrated harmony of dramatic ambiance, artisanal cocktails torched with natural aromatics, and world cuisine curated for unforgettable evenings.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                  isDark
                    ? "border-[#2b3f37] bg-[#192723] text-[#f4bc83]"
                    : "border-[#e5e1d5] bg-[#f5f3ec] text-[#9c6328]"
                }`}>
                  Handcrafted Mixology
                </span>
                <span className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                  isDark
                    ? "border-[#2b3f37] bg-[#192723] text-[#f4bc83]"
                    : "border-[#e5e1d5] bg-[#f5f3ec] text-[#9c6328]"
                }`}>
                  Medieval Lounge Ambiance
                </span>
                <span className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                  isDark
                    ? "border-[#2b3f37] bg-[#192723] text-[#f4bc83]"
                    : "border-[#e5e1d5] bg-[#f5f3ec] text-[#9c6328]"
                }`}>
                  Live Music & DJ
                </span>
              </div>
            </div>

            {/* Reservation CTA Box */}
            <div className={`mt-12 rounded-3xl border p-8 text-center shadow-2xl relative overflow-hidden ${
              isDark
                ? "border-[#f4bc83]/40 bg-gradient-to-br from-[#1c2925] via-[#15201c] to-[#0f1714] text-white"
                : "border-[#b97a38]/30 bg-gradient-to-br from-[#ffffff] via-[#fbfaf6] to-[#f4efe4] text-[#1c2a26]"
            }`}>
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#f4bc83]/10 blur-3xl pointer-events-none" />
              <p className={`text-xs font-bold uppercase tracking-[.25em] ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}>
                Taste The Experience
              </p>
              <h3 className={`display-font mt-2 text-2xl font-extrabold sm:text-3xl ${isDark ? "text-white" : "text-[#1c2a26]"}`}>
                Experience It Live At {displayName}
              </h3>
              <p className={`mx-auto mt-2 max-w-lg text-xs sm:text-sm ${isDark ? "text-[#92a89e]" : "text-[#55635d]"}`}>
                Reserve your table tonight to experience our signature cocktails and gourmet dining in person.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={onNavigateBookTable}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#d49755] via-[#f4bc83] to-[#e4a362] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#141c19] shadow-xl hover:scale-105 transition active:scale-95"
                >
                  <CalendarCheck size={16} />
                  <span>Reserve Table for Tonight</span>
                </button>
              </div>
            </div>
          </article>

          {/* Related / More Blogs Section */}
          {otherBlogs.length > 0 && (
            <section className={`mt-20 border-t pt-16 ${isDark ? "border-[#22302a]" : "border-[#e0ddd2]"}`}>
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="text-center">
                  <p className={`text-xs font-bold uppercase tracking-[.25em] ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}>
                    More From Our Blogs
                  </p>
                  <h2 className={`display-font mt-2 text-2xl font-extrabold sm:text-3xl ${isDark ? "text-white" : "text-[#1c2a26]"}`}>
                    Related Blogs & Culture
                  </h2>
                </div>

                {/* Center aligned if 1 or 2 items */}
                <div
                  className={`mt-10 ${
                    otherBlogs.length === 1
                      ? "flex justify-center"
                      : otherBlogs.length === 2
                      ? "grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto"
                      : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {otherBlogs.slice(0, 3).map((blog) => (
                    <article
                      key={blog.id}
                      onClick={() => onSelectBlog(getBlogSlug(blog))}
                      className={`group cursor-pointer overflow-hidden rounded-3xl border transition ${
                        isDark
                          ? "border-[#253630] bg-[#131d1a] hover:border-[#f4bc83]/50"
                          : "border-[#dfe1dc] bg-white hover:border-[#9c6328]/50 shadow-2xs"
                      } ${otherBlogs.length === 1 ? "w-full max-w-md" : ""}`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#1a2824]">
                        <img
                          src={blog.imageUrl}
                          alt={blog.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f4bc83] backdrop-blur-md">
                          {blog.category}
                        </span>
                      </div>
                      <div className="p-5">
                        <div className={`flex items-center gap-3 text-[11px] ${isDark ? "text-[#7f948a]" : "text-[#7a8c82]"}`}>
                          <span>{blog.publishDate}</span>
                          <span>·</span>
                          <span>{blog.readTime}</span>
                        </div>
                        <h3 className={`mt-2 text-base font-bold transition ${
                          isDark
                            ? "text-white group-hover:text-[#f4bc83]"
                            : "text-[#1c2a26] group-hover:text-[#9c6328]"
                        }`}>
                          {blog.title}
                        </h3>
                        <p className={`mt-2 text-xs line-clamp-2 ${isDark ? "text-[#8fa39a]" : "text-[#5e6e66]"}`}>
                          {blog.excerpt}
                        </p>
                        <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${
                          isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                        }`}>
                          <span>Read Full Blog</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      ) : (
        <div className="py-32 text-center">
          <p className={`text-sm font-semibold ${isDark ? "text-[#8fa39a]" : "text-[#62736b]"}`}>Blog not found.</p>
          <button
            onClick={onBack}
            className="mt-4 rounded-xl bg-[#f4bc83] px-5 py-2 text-xs font-bold text-[#141c19]"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t py-12 text-xs transition-colors ${
        isDark ? "border-[#202d27] bg-[#0b100e] text-[#7e9187]" : "border-[#dedad0] bg-[#eae7dd] text-[#55635d]"
      }`}>
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className={`display-font text-lg font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}>{displayName}</p>
          <p className={`mt-1 text-[11px] ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}>Restro · Lounge · Nightlife</p>
          <p className="mt-4 text-[11px]">
            © {new Date().getFullYear()} {displayName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
