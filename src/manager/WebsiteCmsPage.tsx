import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Link,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Pencil,
  Phone,
  Plus,
  Radio,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createGalleryPhoto,
  createWebsiteBlog,
  createWebsiteOffer,
  deleteGalleryPhoto,
  deleteWebsiteBlog,
  deleteWebsiteOffer,
  fetchWebsiteBlogs,
  fetchWebsiteContent,
  fetchWebsiteGallery,
  fetchWebsiteOffers,
  updateWebsiteBlog,
  updateWebsiteContent,
  updateWebsiteOffer,
  type BlogItem,
  type GalleryItem,
  type OfferItem,
  type WebsiteContent,
} from "../api/website";
import { ImageUploadPicker } from "../components/ImageUploadPicker";

type CmsTab = "gallery" | "offers" | "blogs" | "about_contact";

export default function WebsiteCmsPage({
  isDemoAccount = false,
  showToast,
}: {
  isDemoAccount?: boolean;
  showToast?: (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => void;
}) {
  const blockDemoAction = (action: string) => {
    if (!isDemoAccount) return false;
    showToast?.(
      "error",
      "Demo access only",
      `${action} is disabled for the demo account.`,
    );
    return true;
  };
  const demoActionClass = isDemoAccount
    ? "cursor-not-allowed opacity-60"
    : "cursor-pointer";
  const [activeTab, setActiveTab] = useState<CmsTab>("gallery");
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Data states
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  // Add Photo Modal
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoCategory, setNewPhotoCategory] = useState<
    "Ambience" | "Nightlife & Club" | "Drinks & Cocktails" | "Cuisine"
  >("Ambience");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoFeatured, setNewPhotoFeatured] = useState(false);

  // Add Offer Modal
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferSubtitle, setNewOfferSubtitle] = useState("");
  const [newOfferBadge, setNewOfferBadge] = useState("SPECIAL");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferUrl, setNewOfferUrl] = useState("");
  const [newOfferValid, setNewOfferValid] = useState("Limited Time");
  const [newOfferTerms, setNewOfferTerms] = useState("");

  // Add Blog Modal
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState("");
  const [newBlogCategory, setNewBlogCategory] = useState("Mixology");
  const [newBlogAuthor, setNewBlogAuthor] = useState("Editorial Team");
  const [newBlogReadTime, setNewBlogReadTime] = useState("4 min read");
  const [newBlogExcerpt, setNewBlogExcerpt] = useState("");
  const [newBlogContent, setNewBlogContent] = useState("");
  const [newBlogUrl, setNewBlogUrl] = useState("");

  // Edit Offer Modal
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [editOfferTitle, setEditOfferTitle] = useState("");
  const [editOfferSubtitle, setEditOfferSubtitle] = useState("");
  const [editOfferBadge, setEditOfferBadge] = useState("SPECIAL");
  const [editOfferDesc, setEditOfferDesc] = useState("");
  const [editOfferUrl, setEditOfferUrl] = useState("");
  const [editOfferValid, setEditOfferValid] = useState("");
  const [editOfferTerms, setEditOfferTerms] = useState("");

  const handleStartEditOffer = (offer: OfferItem) => {
    if (blockDemoAction("Editing website offers")) return;
    setEditingOffer(offer);
    setEditOfferTitle(offer.title);
    setEditOfferSubtitle(offer.subtitle || "");
    setEditOfferBadge(offer.badge || "SPECIAL");
    setEditOfferDesc(offer.description || "");
    setEditOfferUrl(offer.imageUrl || "");
    setEditOfferValid(offer.validUntil || "");
    setEditOfferTerms(offer.terms || "");
  };

  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Editing website offers")) return;
    if (!editingOffer) return;
    try {
      const updated = await updateWebsiteOffer(editingOffer.id, {
        title: editOfferTitle.trim(),
        subtitle: editOfferSubtitle.trim(),
        badge: editOfferBadge.trim(),
        description: editOfferDesc.trim(),
        imageUrl: editOfferUrl.trim(),
        validUntil: editOfferValid.trim(),
        terms: editOfferTerms.trim(),
      });
      setOffers((prev) =>
        prev.map((o) => (o.id === editingOffer.id ? updated : o)),
      );
      setEditingOffer(null);
      triggerToast("Offer updated successfully!");
      refreshAll();
    } catch {
      alert("Failed to update offer");
    }
  };

  // Edit Blog Modal
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [editBlogTitle, setEditBlogTitle] = useState("");
  const [editBlogCategory, setEditBlogCategory] = useState("Mixology");
  const [editBlogAuthor, setEditBlogAuthor] = useState("Editorial Team");
  const [editBlogReadTime, setEditBlogReadTime] = useState("4 min read");
  const [editBlogPublishDate, setEditBlogPublishDate] = useState("");
  const [editBlogExcerpt, setEditBlogExcerpt] = useState("");
  const [editBlogContent, setEditBlogContent] = useState("");
  const [editBlogUrl, setEditBlogUrl] = useState("");

  const handleStartEditBlog = (blog: BlogItem) => {
    if (blockDemoAction("Editing website blogs")) return;
    setEditingBlog(blog);
    setEditBlogTitle(blog.title);
    setEditBlogCategory(blog.category || "Cocktail Culture");
    setEditBlogAuthor(blog.author || "Editorial Team");
    setEditBlogReadTime(blog.readTime || "4 min read");
    setEditBlogPublishDate(blog.publishDate || "");
    setEditBlogExcerpt(blog.excerpt || "");
    setEditBlogContent(blog.content || "");
    setEditBlogUrl(blog.imageUrl || "");
  };

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Editing website blogs")) return;
    if (!editingBlog) return;
    try {
      const updated = await updateWebsiteBlog(editingBlog.id, {
        title: editBlogTitle.trim(),
        category: editBlogCategory.trim(),
        author: editBlogAuthor.trim(),
        readTime: editBlogReadTime.trim(),
        publishDate: editBlogPublishDate.trim(),
        excerpt: editBlogExcerpt.trim(),
        content: editBlogContent.trim(),
        imageUrl: editBlogUrl.trim(),
      });
      setBlogs((prev) =>
        prev.map((b) => (b.id === editingBlog.id ? updated : b)),
      );
      setEditingBlog(null);
      triggerToast("Blog updated successfully!");
      refreshAll();
    } catch {
      alert("Failed to update blog post");
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [c, g, o, b] = await Promise.all([
        fetchWebsiteContent(),
        fetchWebsiteGallery(),
        fetchWebsiteOffers(),
        fetchWebsiteBlogs(),
      ]);
      setContent(c);
      setGallery(g);
      setOffers(o);
      setBlogs(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const triggerToast = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Gallery handlers
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Adding website photos")) return;
    if (!newPhotoTitle.trim() || !newPhotoUrl.trim()) return;
    try {
      await createGalleryPhoto({
        title: newPhotoTitle.trim(),
        category: newPhotoCategory,
        imageUrl: newPhotoUrl.trim(),
        isFeatured: newPhotoFeatured,
      });
      setShowAddPhotoModal(false);
      setNewPhotoTitle("");
      setNewPhotoUrl("");
      triggerToast("Photo added to website gallery!");
      refreshAll();
    } catch {
      alert("Failed to add photo");
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (blockDemoAction("Deleting website photos")) return;
    if (
      !confirm("Are you sure you want to remove this photo from the website?")
    )
      return;
    try {
      await deleteGalleryPhoto(id);
      triggerToast("Photo removed from gallery.");
      refreshAll();
    } catch {
      alert("Failed to delete photo");
    }
  };

  // Offers handlers
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Creating website offers")) return;
    if (!newOfferTitle.trim() || !newOfferUrl.trim()) return;
    try {
      await createWebsiteOffer({
        title: newOfferTitle.trim(),
        subtitle: newOfferSubtitle.trim(),
        badge: newOfferBadge.trim(),
        description: newOfferDesc.trim(),
        imageUrl: newOfferUrl.trim(),
        validUntil: newOfferValid.trim(),
        terms: newOfferTerms.trim(),
        isActive: true,
      });
      setShowAddOfferModal(false);
      setNewOfferTitle("");
      setNewOfferSubtitle("");
      setNewOfferDesc("");
      setNewOfferUrl("");
      triggerToast("Offer published to website!");
      refreshAll();
    } catch {
      alert("Failed to create offer");
    }
  };

  const handleToggleOffer = async (id: string, currentStatus: boolean) => {
    if (blockDemoAction("Changing website offers")) return;
    try {
      await updateWebsiteOffer(id, { isActive: !currentStatus });
      triggerToast(`Offer ${!currentStatus ? "activated" : "deactivated"}`);
      refreshAll();
    } catch {
      alert("Failed to update offer status");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (blockDemoAction("Deleting website offers")) return;
    if (!confirm("Delete this promotional offer?")) return;
    try {
      await deleteWebsiteOffer(id);
      triggerToast("Offer removed.");
      refreshAll();
    } catch {
      alert("Failed to delete offer");
    }
  };

  // Blog handlers
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Publishing website blogs")) return;
    if (!newBlogTitle.trim() || !newBlogContent.trim()) return;
    try {
      await createWebsiteBlog({
        title: newBlogTitle.trim(),
        category: newBlogCategory.trim(),
        author: newBlogAuthor.trim(),
        readTime: newBlogReadTime.trim(),
        publishDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        excerpt: newBlogExcerpt.trim(),
        content: newBlogContent.trim(),
        imageUrl:
          newBlogUrl.trim() ||
          "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
      });
      setShowAddBlogModal(false);
      setNewBlogTitle("");
      setNewBlogExcerpt("");
      setNewBlogContent("");
      setNewBlogUrl("");
      triggerToast("Blog published to website!");
      refreshAll();
    } catch {
      alert("Failed to create blog post");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (blockDemoAction("Deleting website blogs")) return;
    if (!confirm("Delete this blog post?")) return;
    try {
      await deleteWebsiteBlog(id);
      triggerToast("Blog deleted.");
      refreshAll();
    } catch {
      alert("Failed to delete blog post");
    }
  };

  // Content Save handler
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockDemoAction("Saving website content")) return;
    if (!content) return;
    try {
      await updateWebsiteContent(content);
      triggerToast("Website details updated successfully!");
    } catch {
      alert("Failed to save website content");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#e8f1e8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#315a3d]">
              Public Website CMS
            </span>
            <span className="text-xs text-[#84908a]">Live on domain.com</span>
          </div>
          <h1 className="display-font mt-1 text-2xl font-bold text-[#24312e] sm:text-3xl">
            Website Content & Media Management
          </h1>
          <p className="mt-1 text-xs text-[#68736e]">
            Manage club photos, promotional offers, blog posts, and contact info
            displayed on your public website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs font-bold text-[#24312e] hover:bg-[#fbfaf7] transition shadow-xs"
          >
            <ExternalLink size={14} />
            <span>Preview Website</span>
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {saveMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-b border-[#e4e5df] pb-px">
        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-t-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "gallery"
              ? "border-[#315a3d] bg-white text-[#315a3d]"
              : "border-transparent text-[#74807a] hover:bg-[#f0f1ed]"
          }`}
        >
          <Camera size={14} className="shrink-0" />
          <span>Club Photos & Gallery ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("offers")}
          className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-t-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "offers"
              ? "border-[#315a3d] bg-white text-[#315a3d]"
              : "border-transparent text-[#74807a] hover:bg-[#f0f1ed]"
          }`}
        >
          <Tag size={14} className="shrink-0" />
          <span>Offers & Events ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("blogs")}
          className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-t-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "blogs"
              ? "border-[#315a3d] bg-white text-[#315a3d]"
              : "border-transparent text-[#74807a] hover:bg-[#f0f1ed]"
          }`}
        >
          <Newspaper size={14} className="shrink-0" />
          <span>Blogs ({blogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("about_contact")}
          className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-t-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "about_contact"
              ? "border-[#315a3d] bg-white text-[#315a3d]"
              : "border-transparent text-[#74807a] hover:bg-[#f0f1ed]"
          }`}
        >
          <Globe2 size={14} className="shrink-0" />
          <span>About & Contact Settings</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. GALLERY TAB                                       */}
      {/* ==================================================== */}
      {activeTab === "gallery" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs font-bold text-[#68736e]">
              Total Photos Displayed on Website:{" "}
              <strong>{gallery.length}</strong>
            </p>
            <button
              onClick={() => {
                if (blockDemoAction("Adding website photos")) return;
                setShowAddPhotoModal(true);
              }}
              aria-disabled={isDemoAccount}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-2.5 text-xs font-bold text-white transition shadow-xs ${demoActionClass}`}
            >
              <Plus size={15} />
              <span>Add New Photo</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-[#dfe1dc] bg-white p-3 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f0f1ed]">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                      {photo.category}
                    </span>
                    {photo.isFeatured && (
                      <span className="absolute top-2 right-2 rounded-md bg-[#f4bc83] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#141d1a]">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 font-bold text-[#24312e] text-xs sm:text-sm">
                    {photo.title}
                  </h3>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#f0f1ed] pt-2">
                  <span className="text-[10px] text-[#84908a]">
                    Added: {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className={`flex items-center gap-1 text-[11px] font-bold text-red-600 transition ${demoActionClass}`}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. OFFERS TAB                                        */}
      {/* ==================================================== */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs font-bold text-[#68736e]">
              Active Promotions on Website: <strong>{offers.length}</strong>
            </p>
            <button
              onClick={() => {
                if (blockDemoAction("Creating website offers")) return;
                setShowAddOfferModal(true);
              }}
              aria-disabled={isDemoAccount}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-2.5 text-xs font-bold text-white transition shadow-xs ${demoActionClass}`}
            >
              <Plus size={15} />
              <span>Create New Offer</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex flex-col justify-between rounded-2xl border border-[#dfe1dc] bg-white p-3.5 sm:p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="rounded-md bg-[#f4bc83] px-2 py-0.5 text-[9px] font-black uppercase text-[#141c19]">
                          {offer.badge}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${offer.isActive ? "text-emerald-700" : "text-gray-400"}`}
                        >
                          ● {offer.isActive ? "Live on site" : "Deactivated"}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-bold text-[#24312e] text-sm sm:text-base">
                        {offer.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#b7623d]">
                        {offer.subtitle}
                      </p>
                    </div>

                    <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0f1ed]">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#68736e]">
                    {offer.description}
                  </p>

                  <div className="mt-3 rounded-lg bg-[#fbfaf7] p-2 text-[11px] text-[#84908a]">
                    <strong>Validity:</strong> {offer.validUntil}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f1ed] pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleToggleOffer(offer.id, offer.isActive)
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${demoActionClass} ${
                        offer.isActive
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {offer.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => handleStartEditOffer(offer)}
                      className={`flex items-center gap-1.5 rounded-lg border border-[#dfe1dc] bg-[#fbfaf7] px-2.5 py-1 text-xs font-bold text-[#24312e] transition shadow-2xs ${demoActionClass}`}
                    >
                      <Pencil size={13} className="text-[#315a3d]" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className={`flex items-center gap-1 text-xs font-bold text-red-600 transition ${demoActionClass}`}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. BLOGS TAB                                         */}
      {/* ==================================================== */}
      {activeTab === "blogs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs font-bold text-[#68736e]">
              Articles Published: <strong>{blogs.length}</strong>
            </p>
            <button
              onClick={() => {
                if (blockDemoAction("Publishing website blogs")) return;
                setShowAddBlogModal(true);
              }}
              aria-disabled={isDemoAccount}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-2.5 text-xs font-bold text-white transition shadow-xs ${demoActionClass}`}
            >
              <Plus size={15} />
              <span>Publish New Blog</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="flex flex-col justify-between rounded-2xl border border-[#dfe1dc] bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#84908a]">
                    <span className="font-bold text-[#315a3d]">
                      {blog.category}
                    </span>
                    <span>
                      {blog.readTime} · {blog.publishDate}
                    </span>
                  </div>
                  <h3 className="mt-1 font-bold text-[#24312e] text-base">
                    {blog.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#68736e] line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <p className="mt-2 text-[11px] text-[#84908a]">
                    Author: <strong>{blog.author}</strong>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f0f1ed] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700">
                      ● Published on Website
                    </span>
                    <button
                      onClick={() => handleStartEditBlog(blog)}
                      className={`flex items-center gap-1.5 rounded-lg border border-[#dfe1dc] bg-[#fbfaf7] px-2.5 py-1 text-xs font-bold text-[#24312e] transition shadow-2xs ${demoActionClass}`}
                    >
                      <Pencil size={13} className="text-[#315a3d]" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteBlog(blog.id)}
                    className={`flex items-center gap-1 text-xs font-bold text-red-600 transition ${demoActionClass}`}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. ABOUT & CONTACT TAB                               */}
      {/* ==================================================== */}
      {activeTab === "about_contact" && content && (
        <form
          onSubmit={handleSaveContent}
          className="rounded-3xl border border-[#dfe1dc] bg-white p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6"
        >
          <div className="border-b border-[#f0f1ed] pb-4">
            <h2 className="display-font text-xl font-bold text-[#24312e]">
              Brand Identity & Hero Headlines
            </h2>
            <p className="text-xs text-[#84908a]">
              These headlines appear in the prominent top hero of your website.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Restaurant Name
              </label>
              <input
                type="text"
                value={content.restaurantName}
                onChange={(e) =>
                  setContent({ ...content, restaurantName: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Hero Main Tagline
              </label>
              <input
                type="text"
                value={content.tagline}
                onChange={(e) =>
                  setContent({ ...content, tagline: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#68736e]">
              Hero Subtitle Description
            </label>
            <textarea
              rows={2}
              value={content.heroSubtitle}
              onChange={(e) =>
                setContent({ ...content, heroSubtitle: e.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
            />
          </div>

          <div className="border-b border-[#f0f1ed] pt-4 pb-2">
            <h2 className="display-font text-xl font-bold text-[#24312e]">
              About The Restro-Lounge Story
            </h2>
            <p className="text-xs text-[#84908a]">
              The philosophy, architectural concept, and experience highlights.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#68736e]">
              About Section Title
            </label>
            <input
              type="text"
              value={content.aboutTitle}
              onChange={(e) =>
                setContent({ ...content, aboutTitle: e.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Story Paragraph 1
              </label>
              <textarea
                rows={4}
                value={content.aboutStoryP1}
                onChange={(e) =>
                  setContent({ ...content, aboutStoryP1: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Story Paragraph 2
              </label>
              <textarea
                rows={4}
                value={content.aboutStoryP2}
                onChange={(e) =>
                  setContent({ ...content, aboutStoryP2: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
          </div>

          <div className="border-b border-[#f0f1ed] pt-4 pb-2">
            <h2 className="display-font text-xl font-bold text-[#24312e]">
              Contact, Address & Operational Schedule
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Reservation Hotline
              </label>
              <input
                type="text"
                value={content.reservationHotline}
                onChange={(e) =>
                  setContent({ ...content, reservationHotline: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Desk Phone
              </label>
              <input
                type="text"
                value={content.phone}
                onChange={(e) =>
                  setContent({ ...content, phone: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Inquiry Email
              </label>
              <input
                type="email"
                value={content.email}
                onChange={(e) =>
                  setContent({ ...content, email: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Full Address
              </label>
              <input
                type="text"
                value={content.address}
                onChange={(e) =>
                  setContent({ ...content, address: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Operating Hours
              </label>
              <input
                type="text"
                value={content.operatingHours}
                onChange={(e) =>
                  setContent({ ...content, operatingHours: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Google Maps URL
              </label>
              <input
                type="text"
                value={content.googleMapsUrl}
                onChange={(e) =>
                  setContent({ ...content, googleMapsUrl: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Instagram Page URL
              </label>
              <input
                type="text"
                value={content.instagramUrl}
                onChange={(e) =>
                  setContent({ ...content, instagramUrl: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#68736e]">
                Facebook Page URL
              </label>
              <input
                type="text"
                value={content.facebookUrl}
                onChange={(e) =>
                  setContent({ ...content, facebookUrl: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#315a3d]"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#24312e] px-6 py-3 text-xs font-bold text-white hover:bg-[#315a3d] transition shadow-md cursor-pointer"
            >
              <Save size={15} />
              <span>Save Website Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD PHOTO                                     */}
      {/* ==================================================== */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
          <form
            onSubmit={handleCreatePhoto}
            className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border border-[#dfe1dc] bg-white shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-[#f0f1ed] px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
              <h3 className="display-font text-base sm:text-lg font-bold text-[#24312e]">
                Add Photo to Club Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="rounded-lg p-1 text-[#84908a] hover:bg-[#f0f1ed] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Photo Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Rooftop Cabanas"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2.5 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Category
                </label>
                <select
                  value={newPhotoCategory}
                  onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2.5 text-xs font-semibold outline-none focus:border-[#315a3d]"
                >
                  <option value="Ambience">Ambience & Interiors</option>
                  <option value="Nightlife & Club">Nightlife & Club</option>
                  <option value="Drinks & Cocktails">Drinks & Cocktails</option>
                  <option value="Cuisine">Cuisine</option>
                </select>
              </div>

              <div>
                <ImageUploadPicker
                  label="Photo Image"
                  value={newPhotoUrl}
                  onChange={setNewPhotoUrl}
                  required
                  helpText="Upload from your device or enter a web image URL."
                  previewAspect="landscape"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={newPhotoFeatured}
                  onChange={(e) => setNewPhotoFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-[#dfe1dc] text-[#315a3d] focus:ring-0"
                />
                <label
                  htmlFor="featuredCheck"
                  className="text-xs font-bold text-[#24312e] cursor-pointer"
                >
                  Feature in homepage highlights
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f0f1ed] px-6 py-4 shrink-0 bg-[#fafbfa]">
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition"
              >
                Upload Photo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD OFFER                                     */}
      {/* ==================================================== */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
          <form
            onSubmit={handleCreateOffer}
            className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border border-[#dfe1dc] bg-white shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-[#f0f1ed] px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
              <h3 className="display-font text-base sm:text-lg font-bold text-[#24312e]">
                Create Website Promotion / Offer
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOfferModal(false)}
                className="rounded-lg p-1 text-[#84908a] hover:bg-[#f0f1ed] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Offer Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Off On Cocktails"
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sundowner Hours"
                    value={newOfferSubtitle}
                    onChange={(e) => setNewOfferSubtitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1+1 FREE"
                    value={newOfferBadge}
                    onChange={(e) => setNewOfferBadge(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Details of the offer..."
                  value={newOfferDesc}
                  onChange={(e) => setNewOfferDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <ImageUploadPicker
                  label="Offer Banner Image"
                  value={newOfferUrl}
                  onChange={setNewOfferUrl}
                  required
                  helpText="Upload promotional flyer or dish photo."
                  previewAspect="landscape"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Validity Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daily · 4 PM to 8 PM"
                    value={newOfferValid}
                    onChange={(e) => setNewOfferValid(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Club rules apply"
                    value={newOfferTerms}
                    onChange={(e) => setNewOfferTerms(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f0f1ed] px-6 py-4 shrink-0 bg-[#fafbfa]">
              <button
                type="button"
                onClick={() => setShowAddOfferModal(false)}
                className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition"
              >
                Publish Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD BLOG STORY                                */}
      {/* ==================================================== */}
      {showAddBlogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
          <form
            onSubmit={handleCreateBlog}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border border-[#dfe1dc] bg-white shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-[#f0f1ed] px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
              <h3 className="display-font text-base sm:text-lg font-bold text-[#24312e]">
                Publish New Blog Post
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBlogModal(false)}
                className="rounded-lg p-1 text-[#84908a] hover:bg-[#f0f1ed] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Secrets of Medieval Mixology"
                  value={newBlogTitle}
                  onChange={(e) => setNewBlogTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newBlogCategory}
                    onChange={(e) => setNewBlogCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Author
                  </label>
                  <input
                    type="text"
                    value={newBlogAuthor}
                    onChange={(e) => setNewBlogAuthor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={newBlogReadTime}
                    onChange={(e) => setNewBlogReadTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Short Excerpt
                </label>
                <input
                  type="text"
                  placeholder="1-sentence preview shown on cards..."
                  value={newBlogExcerpt}
                  onChange={(e) => setNewBlogExcerpt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Full Article Body
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the full story here..."
                  value={newBlogContent}
                  onChange={(e) => setNewBlogContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <ImageUploadPicker
                  label="Article Cover Photo"
                  value={newBlogUrl}
                  onChange={setNewBlogUrl}
                  helpText="Upload an article cover photo or select from web."
                  previewAspect="video"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f0f1ed] px-6 py-4 shrink-0 bg-[#fafbfa]">
              <button
                type="button"
                onClick={() => setShowAddBlogModal(false)}
                className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition"
              >
                Publish Article
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT OFFER                                    */}
      {/* ==================================================== */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
          <form
            onSubmit={handleUpdateOffer}
            className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border border-[#dfe1dc] bg-white shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-[#f0f1ed] px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
              <h3 className="display-font text-base sm:text-lg font-bold text-[#24312e]">
                Edit Website Promotion / Offer
              </h3>
              <button
                type="button"
                onClick={() => setEditingOffer(null)}
                className="rounded-lg p-1 text-[#84908a] hover:bg-[#f0f1ed] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Offer Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Off On Cocktails"
                  value={editOfferTitle}
                  onChange={(e) => setEditOfferTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Happy Hours Special"
                    value={editOfferSubtitle}
                    onChange={(e) => setEditOfferSubtitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SPECIAL, 1+1"
                    value={editOfferBadge}
                    onChange={(e) => setEditOfferBadge(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Details of the offer..."
                  value={editOfferDesc}
                  onChange={(e) => setEditOfferDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <ImageUploadPicker
                  label="Offer Banner Image"
                  value={editOfferUrl}
                  onChange={setEditOfferUrl}
                  required
                  helpText="Upload promotional flyer or dish photo from device or web."
                  previewAspect="landscape"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Validity Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daily · 4 PM to 8 PM"
                    value={editOfferValid}
                    onChange={(e) => setEditOfferValid(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Club rules apply"
                    value={editOfferTerms}
                    onChange={(e) => setEditOfferTerms(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f0f1ed] px-6 py-4 shrink-0 bg-[#fafbfa]">
              <button
                type="button"
                onClick={() => setEditingOffer(null)}
                className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT BLOG / STORY                             */}
      {/* ==================================================== */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
          <form
            onSubmit={handleUpdateBlog}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border border-[#dfe1dc] bg-white shadow-2xl overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-[#f0f1ed] px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
              <h3 className="display-font text-base sm:text-lg font-bold text-[#24312e]">
                Edit Blog Post
              </h3>
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
                className="rounded-lg p-1 text-[#84908a] hover:bg-[#f0f1ed] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Secrets of Smoked Bourbon"
                  value={editBlogTitle}
                  onChange={(e) => setEditBlogTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editBlogCategory}
                    onChange={(e) => setEditBlogCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Author
                  </label>
                  <input
                    type="text"
                    value={editBlogAuthor}
                    onChange={(e) => setEditBlogAuthor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#68736e]">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={editBlogReadTime}
                    onChange={(e) => setEditBlogReadTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Short Excerpt
                </label>
                <input
                  type="text"
                  placeholder="1-sentence preview shown on cards..."
                  value={editBlogExcerpt}
                  onChange={(e) => setEditBlogExcerpt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#68736e]">
                  Full Article Body
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write the full story here..."
                  value={editBlogContent}
                  onChange={(e) => setEditBlogContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] p-2 text-xs font-semibold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div>
                <ImageUploadPicker
                  label="Article Cover Photo"
                  value={editBlogUrl}
                  onChange={setEditBlogUrl}
                  helpText="Upload an article cover photo or select from web."
                  previewAspect="video"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#f0f1ed] px-6 py-4 shrink-0 bg-[#fafbfa]">
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
                className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
