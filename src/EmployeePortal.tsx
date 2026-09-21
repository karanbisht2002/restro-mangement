import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  Globe2,
  KeyRound,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import {
  clockInStaff,
  clockOutStaff,
  fetchAnnouncements,
  fetchLeaves,
  fetchRestaurantSettings,
  fetchTodayAttendance,
  updateRestaurantSettings,
  loginStaff,
  submitLeave,
  toggleStaffBreak,
  type Announcement,
  type AttendanceRecord,
  type LeaveRequest,
  type RestaurantSettings,
  type StaffMember,
} from "./api/team";

interface EmployeePortalProps {
  onBackToApp: () => void;
  onBackToWebsite?: () => void;
}

const upcomingHolidays = [
  { name: "Gandhi Jayanti", date: "02 Oct", day: "Friday", type: "National Holiday" },
  { name: "Dussehra", date: "20 Oct", day: "Tuesday", type: "Gazetted Holiday" },
  { name: "Diwali (Deepavali)", date: "08 Nov", day: "Sunday", type: "Festival Holiday" },
  { name: "Christmas Day", date: "25 Dec", day: "Friday", type: "Public Holiday" },
  { name: "New Year’s Day", date: "01 Jan", day: "Friday", type: "Observance" },
];

export default function EmployeePortal({ onBackToApp, onBackToWebsite }: EmployeePortalProps) {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    const saved = localStorage.getItem("table_thyme_staff_session");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Geolocation & Settings
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isCheckingGps, setIsCheckingGps] = useState(false);

  // Portal State
  const [activeTab, setActiveTab] = useState<"attendance" | "notices" | "leaves" | "holidays">("attendance");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<string>(currentUser?.todayStatus || "Scheduled");
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(currentUser?.clockInTime || null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(currentUser?.clockOutTime || null);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState<number>(currentUser?.totalBreakMinutes || 0);
  const [elapsedDuration, setElapsedDuration] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Leave Form
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("Casual");
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Format punch date and time nicely
  function formatPunchDateTime(isoString?: string | null): { dateStr: string; timeStr: string; relative: string } {
    if (!isoString) return { dateStr: "--", timeStr: "--", relative: "" };
    try {
      const d = new Date(isoString);
      const isToday = new Date().toDateString() === d.toDateString();
      const dateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return {
        dateStr: isToday ? `Today (${dateStr})` : dateStr,
        timeStr,
        relative: isToday ? "Today" : "",
      };
    } catch {
      return { dateStr: String(isoString), timeStr: "", relative: "" };
    }
  }

  // Synchronize live attendance state from backend
  const refreshTodayAttendance = async (staffId: string) => {
    try {
      const { attendance, status } = await fetchTodayAttendance(staffId);
      setTodayAttendance(attendance);
      const effectiveStatus = status || attendance?.status || "Scheduled";
      setAttendanceStatus(effectiveStatus);
      if (attendance?.clockIn) {
        setClockInTime(attendance.clockIn);
      }
      if (attendance?.clockOut) {
        setClockOutTime(attendance.clockOut);
      }
      if (attendance?.totalBreakMinutes !== undefined) {
        setTotalBreakMinutes(attendance.totalBreakMinutes);
      }
      if (attendance?.distanceMeters !== undefined && attendance?.distanceMeters !== null) {
        setDistanceMeters(attendance.distanceMeters);
      }

      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated: StaffMember = {
          ...prev,
          todayStatus: effectiveStatus as any,
          clockInTime: attendance?.clockIn || prev.clockInTime,
          clockOutTime: attendance?.clockOut || prev.clockOutTime,
          totalBreakMinutes: attendance?.totalBreakMinutes ?? prev.totalBreakMinutes,
          isGeofenceVerified: attendance?.isGeofenceVerified ?? prev.isGeofenceVerified,
          lastDistanceMeters: attendance?.distanceMeters ?? prev.lastDistanceMeters,
        };
        localStorage.setItem("table_thyme_staff_session", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Could not fetch today's attendance:", err);
    }
  };

  // Live ticking shift timer
  useEffect(() => {
    if (!clockInTime || (attendanceStatus !== "Clocked in" && attendanceStatus !== "On break")) {
      setElapsedDuration("");
      return;
    }

    const updateTimer = () => {
      const start = new Date(clockInTime).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      const totalMinutes = Math.floor(diffMs / 60000);
      const netMinutes = Math.max(0, totalMinutes - (totalBreakMinutes || 0));
      const hours = Math.floor(netMinutes / 60);
      const mins = netMinutes % 60;
      const secs = Math.floor((diffMs % 60000) / 1000);
      setElapsedDuration(`${hours}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [clockInTime, attendanceStatus, totalBreakMinutes]);

  // Load restaurant coordinates
  useEffect(() => {
    fetchRestaurantSettings()
      .then(setSettings)
      .catch((err) => console.error("Could not fetch settings:", err));
  }, []);

  // Request browser GPS position
  const checkCurrentLocation = () => {
    setIsCheckingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      setIsCheckingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setIsCheckingGps(false);

        if (settings) {
          const dist = calculateDistance(lat, lng, settings.latitude, settings.longitude);
          setDistanceMeters(dist);
        }
      },
      (err) => {
        setIsCheckingGps(false);
        setGpsError(`GPS Error: ${err.message}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    if (settings) {
      checkCurrentLocation();
    }
  }, [settings]);

  // Load Announcements, Leaves & Live Attendance when user is logged in
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("table_thyme_staff_session", JSON.stringify(currentUser));
      if (currentUser.todayStatus) {
        setAttendanceStatus(currentUser.todayStatus);
      }
      if (currentUser.clockInTime) {
        setClockInTime(currentUser.clockInTime);
      }
      if (currentUser.clockOutTime) {
        setClockOutTime(currentUser.clockOutTime);
      }
      if (currentUser.totalBreakMinutes) {
        setTotalBreakMinutes(currentUser.totalBreakMinutes);
      }

      // Live sync from server so page refresh retains exact punch status
      refreshTodayAttendance(currentUser.id);

      fetchAnnouncements(currentUser.id)
        .then(setAnnouncements)
        .catch(() => {});

      fetchLeaves()
        .then((leaves) => {
          const filtered = leaves.filter((l) => l.staffId === currentUser.id);
          setMyLeaves(filtered);
        })
        .catch(() => {});
    }
  }, [currentUser?.id]);

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !pinInput) {
      setLoginError("Please enter your registered phone number and 4-digit PIN.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const staff = await loginStaff(phoneInput, pinInput);
      setCurrentUser(staff);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Invalid phone number or PIN.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("table_thyme_staff_session");
    setCurrentUser(null);
    setPhoneInput("");
    setPinInput("");
    setActionMessage(null);
  };

  const handleClockIn = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    setActionMessage(null);

    // Refresh location right before clock-in
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });

        try {
          const res = await clockInStaff({
            staffId: currentUser.id,
            latitude: lat,
            longitude: lng,
          });
          setAttendanceStatus("Clocked in");
          setClockInTime(new Date().toISOString());
          setDistanceMeters(res.distanceMeters);
          await refreshTodayAttendance(currentUser.id);
          setActionMessage({
            text: `Clocked in successfully! Verified at ${res.distanceMeters}m from restaurant.`,
            type: "success",
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Clock-in failed.";
          setActionMessage({ text: msg, type: "error" });
        } finally {
          setActionLoading(false);
        }
      },
      async () => {
        // Fallback if GPS fails
        try {
          const res = await clockInStaff({
            staffId: currentUser.id,
            latitude: userLocation?.lat,
            longitude: userLocation?.lng,
          });
          setAttendanceStatus("Clocked in");
          setClockInTime(new Date().toISOString());
          await refreshTodayAttendance(currentUser.id);
          setActionMessage({
            text: `Clocked in successfully! Verified at ${res.distanceMeters}m.`,
            type: "success",
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Location verification failed.";
          setActionMessage({ text: msg, type: "error" });
        } finally {
          setActionLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const handleSyncRestaurantLocation = () => {
    setActionLoading(true);
    setActionMessage(null);

    const applyLocation = async (lat: number, lng: number) => {
      try {
        const updated = await updateRestaurantSettings({
          latitude: lat,
          longitude: lng,
          radiusMeters: 50,
        });
        setSettings(updated);
        setUserLocation({ lat, lng });
        setDistanceMeters(0);
        setActionMessage({
          text: `✓ Restaurant GPS updated to your location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)! Distance is now 0m.`,
          type: "success",
        });
      } catch (err: unknown) {
        setActionMessage({
          text: "Failed to update restaurant location: " + (err instanceof Error ? err.message : String(err)),
          type: "error",
        });
      } finally {
        setActionLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          if (userLocation) {
            applyLocation(userLocation.lat, userLocation.lng);
          } else {
            setActionMessage({
              text: `GPS access error: ${err.message}. Please allow location permissions in your browser.`,
              type: "error",
            });
            setActionLoading(false);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      setActionMessage({ text: "Geolocation is not supported by your browser.", type: "error" });
      setActionLoading(false);
    }
  };

  const handleClockInOverride = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await clockInStaff({
        staffId: currentUser.id,
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        managerOverride: true,
      });
      setAttendanceStatus("Clocked in");
      setClockInTime(new Date().toISOString());
      setDistanceMeters(res.distanceMeters || 0);
      await refreshTodayAttendance(currentUser.id);
      setActionMessage({
        text: "Clocked in successfully with Manager Override! (Verified on premises)",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Override punch failed.";
      setActionMessage({ text: msg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBreak = async (action: "start" | "end") => {
    if (!currentUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await toggleStaffBreak(currentUser.id, action);
      setAttendanceStatus(action === "start" ? "On break" : "Clocked in");
      await refreshTodayAttendance(currentUser.id);
      setActionMessage({
        text: action === "start" ? "Break started. Enjoy your meal!" : "Break ended. Welcome back!",
        type: "success",
      });
    } catch {
      setActionMessage({ text: "Failed to update break status.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to clock out for the day?")) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await clockOutStaff(currentUser.id);
      setAttendanceStatus("Clocked out");
      setClockOutTime(new Date().toISOString());
      await refreshTodayAttendance(currentUser.id);
      setActionMessage({ text: "Clocked out successfully. Have a great evening!", type: "success" });
    } catch {
      setActionMessage({ text: "Failed to clock out.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !leaveStartDate || !leaveEndDate || !leaveReason) return;
    setIsSubmittingLeave(true);
    try {
      const created = await submitLeave({
        staffId: currentUser.id,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        leaveType,
        reason: leaveReason,
      });
      setMyLeaves((prev) => [created, ...prev]);
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setActionMessage({ text: "Leave request submitted to Manager for approval!", type: "success" });
    } catch {
      setActionMessage({ text: "Failed to submit leave request.", type: "error" });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const allowedRadius = settings?.radiusMeters || 50;
  const isInsideGeofence = distanceMeters !== null && distanceMeters <= allowedRadius;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#24312e]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#dfe1dc] bg-[#24312e] px-4 py-3.5 text-white shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#30403a] text-[#f4bc83]">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="display-font text-base font-bold leading-tight sm:text-lg">
              Table & Thyme
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ac49f]">
              Staff & Attendance Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-[#44564f] bg-[#1d2725] px-3 py-1.5 text-xs font-semibold text-[#cfe0d0] hover:bg-red-950/40 hover:text-red-200 transition"
              title="Log out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        {!currentUser ? (
          /* ==================================================== */
          /* LOGIN SCREEN                                         */
          /* ==================================================== */
          <div className="rounded-3xl border border-[#dfe1dc] bg-white p-6 shadow-xl sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f1e8] text-[#315a3d]">
                <KeyRound size={26} />
              </div>
              <h2 className="display-font mt-4 text-2xl font-bold text-[#24312e]">
                Employee Sign In
              </h2>
              <p className="mt-1 text-xs text-[#68736e]">
                Enter your mobile number and 4-digit employee PIN to access geofenced attendance and shift notices.
              </p>
            </div>

            {loginError && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68736e]">
                  Registered Phone
                </label>
                <div className="relative mt-1.5">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-[#84908a]" />
                  <input
                    type="tel"
                    placeholder="e.g. 98201 11003"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] py-2.5 pl-10 pr-3 text-sm font-semibold outline-hidden focus:border-[#315a3d] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68736e]">
                  4-Digit PIN
                </label>
                <div className="relative mt-1.5">
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-[#84908a]" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] py-2.5 pl-10 pr-3 text-sm font-semibold tracking-widest outline-hidden focus:border-[#315a3d] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 w-full rounded-xl bg-[#24312e] py-3 text-sm font-bold text-white shadow-md hover:bg-[#315a3d] transition disabled:opacity-60"
              >
                {isLoggingIn ? "Verifying Credentials..." : "Sign In to Portal"}
              </button>
            </form>

            {/* Quick Demo Staff Logins */}
            <div className="mt-8 border-t border-[#f0f1ed] pt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#84908a] text-center">
                Quick 1-Tap Demo Staff Logins (PIN: 1234)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput("9820111001");
                    setPinInput("1234");
                  }}
                  className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2 text-left hover:border-[#315a3d] hover:bg-white transition"
                >
                  <p className="font-bold text-[#24312e]">Priya Shah</p>
                  <p className="text-[10px] text-[#68736e]">Manager • 9820111001</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput("9820111002");
                    setPinInput("1234");
                  }}
                  className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2 text-left hover:border-[#315a3d] hover:bg-white transition"
                >
                  <p className="font-bold text-[#24312e]">Kabir Malik</p>
                  <p className="text-[10px] text-[#68736e]">Head Chef • 9820111002</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput("9820111003");
                    setPinInput("1234");
                  }}
                  className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2 text-left hover:border-[#315a3d] hover:bg-white transition"
                >
                  <p className="font-bold text-[#24312e]">Arjun Rao</p>
                  <p className="text-[10px] text-[#68736e]">Server • 9820111003</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput("9820111006");
                    setPinInput("1234");
                  }}
                  className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2 text-left hover:border-[#315a3d] hover:bg-white transition"
                >
                  <p className="font-bold text-[#24312e]">Sunita Devi</p>
                  <p className="text-[10px] text-[#68736e]">Cleaning • 9820111006</p>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ==================================================== */
          /* LOGGED IN EMPLOYEE DASHBOARD                         */
          /* ==================================================== */
          <div className="space-y-5">
            {/* User Profile Banner */}
            <div className="rounded-3xl border border-[#dfe1dc] bg-[#24312e] p-5 text-white shadow-xl sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3d524b] text-base font-bold text-[#f4bc83]">
                    {currentUser.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <h2 className="display-font text-lg font-bold sm:text-xl">
                      {currentUser.name}
                    </h2>
                    <p className="text-xs text-[#aab8b0]">
                      {currentUser.department} • Shift: {currentUser.shift}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    attendanceStatus === "Clocked in"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : attendanceStatus === "On break"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : attendanceStatus === "Clocked out"
                      ? "bg-stone-500/20 text-stone-300 border border-stone-500/40"
                      : "bg-[#3d524b] text-[#cfe0d0]"
                  }`}
                >
                  ● {attendanceStatus}
                </span>
              </div>

              {currentUser.systemRole !== "None" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#1d2725] px-3 py-2 text-xs text-[#cfe0d0]">
                  <ShieldCheck size={16} className="text-[#f4bc83] shrink-0" />
                  <span>
                    Designated <strong>{currentUser.systemRole} Operator</strong> for restaurant control panels.
                  </span>
                </div>
              )}

              {/* Real-time Clock-in / Shift Summary Strip */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#1a2321] px-4 py-3 text-xs border border-[#3d524b]/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3d524b] text-[#f4bc83]">
                    <Clock3 size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#aab8b0] block">
                      {attendanceStatus === "Clocked in" || attendanceStatus === "On break"
                        ? "Active Punch Time & Date:"
                        : attendanceStatus === "Clocked out"
                        ? "Last Punch Out:"
                        : "Today's Schedule:"}
                    </span>
                    <strong className="text-white text-xs font-semibold">
                      {clockInTime
                        ? `${formatPunchDateTime(clockInTime).dateStr} • ${formatPunchDateTime(clockInTime).timeStr}`
                        : `Shift: ${currentUser.shift}`}
                    </strong>
                  </div>
                </div>

                {(attendanceStatus === "Clocked in" || attendanceStatus === "On break") && elapsedDuration && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#aab8b0]">Time Worked:</span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 shadow-xs">
                      ⏱️ {elapsedDuration}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* GPS Geofence Status Radar */}
            <div
              className={`rounded-2xl border p-4 transition shadow-sm ${
                isInsideGeofence
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : distanceMeters !== null
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-[#dfe1dc] bg-white text-[#24312e]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isInsideGeofence
                        ? "bg-emerald-600 text-white animate-pulse"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {isInsideGeofence
                        ? "Inside Restaurant Premises"
                        : distanceMeters !== null
                        ? "Outside 50-Meter Radius"
                        : "Detecting GPS Position..."}
                    </p>
                    <p className="mt-0.5 text-xs">
                      {distanceMeters !== null ? (
                        <>
                          You are <strong>{distanceMeters} meters</strong> away from {settings?.restaurantName || "Table & Thyme"}.
                          {isInsideGeofence
                            ? " (Within 50m radius • Ready to clock in)"
                            : " (Clock-in restricted beyond 50m)"}
                        </>
                      ) : gpsError ? (
                        <span className="text-red-700">{gpsError}</span>
                      ) : (
                        "Requesting high-accuracy device coordinates..."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <button
                    onClick={checkCurrentLocation}
                    disabled={isCheckingGps}
                    className="rounded-lg border border-[#dfe1dc] bg-white px-2.5 py-1 text-[11px] font-bold text-[#68736e] hover:bg-[#fbfaf7] transition"
                  >
                    {isCheckingGps ? "Checking..." : "Refresh GPS"}
                  </button>
                  {!isInsideGeofence && (
                    <button
                      onClick={handleSyncRestaurantLocation}
                      disabled={actionLoading}
                      className="rounded-lg bg-[#24312e] px-2.5 py-1 text-[11px] font-bold text-[#f4bc83] hover:bg-[#315a3d] transition shadow-xs"
                      title="Update restaurant coordinates to match where you are standing right now"
                    >
                      Set Restaurant Here
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Alert Banner */}
            {actionMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                  actionMessage.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border border-red-200 bg-red-50 text-red-900"
                }`}
              >
                {actionMessage.type === "success" ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex rounded-2xl border border-[#dfe1dc] bg-white p-1 text-xs font-bold shadow-xs">
              <button
                onClick={() => setActiveTab("attendance")}
                className={`flex-1 rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 ${
                  activeTab === "attendance"
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                <Clock3 size={15} />
                Attendance
              </button>
              <button
                onClick={() => setActiveTab("notices")}
                className={`flex-1 rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 relative ${
                  activeTab === "notices"
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                <Bell size={15} />
                Notices
                {announcements.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-[#b7623d]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("leaves")}
                className={`flex-1 rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 ${
                  activeTab === "leaves"
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                <Calendar size={15} />
                Leaves
              </button>
              <button
                onClick={() => setActiveTab("holidays")}
                className={`flex-1 rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 ${
                  activeTab === "holidays"
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                <Globe2 size={15} />
                Holidays
              </button>
            </div>

            {/* ==================================================== */}
            {/* TAB 1: ATTENDANCE CLOCK IN / OUT                     */}
            {/* ==================================================== */}
            {activeTab === "attendance" && (
              <div className="rounded-3xl border border-[#dfe1dc] bg-white p-6 shadow-md sm:p-7">
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#84908a]">
                    Shift Timing: {currentUser.shift}
                  </p>
                  <h3 className="display-font mt-1 text-2xl font-bold text-[#24312e]">
                    Daily Attendance Terminal
                  </h3>
                  <p className="mt-1 text-xs text-[#68736e]">
                    Tap below to log your punch. Geofencing ensures attendance is valid only within restaurant premises.
                  </p>
                </div>

                <div className="mt-7 space-y-3">
                  {attendanceStatus !== "Clocked in" && attendanceStatus !== "On break" ? (
                    <div className="space-y-3">
                      <button
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        className="w-full rounded-2xl bg-[#315a3d] py-4 text-base font-bold text-white shadow-lg hover:bg-[#254630] transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Clock3 size={20} />
                        {actionLoading ? "Verifying GPS & Punching..." : "Clock In Now"}
                      </button>

                      {!isInsideGeofence && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-2.5 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-amber-700 shrink-0" />
                            <p className="font-semibold">
                              Distance to Table & Thyme: <strong>{distanceMeters !== null ? `${distanceMeters} meters` : "Detecting..."}</strong> (Allowed: {allowedRadius}m)
                            </p>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            If you are currently at the restaurant or testing locally, click below to synchronize restaurant coordinates to your current spot, or punch in with override:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSyncRestaurantLocation}
                              disabled={actionLoading}
                              className="flex-1 rounded-xl bg-[#24312e] py-2 px-3 text-xs font-bold text-[#f4bc83] hover:bg-[#315a3d] transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <MapPin size={14} />
                              Set Restaurant Here (0m)
                            </button>
                            <button
                              type="button"
                              onClick={handleClockInOverride}
                              disabled={actionLoading}
                              className="flex-1 rounded-xl border border-amber-300 bg-amber-100 py-2 px-3 text-xs font-bold text-amber-900 hover:bg-amber-200 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <ShieldCheck size={14} />
                              Clock In with Override
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : attendanceStatus === "Clocked in" ? (
                    <div className="space-y-4">
                      {/* Active Shift Details Card */}
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 sm:p-5 text-[#24312e] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
                              <Clock3 size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                                🟢 Active Duty Clocked In
                              </span>
                              <h4 className="text-sm font-bold text-[#24312e]">
                                {clockInTime ? formatPunchDateTime(clockInTime).dateStr : "Today"}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#68736e] block">Clock-In Time</span>
                            <p className="text-sm sm:text-base font-black text-emerald-900">
                              {clockInTime ? formatPunchDateTime(clockInTime).timeStr : "--"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                          <div className="rounded-xl bg-white/90 p-2.5 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-[#68736e] block">Time Worked</span>
                            <span className="font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                              {elapsedDuration || "Calculating..."}
                            </span>
                          </div>
                          <div className="rounded-xl bg-white/90 p-2.5 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-[#68736e] block">Break Recorded</span>
                            <span className="font-semibold text-amber-900 text-xs sm:text-sm">
                              {totalBreakMinutes > 0 ? `${totalBreakMinutes} mins` : "0 mins"}
                            </span>
                          </div>
                          <div className="rounded-xl bg-white/90 p-2.5 border border-emerald-100 col-span-2 sm:col-span-1 shadow-2xs">
                            <span className="text-[10px] text-[#68736e] block">Verification</span>
                            <span className="font-semibold text-[#24312e] text-[11px] flex items-center gap-1 mt-0.5">
                              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                              {todayAttendance?.managerOverride
                                ? "Manager Override"
                                : distanceMeters !== null
                                ? `GPS ${distanceMeters}m (Verified)`
                                : "GPS On-Premises"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => handleToggleBreak("start")}
                          disabled={actionLoading}
                          className="rounded-2xl border border-amber-300 bg-amber-50 py-3.5 text-sm font-bold text-amber-900 hover:bg-amber-100 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Coffee size={18} />
                          Take Break
                        </button>
                        <button
                          onClick={handleClockOut}
                          disabled={actionLoading}
                          className="rounded-2xl bg-[#b73d3d] py-3.5 text-sm font-bold text-white hover:bg-[#992f2f] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-950/20"
                        >
                          <LogOut size={18} />
                          Clock Out
                        </button>
                      </div>
                    </div>
                  ) : attendanceStatus === "On break" ? (
                    <div className="space-y-4">
                      {/* On Break Status Card */}
                      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-[#24312e] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white font-bold shadow-xs">
                              <Coffee size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                                ☕ Currently On Meal Break
                              </span>
                              <h4 className="text-sm font-bold text-[#24312e]">
                                {clockInTime ? formatPunchDateTime(clockInTime).dateStr : "Today"}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#68736e] block">Shift Clocked In</span>
                            <p className="text-xs sm:text-sm font-bold text-[#24312e]">
                              {clockInTime ? formatPunchDateTime(clockInTime).timeStr : "--"}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-amber-900 leading-relaxed">
                          Your break is currently active. Tap below as soon as you return to duty to resume work logging.
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleBreak("end")}
                        disabled={actionLoading}
                        className="w-full rounded-2xl bg-[#315a3d] py-4 text-sm font-bold text-white hover:bg-[#254630] transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Clock3 size={18} />
                        End Break & Resume Work
                      </button>
                    </div>
                  ) : (
                    /* Clocked out */
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                              Shift Complete
                            </span>
                            <span className="font-bold text-stone-800 text-sm">
                              {clockInTime ? formatPunchDateTime(clockInTime).dateStr : "Today"}
                            </span>
                          </div>
                          <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-[11px] font-bold text-stone-700">
                            ● Clocked Out
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-white p-2 rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Clocked In</span>
                            <span className="font-bold text-stone-800">
                              {clockInTime ? formatPunchDateTime(clockInTime).timeStr : "--"}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Clocked Out</span>
                            <span className="font-bold text-stone-800">
                              {clockOutTime ? formatPunchDateTime(clockOutTime).timeStr : "--"}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Break Taken</span>
                            <span className="font-bold text-amber-800">
                              {totalBreakMinutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        className="w-full rounded-2xl border border-[#315a3d] bg-white py-3 text-xs font-bold text-[#315a3d] hover:bg-[#e8f1e8] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Clock3 size={15} />
                        Punch In Again / Start Extra Shift
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-[#f0f1ed] bg-[#fbfaf7] p-4 text-xs">
                  <div className="flex justify-between py-1 text-[#68736e]">
                    <span>Employee ID:</span>
                    <span className="font-bold text-[#24312e]">{currentUser.id}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#68736e]">
                    <span>Assigned Department:</span>
                    <span className="font-bold text-[#24312e]">{currentUser.department}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#68736e]">
                    <span>Geofence Boundary:</span>
                    <span className="font-bold text-[#315a3d]">{allowedRadius} Meters</span>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: MANAGER ANNOUNCEMENTS & NOTICES               */}
            {/* ==================================================== */}
            {activeTab === "notices" && (
              <div className="rounded-3xl border border-[#dfe1dc] bg-white p-5 shadow-md sm:p-6">
                <h3 className="display-font text-lg font-bold text-[#24312e] mb-4">
                  Restaurant Notice Board
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#84908a]">
                    No announcements posted at this time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 text-xs ${
                          item.priority === "Urgent"
                            ? "border-red-200 bg-red-50 text-red-950"
                            : "border-[#e0e2dc] bg-[#fbfaf7] text-[#24312e]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              item.priority === "Urgent"
                                ? "bg-red-600 text-white"
                                : "bg-[#315a3d] text-white"
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-[#84908a]">
                            From: {item.senderName}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#24312e]">{item.title}</h4>
                        <p className="mt-1 leading-relaxed text-[#55615b]">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 3: LEAVE APPLICATIONS                            */}
            {/* ==================================================== */}
            {activeTab === "leaves" && (
              <div className="space-y-5">
                {/* Apply for Leave Form */}
                <div className="rounded-3xl border border-[#dfe1dc] bg-white p-5 shadow-md sm:p-6">
                  <h3 className="display-font text-lg font-bold text-[#24312e]">
                    Apply for Leave / Time-Off
                  </h3>
                  <p className="mt-0.5 text-xs text-[#84908a]">
                    Requests are routed directly to the Floor Manager for approval.
                  </p>

                  <form onSubmit={handleLeaveSubmit} className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68736e]">
                          Start Date
                        </label>
                        <input
                          type="date"
                          required
                          value={leaveStartDate}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2 text-xs font-semibold outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68736e]">
                          End Date
                        </label>
                        <input
                          type="date"
                          required
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2 text-xs font-semibold outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68736e]">
                        Leave Type
                      </label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2 text-xs font-semibold outline-hidden"
                      >
                        <option value="Casual">Casual Leave</option>
                        <option value="Sick">Medical / Sick Leave</option>
                        <option value="Vacation">Vacation Leave</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68736e]">
                        Reason
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Briefly state your reason..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-xs font-semibold outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLeave}
                      className="w-full rounded-xl bg-[#24312e] py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-60"
                    >
                      {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
                    </button>
                  </form>
                </div>

                {/* My Leave Requests History */}
                <div className="rounded-3xl border border-[#dfe1dc] bg-white p-5 shadow-md sm:p-6">
                  <h4 className="display-font text-base font-bold text-[#24312e] mb-3">
                    My Leave Requests
                  </h4>
                  {myLeaves.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[#84908a]">
                      No previous leave applications.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {myLeaves.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between border-b border-[#f0f1ed] py-3 last:border-0 text-xs"
                        >
                          <div>
                            <p className="font-bold text-[#24312e]">
                              {l.leaveType} Leave • {l.startDate} to {l.endDate}
                            </p>
                            <p className="text-[11px] text-[#84908a] mt-0.5">{l.reason}</p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              l.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : l.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 4: UPCOMING HOLIDAYS                             */}
            {/* ==================================================== */}
            {activeTab === "holidays" && (
              <div className="rounded-3xl border border-[#dfe1dc] bg-white p-5 shadow-md sm:p-6">
                <h3 className="display-font text-lg font-bold text-[#24312e] mb-3">
                  Upcoming Holidays Calendar
                </h3>
                <p className="text-xs text-[#84908a] mb-4">
                  Official restaurant and national holidays schedule for this season.
                </p>
                <div className="space-y-2.5">
                  {upcomingHolidays.map((h) => (
                    <div
                      key={h.name}
                      className="flex items-center justify-between rounded-xl border border-[#f0f1ed] bg-[#fbfaf7] p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-[#24312e] text-white">
                          <span className="text-[9px] font-bold uppercase text-[#f4bc83]">
                            {h.date.split(" ")[1]}
                          </span>
                          <span className="text-xs font-bold leading-none">
                            {h.date.split(" ")[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-[#24312e]">{h.name}</p>
                          <p className="text-[10px] text-[#84908a]">{h.day} • {h.type}</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-white border border-[#dfe1dc] px-2.5 py-1 text-[10px] font-bold text-[#315a3d]">
                        Restaurant Closed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
