import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock3,
  Coffee,
  CreditCard,
  ExternalLink,
  Flame,
  Globe2,
  Heart,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Menu as MenuIcon,
  MessageSquare,
  Music,
  PartyPopper,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wine,
  X,
  Zap,
  Sun,
  Moon,
  Laptop,
  Building2,
  Smartphone,
} from "lucide-react";
import {
  fetchWebsiteBlogs,
  fetchWebsiteContent,
  fetchWebsiteGallery,
  fetchWebsiteOffers,
  type BlogItem,
  type GalleryItem,
  type OfferItem,
  type WebsiteContent,
} from "../api/website";
import { createBooking, type TableBooking } from "../api/bookings";
import { getBlogSlug } from "./BlogPostPage";
import {
  useWebsiteTheme,
  type WebsiteThemePreference,
} from "../utils/useWebsiteTheme";
import { setDocumentFavicon } from "../utils/favicon";

interface PublicWebsiteProps {
  onNavigateDashboard?: () => void;
  onNavigateEmployeePortal?: () => void;
  onOpenBlog?: (slugOrId: string) => void;
  restaurantName?: string;
  restaurantAddress?: string;
  branchName?: string;
  websiteTheme?: WebsiteThemePreference;
  currencySymbol?: string;
  restaurantLogoUrl?: string;
  faviconUrl?: string;
  kitchenClosed?: boolean;
}

const DEFAULT_SLOTS = [
  "12:30 PM",
  "01:30 PM",
  "03:00 PM",
  "05:00 PM",
  "07:00 PM",
  "08:30 PM",
  "09:30 PM",
  "10:30 PM",
];

const SEATING_ZONES = [
  {
    id: "Main Medieval Lounge",
    desc: "Grand arches, mood lighting & center bar",
  },
  { id: "Sky Terrace & Rooftop", desc: "Open-air cabanas with skyline breeze" },
  {
    id: "VIP DJ Club Zone",
    desc: "High-energy dance floor & artist proximity",
  },
  {
    id: "Private Dining Cellar",
    desc: "Exclusive seclusion for groups & private events",
  },
];

export default function PublicWebsite({
  onNavigateDashboard,
  onNavigateEmployeePortal,
  onOpenBlog,
  restaurantName,
  restaurantAddress,
  branchName,
  websiteTheme,
  currencySymbol: propCurrencySymbol = "₹",
  restaurantLogoUrl,
  faviconUrl,
  kitchenClosed = false,
}: PublicWebsiteProps) {
  const { themePreference, cycleTheme, isDark } = useWebsiteTheme(websiteTheme);

  // CMS States
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState("All");

  const restroName =
    content?.restaurantName && content.restaurantName !== "Lord Of The Drinks"
      ? content.restaurantName
      : restaurantName || "Table & Thyme";

  const activeLogoUrl = content?.logoUrl || restaurantLogoUrl || "";
  const activeFaviconUrl = content?.faviconUrl || faviconUrl || "";

  useEffect(() => {
    if (activeFaviconUrl) {
      setDocumentFavicon(activeFaviconUrl);
    }
  }, [activeFaviconUrl]);

  const displayLocation =
    content?.address ||
    restaurantAddress ||
    (branchName
      ? `${branchName}, Central Boulevard`
      : "Connaught Place, Central Boulevard, New Delhi 110001");

  const displayLocationShort = branchName
    ? `${branchName} Flagship`
    : displayLocation.split(",")[0] || "Connaught Place Flagship";

  useEffect(() => {
    document.title = `${restroName} · Luxury Restro-Lounge & Nightlife`;
  }, [restroName]);

  // Booking Form States
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState("08:30 PM");
  const [guests, setGuests] = useState(2);
  const [seatingZone, setSeatingZone] = useState("Main Medieval Lounge");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<TableBooking | null>(
    null,
  );
  const [bookingError, setBookingError] = useState("");

  // Modals & Viewers
  const [activePhotoModal, setActivePhotoModal] = useState<GalleryItem | null>(
    null,
  );
  const [activeBlogModal, setActiveBlogModal] = useState<BlogItem | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    fetchWebsiteContent()
      .then(setContent)
      .catch(() => {});
    fetchWebsiteGallery()
      .then(setGallery)
      .catch(() => {});
    fetchWebsiteOffers()
      .then(setOffers)
      .catch(() => {});
    fetchWebsiteBlogs()
      .then(setBlogs)
      .catch(() => {});
  }, []);

  const filteredGallery = gallery.filter((item) =>
    selectedGalleryCategory === "All"
      ? true
      : item.category === selectedGalleryCategory,
  );

  const activeOffers = offers.filter((o) => o.isActive !== false);
  const publishedBlogs = blogs.filter((b) => b.isPublished !== false);

  const depositAmount =
    content?.reservationDeposit !== undefined
      ? content.reservationDeposit
      : 500;
  const currencySymbol = content?.currencySymbol || propCurrencySymbol || "₹";

  // PayU Payment Gateway States
  const [isPayUModalOpen, setIsPayUModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [payuConfig, setPayuConfig] = useState<{
    mode: "live" | "test" | "sandbox";
    isConfigured: boolean;
    merchantKey?: string;
  }>({
    mode: content?.payuMerchantKey
      ? content?.payuTestMode
        ? "test"
        : "live"
      : "sandbox",
    isConfigured: Boolean(content?.payuMerchantKey),
  });

  const closePayUPaymentModal = () => {
    setIsPayUModalOpen(false);
    setIsProcessingPayment(false);
    setPaymentError("");
  };

  useEffect(() => {
    fetch("/api/payments/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success) {
          setPayuConfig({
            mode: data.mode,
            isConfigured: Boolean(data.isConfigured),
            merchantKey: data.merchantKey,
          });
        }
      })
      .catch(() => {});
  }, [content?.payuMerchantKey, content?.payuTestMode]);

  // Handle return redirect from PayU India Gateway
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get("booking_success") === "true";
      const errorMsg = urlParams.get("booking_error");

      if (isSuccess) {
        const txnid = urlParams.get("txnid") || "";
        const customer = urlParams.get("customer") || "Valued Guest";
        const date = urlParams.get("date") || "";
        const time = urlParams.get("time") || "";
        const guestsParam = Number(urlParams.get("guests")) || 2;
        const depositParam = Number(urlParams.get("deposit")) || depositAmount;
        const bookingId = urlParams.get("booking_id") || `book_${Date.now()}`;

        setBookingSuccess({
          id: bookingId,
          customer,
          phone: "",
          email: "",
          bookingDate: date,
          bookingTime: time,
          guests: guestsParam,
          deposit: depositParam,
          source: "Website",
          specialRequests: "PayU Online Payment",
          tableId: null,
          status: "Booked",
          paymentStatus: "Paid",
          payuPaymentId: txnid,
          paymentId: txnid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + "#reservation",
        );
        setTimeout(() => {
          document
            .getElementById("reservation")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else if (errorMsg) {
        setBookingError(decodeURIComponent(errorMsg));
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + "#reservation",
        );
        setTimeout(() => {
          document
            .getElementById("reservation")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch {}
  }, [depositAmount]);

  const handleBookTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      setBookingError(
        "Please provide your full name, phone number, and email address.",
      );
      return;
    }
    if (kitchenClosed) {
      setBookingError(
        "Kitchen and table reservation intake is currently paused.",
      );
      return;
    }

    setBookingError("");

    // If deposit is required, open PayU Payment Gateway modal
    if (depositAmount > 0) {
      setPaymentError("");
      setIsPayUModalOpen(true);
      return;
    }

    // Free reservation flow (when deposit set to 0)
    setIsSubmittingBooking(true);
    try {
      const res = await createBooking({
        customer: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        bookingDate,
        bookingTime,
        guests: Number(guests),
        specialRequests:
          `Zone: ${seatingZone}. ${specialRequests ? `Notes: ${specialRequests}` : ""}`.trim(),
        source: "Website",
        deposit: 0,
        paymentStatus: "Waived",
      });
      setBookingSuccess(res);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSpecialRequests("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to confirm table booking.";
      setBookingError(msg);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleProcessPayUPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentError("");

    try {
      // 1. Initialize transaction with server PayU integration
      const initRes = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          guestName: guestName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
          guests: Number(guests),
          bookingDate,
          bookingTime,
          seatingZone,
          specialRequests,
          origin: window.location.origin,
        }),
      });

      const initData = await initRes.json();
      if (!initData.success) {
        throw new Error(
          initData.error || "Failed to initialize PayU payment gateway.",
        );
      }

      // If Live or Test mode with active PayU keys, redirect directly to PayU gateway!
      if (
        (initData.mode === "live" ||
          initData.mode === "test" ||
          !initData.isSandbox) &&
        initData.actionUrl &&
        initData.params
      ) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = initData.actionUrl;
        form.style.display = "none";

        for (const [key, value] of Object.entries(initData.params)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value ?? "");
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Sandbox simulator fallback (when no PayU credentials exist in database)
      const txnid = initData.txnid || `PAYU_${Date.now()}`;
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnid, status: "success" }),
      });

      const res = await createBooking({
        customer: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        bookingDate,
        bookingTime,
        guests: Number(guests),
        specialRequests:
          `Zone: ${seatingZone}. ${specialRequests ? `Notes: ${specialRequests}` : ""}`.trim(),
        source: "Website",
        deposit: depositAmount,
        paymentId: txnid,
        payuPaymentId: txnid,
        paymentStatus: "Paid",
      });

      setBookingSuccess(res);
      setIsPayUModalOpen(false);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSpecialRequests("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "PayU payment processing failed. Please try again.";
      setPaymentError(msg);
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateSandboxPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError("");
    try {
      const txnid = `PAYU_SIM_${Date.now()}`;
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnid, status: "success" }),
      });

      const res = await createBooking({
        customer: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        bookingDate,
        bookingTime,
        guests: Number(guests),
        specialRequests:
          `Zone: ${seatingZone}. ${specialRequests ? `Notes: ${specialRequests}` : ""}`.trim(),
        source: "Website",
        deposit: depositAmount,
        paymentId: txnid,
        payuPaymentId: txnid,
        paymentStatus: "Paid",
      });

      setBookingSuccess(res);
      setIsPayUModalOpen(false);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSpecialRequests("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Simulated booking failed.";
      setPaymentError(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const targetId = id === "stories" ? "blogs" : id;
    const el = document.getElementById(targetId) || document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={`min-h-screen antialiased transition-colors duration-200 ${
        isDark
          ? "bg-[#0d1210] text-[#e3e8e5] selection:bg-[#f4bc83] selection:text-[#131c19]"
          : "bg-[#f8f7f4] text-[#24312e] selection:bg-[#f4bc83] selection:text-[#24312e]"
      }`}
    >
      {/* Top Announcements Banner */}
      <div
        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-center text-xs font-semibold border-b transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#141b19] text-[#f4bc83]"
            : "border-[#e5e1d5] bg-[#f1efe8] text-[#9c6328]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div
            className={`hidden sm:flex items-center gap-2 text-[11px] shrink-0 ${
              isDark ? "text-[#8ea399]" : "text-[#62736b]"
            }`}
          >
            <MapPin
              size={13}
              className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}
            />
            <span className="truncate max-w-[200px] md:max-w-none">
              {displayLocation}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs truncate mx-auto sm:mx-0">
            <Sparkles
              size={12}
              className={`shrink-0 animate-pulse ${isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}`}
            />
            <span className="truncate">
              Weekend DJ Lineup & Sunset Happy Hours Active
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div
              className={`hidden md:flex items-center gap-3 text-[11px] ${
                isDark ? "text-[#8ea399]" : "text-[#62736b]"
              }`}
            >
              <Phone
                size={13}
                className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}
              />
              <span>{content?.reservationHotline || "+91 98201 11001"}</span>
            </div>

            {/* Quick Theme Switcher */}
            <button
              onClick={cycleTheme}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-lg border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase transition cursor-pointer ${
                isDark
                  ? "border-[#2d3f37] bg-[#1b2723] text-[#f4bc83] hover:bg-[#25352f]"
                  : "border-[#d8d3c5] bg-white text-[#9c6328] hover:bg-[#faf9f6]"
              }`}
              title={`Theme: ${themePreference.toUpperCase()} (Click to toggle System/Light/Dark)`}
            >
              {themePreference === "system" ? (
                <Laptop size={10} />
              ) : isDark ? (
                <Moon size={10} />
              ) : (
                <Sun size={10} />
              )}
              <span className="capitalize hidden xs:inline">
                {themePreference}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? "border-[#24332e]/80 bg-[#0f1614]/95 text-white"
            : "border-[#dfe1dc] bg-white/95 text-[#24312e] shadow-2xs"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {activeLogoUrl ? (
              <img
                src={activeLogoUrl}
                alt={restroName}
                className="h-8 w-8 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl object-cover shadow-md sm:shadow-lg shadow-[#f4bc83]/15 border border-[#f4bc83]/30 bg-white shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#d49755] to-[#f4bc83] text-[#16211e] shadow-md sm:shadow-lg shadow-[#f4bc83]/10 font-bold shrink-0">
                <ChefHat size={18} className="sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <span
                className={`display-font text-base sm:text-2xl font-extrabold tracking-tight sm:tracking-wider truncate block leading-tight ${isDark ? "text-white" : "text-[#1c2a26]"}`}
              >
                {restroName}
              </span>
              <p
                className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[.12em] sm:tracking-[.25em] truncate block ${isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}`}
              >
                Restro · Lounge · Nightlife
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav
            className={`hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest ${
              isDark ? "text-[#9cb1a7]" : "text-[#55675e]"
            }`}
          >
            <button
              onClick={() => scrollToSection("about")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              Gallery
            </button>
            <button
              onClick={() => scrollToSection("offers")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              Offers
            </button>
            <button
              onClick={() => scrollToSection("blogs")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              Blogs
            </button>
            <button
              onClick={() => scrollToSection("reservation")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              Reservation
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className={
                isDark
                  ? "hover:text-[#f4bc83] transition"
                  : "hover:text-[#9c6328] transition"
              }
            >
              Contact
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile & Desktop Responsive Book Table Button */}
            <button
              onClick={() => scrollToSection("reservation")}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#d49755] via-[#f4bc83] to-[#e4a362] px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold sm:font-black uppercase tracking-wider text-[#141c19] shadow-sm sm:shadow-lg shadow-[#f4bc83]/20 hover:scale-[1.02] transition active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <CalendarCheck size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Book Table</span>
            </button>

            {/* Mobile Nav Hamburger */}
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className={`rounded-lg sm:rounded-xl border p-1.5 sm:p-2.5 lg:hidden transition cursor-pointer ${
                isDark
                  ? "border-[#33463f] text-[#cfe0d6] hover:bg-[#1a2824]"
                  : "border-[#dfe1dc] text-[#24312e] hover:bg-[#f2f4ef]"
              }`}
            >
              {mobileNavOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div
            className={`border-t px-4 py-4 sm:px-6 sm:py-5 lg:hidden animate-fade-in space-y-3 sm:space-y-4 ${
              isDark
                ? "border-[#23312c] bg-[#121a18]"
                : "border-[#dfe1dc] bg-white shadow-lg"
            }`}
          >
            <div
              className={`grid grid-cols-2 gap-2 sm:gap-3 text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-[#b8ccc2]" : "text-[#3b4c44]"
              }`}
            >
              <button
                onClick={() => scrollToSection("about")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection("gallery")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                Club Photos
              </button>
              <button
                onClick={() => scrollToSection("offers")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                Live Offers
              </button>
              <button
                onClick={() => scrollToSection("blogs")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                Blogs
              </button>
              <button
                onClick={() => scrollToSection("reservation")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                Book A Table
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className={`rounded-xl p-2.5 sm:p-3 text-left transition cursor-pointer ${isDark ? "bg-[#192421] hover:text-[#f4bc83]" : "bg-[#f6f5f1] hover:text-[#9c6328]"}`}
              >
                Contact & Maps
              </button>
            </div>
            <button
              onClick={() => scrollToSection("reservation")}
              className="w-full rounded-xl bg-[#f4bc83] py-2.5 sm:py-3 text-center text-xs font-black uppercase tracking-wider text-[#141c19] cursor-pointer hover:bg-[#eab072] transition"
            >
              Instant Table Reservation
            </button>
          </div>
        )}
      </header>

      {/* ==================================================== */}
      {/* 1. HERO SECTION                                      */}
      {/* ==================================================== */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 md:pt-24 md:pb-36">
        {/* Ambient Glows */}
        <div
          className={`absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-[120px] pointer-events-none ${isDark ? "bg-[#f4bc83]/10" : "bg-[#b97a38]/10"}`}
        />
        <div
          className={`absolute top-40 right-10 h-72 w-72 rounded-full blur-[100px] pointer-events-none ${isDark ? "bg-[#b7623d]/10" : "bg-[#2d563d]/10"}`}
        />

        <div className="mx-auto max-w-6xl px-3 sm:px-6 text-center relative z-10">
          <div
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-[.2em] backdrop-blur-md ${
              isDark
                ? "border-[#f4bc83]/30 bg-[#253630]/60 text-[#f4bc83]"
                : "border-[#b97a38]/30 bg-[#ece9df] text-[#9c6328]"
            }`}
          >
            <Flame
              size={13}
              className={isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}
            />
            <span>India’s Most Iconic Restro-Lounge & Nightclub</span>
          </div>

          <h1
            className={`display-font mt-4 sm:mt-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight lg:leading-[1.15] ${
              isDark ? "text-white" : "text-[#1c2a26]"
            }`}
          >
            {content?.tagline ||
              "Where Medieval Grandeur Meets Modern Nightlife"}
          </h1>

          <p
            className={`mx-auto mt-3 sm:mt-6 max-w-3xl text-xs sm:text-base leading-relaxed md:text-lg ${
              isDark ? "text-[#9ab0a6]" : "text-[#55675e]"
            }`}
          >
            {content?.heroSubtitle ||
              "An opulent restro-lounge spread across two dramatic floors with towering arches, handcrafted cocktails, exquisite global cuisine, and electrifying weekend DJ sets."}
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => scrollToSection("reservation")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#d49755] to-[#f4bc83] px-6 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-[#141c19] shadow-xl shadow-[#f4bc83]/20 hover:scale-105 transition cursor-pointer active:scale-95"
            >
              <CalendarCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Reserve A Table Now</span>
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-6 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${
                isDark
                  ? "border-[#3b5148] bg-[#16231f]/80 text-white hover:border-[#f4bc83]"
                  : "border-[#dfe1dc] bg-white text-[#24312e] hover:border-[#315a3d] shadow-2xs"
              }`}
            >
              <span>Explore The Club</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Quick Stats Ticker */}
          <div
            className={`mt-10 sm:mt-16 grid grid-cols-2 gap-2.5 sm:gap-4 rounded-2xl sm:rounded-3xl border p-4 sm:p-8 backdrop-blur-md ${
              isDark
                ? "border-[#263732] bg-[#15201c]/80"
                : "border-[#dfe1dc] bg-white/90 shadow-2xs"
            }`}
          >
            <div>
              <p
                className={`display-font text-2xl sm:text-4xl font-extrabold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
              >
                2
              </p>
              <p
                className={`mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#8da399]" : "text-[#62736b]"}`}
              >
                Expansive Floors & Sky Bar
              </p>
            </div>
            <div>
              <p
                className={`display-font text-2xl sm:text-4xl font-extrabold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
              >
                60+
              </p>
              <p
                className={`mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#8da399]" : "text-[#62736b]"}`}
              >
                Signature Cocktail Concoctions
              </p>
            </div>
            <div>
              <p
                className={`display-font text-2xl sm:text-4xl font-extrabold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
              >
                4.9★
              </p>
              <p
                className={`mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#8da399]" : "text-[#62736b]"}`}
              >
                Patron Rating & Accolades
              </p>
            </div>
            <div>
              <p
                className={`display-font text-2xl sm:text-4xl font-extrabold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
              >
                100%
              </p>
              <p
                className={`mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#8da399]" : "text-[#62736b]"}`}
              >
                Electric High-Energy Nights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 2. TABLE RESERVATION BOOKING WIZARD                  */}
      {/* ==================================================== */}
      <section
        id="reservation"
        className={`relative border-t py-12 sm:py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#101715]"
            : "border-[#e5e1d5] bg-[#f2f0ea]"
        }`}
      >
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <div className="text-center">
            <p
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-[.25em] ${
                isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
              }`}
            >
              Instant Online Booking
            </p>
            <h2
              className={`display-font mt-2 text-2xl sm:text-4xl md:text-5xl font-extrabold ${
                isDark ? "text-white" : "text-[#1c2a26]"
              }`}
            >
              Reserve Your Table
            </h2>
            <p
              className={`mx-auto mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm ${
                isDark ? "text-[#8fa59b]" : "text-[#55675e]"
              }`}
            >
              Confirm your seating in our Medieval Lounge, Rooftop Sky Terrace,
              or VIP Dance Zone. Instantly registered in our host system.
            </p>
          </div>

          {bookingSuccess ? (
            <div
              className={`mt-10 rounded-3xl border p-8 text-center shadow-2xl animate-fade-in ${
                isDark
                  ? "border-emerald-500/50 bg-[#162721]"
                  : "border-emerald-500/40 bg-[#f0fdf4]"
              }`}
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                  isDark
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-500/20 text-emerald-700"
                }`}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3
                className={`display-font mt-4 text-2xl font-bold sm:text-3xl ${
                  isDark ? "text-white" : "text-[#1c2a26]"
                }`}
              >
                Table Reserved Successfully!
              </h3>
              <p
                className={`mt-2 text-sm ${
                  isDark ? "text-[#a8c2b7]" : "text-[#3b5e50]"
                }`}
              >
                We look forward to hosting you,{" "}
                <strong className={isDark ? "text-white" : "text-[#1c2a26]"}>
                  {bookingSuccess.customer}
                </strong>
                .
              </p>

              <div
                className={`mx-auto mt-6 max-w-md rounded-2xl border p-5 text-left text-xs ${
                  isDark
                    ? "border-[#2b4138] bg-[#111c18]"
                    : "border-[#dfe1dc] bg-white shadow-2xs"
                }`}
              >
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Booking ID:
                  </span>
                  <span
                    className={`font-mono font-bold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                  >
                    {bookingSuccess.id}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Guest Name:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                  >
                    {bookingSuccess.customer}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Contact:
                  </span>
                  <span
                    className={`font-semibold text-right ${isDark ? "text-[#d0e0d7]" : "text-[#24312e]"}`}
                  >
                    {bookingSuccess.phone}
                    {bookingSuccess.email ? ` • ${bookingSuccess.email}` : ""}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Date & Time:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                  >
                    {bookingSuccess.bookingDate} · {bookingSuccess.bookingTime}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Party Size:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                  >
                    {bookingSuccess.guests} Guests
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Assigned Preference:
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                  >
                    {seatingZone}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Booking Source:
                  </span>
                  <span className="font-bold text-emerald-600">
                    {bookingSuccess.source || "Website"}
                  </span>
                </div>
                {(bookingSuccess.payuPaymentId ||
                  bookingSuccess.paymentId ||
                  (bookingSuccess as any).stripePaymentId) && (
                  <div
                    className={`flex justify-between py-1.5 border-b ${
                      isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                    }`}
                  >
                    <span
                      className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                    >
                      PayU Transaction ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {bookingSuccess.payuPaymentId ||
                        bookingSuccess.paymentId ||
                        (bookingSuccess as any).stripePaymentId}
                    </span>
                  </div>
                )}
                <div
                  className={`flex justify-between py-1.5 border-b ${
                    isDark ? "border-[#1f3029]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Payment Status:
                  </span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <Check size={14} />
                    {bookingSuccess.paymentStatus || "Paid"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span
                    className={isDark ? "text-[#849b90]" : "text-[#62736b]"}
                  >
                    Advance Deposit:
                  </span>
                  <span className="font-bold text-amber-500">
                    {currencySymbol}
                    {bookingSuccess.deposit ?? depositAmount} (Credited against
                    bill)
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setBookingSuccess(null)}
                  className="rounded-xl bg-[#f4bc83] px-6 py-3 text-xs font-bold text-[#121c18] hover:bg-[#eab072] transition shadow-md"
                >
                  Make Another Reservation
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleBookTableSubmit}
              className={`mt-6 sm:mt-10 rounded-2xl sm:rounded-3xl border p-4 sm:p-8 md:p-10 transition-colors ${
                isDark
                  ? "border-[#273832] bg-[#141e1b] shadow-2xl"
                  : "border-[#dfe1dc] bg-white shadow-xl"
              }`}
            >
              {kitchenClosed && (
                <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-center text-xs font-bold text-red-300">
                  Kitchen intake suspended. Advance reservations are subject to
                  confirmation.
                </div>
              )}

              {bookingError && (
                <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs font-bold text-red-300">
                  {bookingError}
                </div>
              )}

              {/* Step 1: Date & Guests */}
              <div className="grid gap-3.5 sm:gap-5 sm:grid-cols-3">
                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Reservation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Preferred Time Slot
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  >
                    {DEFAULT_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Number of Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Seating Zone */}
              <div className="mt-5 sm:mt-6">
                <label
                  className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                  }`}
                >
                  Preferred Seating Ambience
                </label>
                <div className="mt-2 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                  {SEATING_ZONES.map((zone) => {
                    const isSelected = seatingZone === zone.id;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSeatingZone(zone.id)}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 transition ${
                          isSelected
                            ? isDark
                              ? "border-[#f4bc83] bg-[#22332c] text-white shadow-md shadow-[#f4bc83]/5"
                              : "border-[#b97a38] bg-[#fef8f1] text-[#1c2a26] shadow-sm"
                            : isDark
                              ? "border-[#273832] bg-[#0e1715] text-[#8ea399] hover:border-[#384e46]"
                              : "border-[#dfe1dc] bg-[#f8f7f4] text-[#62736b] hover:border-[#b0b8b3]"
                        }`}
                      >
                        <p
                          className={`text-xs sm:text-sm font-bold flex items-center justify-between ${
                            isDark ? "text-white" : "text-[#1c2a26]"
                          }`}
                        >
                          <span>{zone.id}</span>
                          {isSelected && (
                            <Check
                              size={16}
                              className={
                                isDark ? "text-[#f4bc83]" : "text-[#b97a38]"
                              }
                            />
                          )}
                        </p>
                        <p
                          className={`mt-1 text-[11px] sm:text-xs ${
                            isDark ? "text-[#7f948b]" : "text-[#62736b]"
                          }`}
                        >
                          {zone.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Guest Details */}
              <div className="mt-5 sm:mt-6 grid gap-3.5 sm:gap-5 sm:grid-cols-3">
                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Singhania"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98201 11001"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                    }`}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                      isDark
                        ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                        : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-5">
                <label
                  className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-[#8fa59b]" : "text-[#62736b]"
                  }`}
                >
                  Special Occasion or Dining Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. Birthday Celebration, Anniversary, High Table, Quiet Corner"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className={`mt-1.5 sm:mt-2 w-full rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none transition ${
                    isDark
                      ? "border-[#2d4039] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                      : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                  }`}
                />
              </div>

              {/* Deposit Notice */}
              <div
                className={`mt-4 sm:mt-5 flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 transition ${
                  isDark
                    ? "border-[#3b2e21] bg-[#1d1712] text-[#f4bc83]"
                    : "border-[#edd8c8] bg-[#fef9f5] text-[#935e2e]"
                }`}
              >
                <CreditCard
                  className="mt-0.5 shrink-0 text-[#f4bc83]"
                  size={17}
                />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-xs sm:text-sm">
                    Advance Table Deposit: {currencySymbol}
                    {depositAmount}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] sm:text-[11px] leading-relaxed ${isDark ? "text-[#c2ab95]" : "text-[#7d5635]"}`}
                  >
                    {depositAmount > 0
                      ? `Your ${currencySymbol}${depositAmount} deposit secures your preferred seating and is automatically credited against your final dining bill.`
                      : "Complimentary online reservation. No advance deposit required for this booking."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingBooking}
                className="mt-6 sm:mt-8 w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#d49755] via-[#f4bc83] to-[#e4a362] py-3.5 sm:py-4 px-3 text-xs sm:text-sm font-black uppercase tracking-wider text-[#141c19] shadow-xl shadow-[#f4bc83]/20 hover:scale-[1.01] transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard size={17} />
                {depositAmount > 0
                  ? `Proceed to PayU Payment (${currencySymbol}${depositAmount})`
                  : isSubmittingBooking
                    ? "Confirming Table..."
                    : "Confirm Table Reservation"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ==================================================== */}
      {/* 3. ABOUT US & ETHOS                                   */}
      {/* ==================================================== */}
      <section
        id="about"
        className={`border-t py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#0e1513]"
            : "border-[#e5e1d5] bg-[#f8f7f4]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[.25em] ${
                  isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                }`}
              >
                Our Ethos & Ambiance
              </p>
              <h2
                className={`display-font mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl ${
                  isDark ? "text-white" : "text-[#1c2a26]"
                }`}
              >
                {content?.aboutTitle || "The Medieval Chaos & Modern Luxury"}
              </h2>
              <p
                className={`mt-5 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-[#92a79e]" : "text-[#55675e]"
                }`}
              >
                {content?.aboutStoryP1}
              </p>
              <p
                className={`mt-4 text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-[#92a79e]" : "text-[#55675e]"
                }`}
              >
                {content?.aboutStoryP2}
              </p>

              {/* Highlights */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(content?.experienceHighlights || []).map((highlight) => (
                  <div
                    key={highlight}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition ${
                      isDark
                        ? "border-[#263731] bg-[#131e1a] text-white"
                        : "border-[#dfe1dc] bg-white text-[#1c2a26] shadow-2xs"
                    }`}
                  >
                    <Sparkles
                      size={16}
                      className={`shrink-0 ${isDark ? "text-[#f4bc83]" : "text-[#b97a38]"}`}
                    />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className={`aspect-[4/3] overflow-hidden rounded-3xl border shadow-2xl ${
                  isDark ? "border-[#2a3c35]" : "border-[#dfe1dc]"
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                  alt="Restro-Lounge Interior"
                  className="h-full w-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
              <div
                className={`absolute -bottom-6 -left-6 rounded-2xl border p-5 shadow-2xl backdrop-blur-md hidden sm:block ${
                  isDark
                    ? "border-[#3b5148] bg-[#16221f]/95"
                    : "border-[#dfe1dc] bg-white/95"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                  }`}
                >
                  {displayLocationShort}
                </p>
                <p
                  className={`display-font text-lg font-extrabold ${
                    isDark ? "text-white" : "text-[#1c2a26]"
                  }`}
                >
                  Spanning Over 15,000 Sq. Ft.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. CLUB & RESTAURANT PHOTOS (GALLERY)                */}
      {/* ==================================================== */}
      <section
        id="gallery"
        className={`border-t py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#111715]"
            : "border-[#e5e1d5] bg-[#f2f0ea]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[.25em] ${
                  isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                }`}
              >
                Atmospheric Showcase
              </p>
              <h2
                className={`display-font mt-2 text-3xl font-extrabold sm:text-4xl ${
                  isDark ? "text-white" : "text-[#1c2a26]"
                }`}
              >
                Photos of the Restro & Club
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
              {[
                "All",
                "Ambience",
                "Nightlife & Club",
                "Drinks & Cocktails",
                "Cuisine",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition whitespace-nowrap shrink-0 sm:shrink cursor-pointer ${
                    selectedGalleryCategory === cat
                      ? isDark
                        ? "bg-[#f4bc83] text-[#131d1a]"
                        : "bg-[#1c2a26] text-white shadow-xs"
                      : isDark
                        ? "border border-[#263732] bg-[#16221e] text-[#8ea399] hover:bg-[#1e2e28]"
                        : "border border-[#dfe1dc] bg-white text-[#55675e] hover:bg-[#eae8e1]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div
            className={`mt-8 ${
              filteredGallery.length === 1
                ? "flex justify-center"
                : filteredGallery.length === 2
                  ? "grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto"
                  : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredGallery.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhotoModal(photo)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border aspect-[4/3] transition ${
                  isDark
                    ? "border-[#23332d] bg-[#17221e]"
                    : "border-[#dfe1dc] bg-white shadow-2xs"
                } ${filteredGallery.length === 1 ? "w-full max-w-xl" : ""}`}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="rounded-md bg-[#f4bc83]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f4bc83] border border-[#f4bc83]/30">
                    {photo.category}
                  </span>
                  <h3 className="mt-1.5 text-sm font-bold text-white group-hover:text-[#f4bc83] transition">
                    {photo.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 5. OFFERS & SPECIAL PROMOS                           */}
      {/* ==================================================== */}
      <section
        id="offers"
        className={`border-t py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#0d1311]"
            : "border-[#e5e1d5] bg-[#f8f7f4]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p
              className={`text-xs font-bold uppercase tracking-[.25em] ${
                isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
              }`}
            >
              Curated Privileges
            </p>
            <h2
              className={`display-font mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl ${
                isDark ? "text-white" : "text-[#1c2a26]"
              }`}
            >
              Live Club & Dining Offers
            </h2>
            <p
              className={`mx-auto mt-2 max-w-xl text-xs sm:text-sm ${
                isDark ? "text-[#8fa39a]" : "text-[#55675e]"
              }`}
            >
              Exclusive happy hours, ladies nights, weekend DJ entries, and
              banquet discounts managed directly by our hosts.
            </p>
          </div>

          <div
            className={`mt-10 ${
              activeOffers.length === 1
                ? "flex justify-center"
                : activeOffers.length === 2
                  ? "grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto"
                  : activeOffers.length === 3
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
                    : "grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {activeOffers.map((offer) => (
              <div
                key={offer.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 transition ${
                  isDark
                    ? "border-[#273832] bg-[#141f1c] hover:border-[#f4bc83]/50 hover:shadow-xl hover:shadow-[#f4bc83]/5"
                    : "border-[#dfe1dc] bg-white hover:border-[#b97a38]/50 shadow-xs"
                } ${activeOffers.length === 1 ? "w-full max-w-md" : ""}`}
              >
                <div>
                  <div
                    className={`relative aspect-[16/10] overflow-hidden rounded-2xl ${
                      isDark ? "bg-[#1d2b27]" : "bg-[#ecebe6]"
                    }`}
                  >
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 right-3 rounded-full bg-[#f4bc83] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#141d1a] shadow-md">
                      {offer.badge}
                    </span>
                  </div>

                  <p
                    className={`mt-4 text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                    }`}
                  >
                    {offer.subtitle}
                  </p>
                  <h3
                    className={`mt-1 text-base font-bold transition ${
                      isDark
                        ? "text-white group-hover:text-[#f4bc83]"
                        : "text-[#1c2a26] group-hover:text-[#9c6328]"
                    }`}
                  >
                    {offer.title}
                  </h3>
                  <p
                    className={`mt-2 text-xs leading-relaxed ${
                      isDark ? "text-[#8da299]" : "text-[#55675e]"
                    }`}
                  >
                    {offer.description}
                  </p>
                </div>

                <div
                  className={`mt-5 border-t pt-3 ${
                    isDark ? "border-[#22312b]" : "border-[#f0f1ed]"
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                      isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                    }`}
                  >
                    <Clock3 size={12} />
                    <span>{offer.validUntil}</span>
                  </p>
                  <button
                    onClick={() => scrollToSection("reservation")}
                    className={`mt-3 w-full rounded-xl py-2.5 text-center text-xs font-bold transition ${
                      isDark
                        ? "bg-[#23332d] text-[#cfe0d7] hover:bg-[#f4bc83] hover:text-[#121c18]"
                        : "bg-[#f2f0ea] text-[#1c2a26] hover:bg-[#1c2a26] hover:text-white"
                    }`}
                  >
                    Claim With Table Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 6. BLOGS                                             */}
      {/* ==================================================== */}
      <section
        id="blogs"
        className={`border-t py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#101715]"
            : "border-[#e5e1d5] bg-[#f2f0ea]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[.25em] ${
                  isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                }`}
              >
                Behind The Scenes
              </p>
              <h2
                className={`display-font mt-2 text-3xl font-extrabold sm:text-4xl ${
                  isDark ? "text-white" : "text-[#1c2a26]"
                }`}
              >
                Blogs, Mixology & Culture
              </h2>
            </div>
            <p
              className={`text-xs font-semibold ${isDark ? "text-[#8ba096]" : "text-[#55675e]"}`}
            >
              Curated articles on craft cocktails, medieval design, and
              nightlife.
            </p>
          </div>

          <div
            className={`mt-8 ${
              publishedBlogs.length === 1
                ? "flex justify-center"
                : publishedBlogs.length === 2
                  ? "grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto"
                  : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {publishedBlogs.map((blog) => (
              <article
                key={blog.id}
                onClick={() =>
                  onOpenBlog
                    ? onOpenBlog(getBlogSlug(blog))
                    : setActiveBlogModal(blog)
                }
                className={`group cursor-pointer flex flex-col justify-between overflow-hidden rounded-3xl border p-4 transition ${
                  isDark
                    ? "border-[#24342e] bg-[#141f1c] hover:border-[#384e46]"
                    : "border-[#dfe1dc] bg-white hover:border-[#b0b8b3] shadow-xs"
                } ${publishedBlogs.length === 1 ? "w-full max-w-md" : ""}`}
              >
                <div>
                  <div
                    className={`aspect-[16/10] overflow-hidden rounded-2xl ${
                      isDark ? "bg-[#1f2c28]" : "bg-[#ecebe6]"
                    }`}
                  >
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div
                    className={`mt-4 flex items-center justify-between text-[11px] ${
                      isDark ? "text-[#869b92]" : "text-[#62736b]"
                    }`}
                  >
                    <span
                      className={`font-bold ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                    >
                      {blog.category}
                    </span>
                    <span>
                      {blog.readTime} · {blog.publishDate}
                    </span>
                  </div>
                  <h3
                    className={`mt-2 text-base font-bold transition line-clamp-2 ${
                      isDark
                        ? "text-white group-hover:text-[#f4bc83]"
                        : "text-[#1c2a26] group-hover:text-[#9c6328]"
                    }`}
                  >
                    {blog.title}
                  </h3>
                  <p
                    className={`mt-2 text-xs leading-relaxed line-clamp-3 ${
                      isDark ? "text-[#8da198]" : "text-[#55675e]"
                    }`}
                  >
                    {blog.excerpt}
                  </p>
                </div>

                <div
                  className={`mt-5 border-t pt-3 flex items-center justify-between ${
                    isDark ? "border-[#22312b]" : "border-[#f0f1ed]"
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold ${
                      isDark ? "text-[#7c9288]" : "text-[#62736b]"
                    }`}
                  >
                    {blog.author}
                  </span>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition ${
                      isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                    }`}
                  >
                    Read Blog <ArrowRight size={13} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 7. CONTACT & LOCATION DETAILS                        */}
      {/* ==================================================== */}
      <section
        id="contact"
        className={`border-t py-20 transition-colors ${
          isDark
            ? "border-[#22302b] bg-[#0c1210]"
            : "border-[#e5e1d5] bg-[#f8f7f4]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[.25em] ${
                  isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                }`}
              >
                Location & Reservations
              </p>
              <h2
                className={`display-font mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl ${
                  isDark ? "text-white" : "text-[#1c2a26]"
                }`}
              >
                Visit {restroName}
              </h2>
              <p
                className={`mt-4 text-xs sm:text-sm leading-relaxed ${
                  isDark ? "text-[#8ba197]" : "text-[#55675e]"
                }`}
              >
                Located at {displayLocation}. Valet parking available on site.
              </p>

              <div className="mt-8 space-y-4 text-xs sm:text-sm">
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                    isDark
                      ? "border-[#23332d] bg-[#141f1c] text-[#b8ccc3]"
                      : "border-[#dfe1dc] bg-white text-[#43534c] shadow-2xs"
                  }`}
                >
                  <MapPin
                    size={20}
                    className={`shrink-0 mt-0.5 ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                  />
                  <div>
                    <strong
                      className={`block font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                    >
                      Restaurant Address
                    </strong>
                    <span>{displayLocation}</span>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                    isDark
                      ? "border-[#23332d] bg-[#141f1c] text-[#b8ccc3]"
                      : "border-[#dfe1dc] bg-white text-[#43534c] shadow-2xs"
                  }`}
                >
                  <Clock3
                    size={20}
                    className={`shrink-0 mt-0.5 ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                  />
                  <div>
                    <strong
                      className={`block font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                    >
                      Hours of Operation
                    </strong>
                    <span>{content?.operatingHours}</span>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                    isDark
                      ? "border-[#23332d] bg-[#141f1c] text-[#b8ccc3]"
                      : "border-[#dfe1dc] bg-white text-[#43534c] shadow-2xs"
                  }`}
                >
                  <Phone
                    size={20}
                    className={`shrink-0 mt-0.5 ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                  />
                  <div>
                    <strong
                      className={`block font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                    >
                      Reservations & VIP Inquiries
                    </strong>
                    <span>Hotline: {content?.reservationHotline}</span>
                    <span
                      className={`block ${isDark ? "text-[#8ca197]" : "text-[#62736b]"}`}
                    >
                      Desk: {content?.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {content?.googleMapsUrl && (
                  <a
                    href={content.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      isDark
                        ? "bg-[#23342e] text-white hover:bg-[#f4bc83] hover:text-[#121b18]"
                        : "bg-[#1c2a26] text-white hover:bg-[#315a3d]"
                    }`}
                  >
                    <ExternalLink size={14} />
                    <span>Open in Google Maps</span>
                  </a>
                )}
                {content?.instagramUrl && (
                  <a
                    href={content.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                      isDark
                        ? "border-[#30443c] bg-[#131e1a] text-[#cfe0d6] hover:text-white"
                        : "border-[#dfe1dc] bg-white text-[#24312e] hover:bg-[#f2f0ea]"
                    }`}
                  >
                    <svg
                      className={`h-3.5 w-3.5 ${isDark ? "text-[#f4bc83]" : "text-[#9c6328]"}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Follow on Instagram</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 transition-colors ${
                isDark
                  ? "border-[#263732] bg-[#131e1a]"
                  : "border-[#dfe1dc] bg-white shadow-xl"
              }`}
            >
              <h3
                className={`display-font text-2xl font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
              >
                Direct Host Inquiry
              </h3>
              <p
                className={`mt-1 text-xs ${isDark ? "text-[#8da299]" : "text-[#62736b]"}`}
              >
                Planning a corporate cocktail, birthday bash, or banquet? Send a
                note directly to our events manager.
              </p>

              {inquirySent ? (
                <div
                  className={`mt-8 rounded-2xl border p-6 text-center text-xs font-bold ${
                    isDark
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-emerald-500/40 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <CheckCircle2
                    size={28}
                    className="mx-auto mb-2 text-emerald-500"
                  />
                  Inquiry Dispatched! Our guest manager will contact you
                  shortly.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setInquirySent(true);
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-[#8da299]" : "text-[#62736b]"
                      }`}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none transition ${
                        isDark
                          ? "border-[#283b34] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                          : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-[#8da299]" : "text-[#62736b]"
                      }`}
                    >
                      Contact (Phone / Email)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Phone or Email"
                      className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none transition ${
                        isDark
                          ? "border-[#283b34] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                          : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-[#8da299]" : "text-[#62736b]"
                      }`}
                    >
                      Inquiry Details / Event Size
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your event, date, or questions..."
                      className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none transition ${
                        isDark
                          ? "border-[#283b34] bg-[#0e1715] text-white focus:border-[#f4bc83]"
                          : "border-[#dfe1dc] bg-[#f8f7f4] text-[#1c2a26] focus:border-[#315a3d]"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#f4bc83] py-3 text-xs font-black uppercase tracking-wider text-[#141d1a] hover:bg-[#eab072] transition shadow-md"
                  >
                    Send Direct Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* FOOTER                                               */}
      {/* ==================================================== */}
      <footer
        className={`border-t py-12 text-xs transition-colors ${
          isDark
            ? "border-[#1e2a25] bg-[#0a0f0d] text-[#7f948a]"
            : "border-[#dfe1dc] bg-[#f2f0ea] text-[#62736b]"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              {activeLogoUrl ? (
                <img
                  src={activeLogoUrl}
                  alt={restroName}
                  className="h-10 w-10 rounded-xl object-cover border border-[#f4bc83]/20 bg-white shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49755] to-[#f4bc83] text-[#16211e] font-bold">
                  <ChefHat size={20} />
                </div>
              )}
              <div>
                <p
                  className={`display-font text-lg font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                >
                  {restroName}
                </p>
                <p
                  className={`text-[11px] ${isDark ? "text-[#869b91]" : "text-[#7a8a81]"}`}
                >
                  © {new Date().getFullYear()} {restroName}. All rights
                  reserved.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 font-bold">
              <button
                onClick={() => scrollToSection("about")}
                className={`transition ${isDark ? "text-[#a6bcb2] hover:text-[#f4bc83]" : "text-[#43534c] hover:text-[#9c6328]"}`}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("gallery")}
                className={`transition ${isDark ? "text-[#a6bcb2] hover:text-[#f4bc83]" : "text-[#43534c] hover:text-[#9c6328]"}`}
              >
                Photos
              </button>
              <button
                onClick={() => scrollToSection("offers")}
                className={`transition ${isDark ? "text-[#a6bcb2] hover:text-[#f4bc83]" : "text-[#43534c] hover:text-[#9c6328]"}`}
              >
                Offers
              </button>
              <button
                onClick={() => scrollToSection("blogs")}
                className={`transition ${isDark ? "text-[#a6bcb2] hover:text-[#f4bc83]" : "text-[#43534c] hover:text-[#9c6328]"}`}
              >
                Blogs
              </button>
              <button
                onClick={() => scrollToSection("reservation")}
                className={`transition ${isDark ? "text-[#a6bcb2] hover:text-[#f4bc83]" : "text-[#43534c] hover:text-[#9c6328]"}`}
              >
                Reservations
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* PHOTO LIGHTBOX MODAL                                 */}
      {/* ==================================================== */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in">
          <div
            className={`relative max-w-4xl w-full overflow-hidden rounded-3xl border shadow-2xl ${
              isDark
                ? "border-[#374c43] bg-[#121c19]"
                : "border-[#dfe1dc] bg-white"
            }`}
          >
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition"
            >
              <X size={20} />
            </button>
            <div className="aspect-[16/10] w-full overflow-hidden bg-black">
              <img
                src={activePhotoModal.imageUrl}
                alt={activePhotoModal.title}
                className="h-full w-full object-contain"
              />
            </div>
            <div
              className={`p-5 flex items-center justify-between border-t ${
                isDark ? "border-[#23312c]" : "border-[#f0f1ed]"
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-[#f4bc83]" : "text-[#9c6328]"
                  }`}
                >
                  {activePhotoModal.category}
                </span>
                <h3
                  className={`text-base font-bold ${isDark ? "text-white" : "text-[#1c2a26]"}`}
                >
                  {activePhotoModal.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActivePhotoModal(null);
                  scrollToSection("reservation");
                }}
                className="rounded-xl bg-[#f4bc83] px-4 py-2 text-xs font-bold text-[#141d1a]"
              >
                Book This Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BLOG STORY MODAL                                     */}
      {/* ==================================================== */}
      {activeBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in">
          <div
            className={`relative max-w-2xl max-h-[90vh] overflow-y-auto w-full rounded-3xl border p-6 sm:p-8 shadow-2xl text-left ${
              isDark
                ? "border-[#374c43] bg-[#141f1c]"
                : "border-[#dfe1dc] bg-white"
            }`}
          >
            <button
              onClick={() => setActiveBlogModal(null)}
              className={`absolute top-5 right-5 rounded-full p-2 transition ${
                isDark
                  ? "bg-[#202e29] text-[#cfe0d6] hover:bg-[#2e423b]"
                  : "bg-[#f2f0ea] text-[#62736b] hover:bg-[#e0ddd4]"
              }`}
            >
              <X size={18} />
            </button>

            <span
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                isDark
                  ? "bg-[#f4bc83]/20 text-[#f4bc83] border-[#f4bc83]/30"
                  : "bg-[#b97a38]/10 text-[#9c6328] border-[#b97a38]/20"
              }`}
            >
              {activeBlogModal.category}
            </span>

            <h2
              className={`display-font mt-3 text-2xl font-bold sm:text-3xl ${
                isDark ? "text-white" : "text-[#1c2a26]"
              }`}
            >
              {activeBlogModal.title}
            </h2>

            <p
              className={`mt-2 text-xs ${isDark ? "text-[#8da299]" : "text-[#62736b]"}`}
            >
              By{" "}
              <strong className={isDark ? "text-white" : "text-[#1c2a26]"}>
                {activeBlogModal.author}
              </strong>{" "}
              · {activeBlogModal.readTime} · {activeBlogModal.publishDate}
            </p>

            <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black">
              <img
                src={activeBlogModal.imageUrl}
                alt={activeBlogModal.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div
              className={`mt-6 space-y-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                isDark ? "text-[#b5cbbf]" : "text-[#43534c]"
              }`}
            >
              {activeBlogModal.content}
            </div>

            <div
              className={`mt-8 border-t pt-4 flex justify-between items-center ${
                isDark ? "border-[#263731]" : "border-[#f0f1ed]"
              }`}
            >
              <button
                onClick={() => setActiveBlogModal(null)}
                className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                  isDark
                    ? "border-[#3b5148] text-[#b5cbbf] hover:border-white"
                    : "border-[#dfe1dc] text-[#43534c] hover:border-[#1c2a26]"
                }`}
              >
                Close Blog
              </button>
              <button
                onClick={() => {
                  setActiveBlogModal(null);
                  scrollToSection("reservation");
                }}
                className="rounded-xl bg-[#f4bc83] px-5 py-2 text-xs font-bold text-[#141d1a]"
              >
                Reserve A Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PayU Payment Checkout Modal */}
      {isPayUModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in">
          <div
            className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl sm:rounded-3xl border p-4 sm:p-7 shadow-2xl transition-colors ${
              isDark
                ? "border-[#2c3f37] bg-[#141f1c] text-white"
                : "border-[#dfe1dc] bg-white text-[#24312e]"
            }`}
          >
            <button
              type="button"
              onClick={closePayUPaymentModal}
              className={`absolute top-4 right-4 sm:top-5 sm:right-5 rounded-full p-2 transition cursor-pointer ${
                isDark
                  ? "bg-[#202e29] text-[#cfe0d6] hover:bg-[#2e423b]"
                  : "bg-[#f2f0ea] text-[#62736b] hover:bg-[#e0ddd4]"
              }`}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b pb-4 mb-5 border-dashed border-[#849b90]/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00c06d] text-white shadow-md shadow-[#00c06d]/25">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                      payuConfig.mode === "live"
                        ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : payuConfig.mode === "test"
                          ? "text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
                          : "text-teal-700 bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300"
                    }`}
                  >
                    {payuConfig.mode === "live"
                      ? "● PayU Live Production Active"
                      : payuConfig.mode === "test"
                        ? "● PayU Test Sandbox Active"
                        : "● PayU Demo Simulator Active"}
                  </span>
                  <span className="text-[10px] text-[#849b90]">
                    256-bit SSL
                  </span>
                </div>
                <h3 className="display-font text-lg font-bold">
                  {payuConfig.mode === "live"
                    ? "PayU Live Gateway Checkout"
                    : "Confirm Table Deposit via PayU"}
                </h3>
              </div>
            </div>

            {/* Reservation Summary Card */}
            <div
              className={`mb-5 rounded-2xl border p-4 text-xs space-y-2 ${
                isDark
                  ? "border-[#273832] bg-[#0d1614]"
                  : "border-[#eef0ec] bg-[#f8f9f6]"
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#849b90]/20">
                <span className={isDark ? "text-[#8fa59b]" : "text-[#62736b]"}>
                  Guest Name:
                </span>
                <span className="font-bold">{guestName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#849b90]/20">
                <span className={isDark ? "text-[#8fa59b]" : "text-[#62736b]"}>
                  Reservation Window:
                </span>
                <span className="font-semibold">
                  {bookingDate} at {bookingTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#849b90]/20">
                <span className={isDark ? "text-[#8fa59b]" : "text-[#62736b]"}>
                  Party Size & Seating:
                </span>
                <span className="font-semibold">
                  {guests} Guests • {seatingZone}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="font-bold">Advance Deposit Due:</span>
                <span className="font-black text-[#f4bc83] text-base">
                  {currencySymbol}
                  {depositAmount}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Live or Test Gateway Flow */}
            {payuConfig.isConfigured ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark
                      ? "border-[#2c4038] bg-[#0d1714]"
                      : "border-[#e0ebd0] bg-[#f4faf0]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <ShieldCheck
                      size={18}
                      className="text-[#00c06d] shrink-0"
                    />
                    <span className="text-xs font-bold text-[#00c06d]">
                      {payuConfig.mode === "live"
                        ? "Official PayU Live Payment"
                        : "Official PayU Test Gateway"}
                    </span>
                  </div>
                  <p className="text-xs text-[#849b90] leading-relaxed">
                    {payuConfig.mode === "live"
                      ? "You will be redirected securely to PayU India (secure.payu.in) to pay your deposit using real UPI (Google Pay, PhonePe, Paytm), RuPay/Visa/MasterCard, or NetBanking. 100% credited to your dining bill."
                      : "You will be redirected to PayU Test Gateway (test.payu.in) to simulate payment using test credentials."}
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleProcessPayUPayment()}
                    disabled={isProcessingPayment}
                    className="w-full rounded-xl bg-gradient-to-r from-[#00c06d] to-[#009b58] py-3.5 sm:py-4 px-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-[#00c06d]/30 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-center"
                  >
                    <Lock size={15} />
                    {isProcessingPayment
                      ? "Redirecting to PayU India..."
                      : `Proceed to PayU ${payuConfig.mode === "live" ? "Live" : "Test"} Gateway (${currencySymbol}${depositAmount}) ➔`}
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateSandboxPayment}
                    disabled={isProcessingPayment}
                    className="w-full text-center text-[11px] font-bold text-[#849b90] hover:text-[#00c06d] py-1 cursor-pointer transition"
                  >
                    ⚡ Test Booking Simulator (Confirm instantly without leaving
                    page)
                  </button>

                  <button
                    type="button"
                    onClick={closePayUPaymentModal}
                    className="w-full text-center text-xs text-[#849b90] hover:text-white transition py-1 cursor-pointer"
                  >
                    Cancel and Edit Details
                  </button>
                </div>
              </div>
            ) : (
              /* Demo / Sandbox Flow (When PayU keys are unconfigured) */
              <div className="space-y-4">
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? "border-[#2c4038] bg-[#0d1714]"
                      : "border-[#e0ebd0] bg-[#f4faf0]"
                  }`}
                >
                  <p className="text-xs text-[#849b90]">
                    PayU Merchant Keys are not set in Dashboard Settings. You
                    can test instant table bookings via this demo simulator.
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleSimulateSandboxPayment}
                    disabled={isProcessingPayment}
                    className="w-full rounded-xl bg-gradient-to-r from-[#00c06d] to-[#009b58] py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-[#00c06d]/30 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Lock size={14} />
                    {isProcessingPayment
                      ? "Confirming Test Booking..."
                      : `Confirm Test Reservation (${currencySymbol}${depositAmount})`}
                  </button>

                  <button
                    type="button"
                    onClick={closePayUPaymentModal}
                    className="w-full text-center text-xs text-[#849b90] hover:text-white transition py-1 cursor-pointer"
                  >
                    Cancel and Edit Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
