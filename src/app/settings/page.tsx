"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { StorageService, StorageMode, CheckIn } from "@/lib/storage";
import { useProfile } from "@/lib/useProfile";
import { PremiumGate } from "@/components/PremiumGate";
import {
  User,
  Mail,
  LogOut,
  Bell,
  Tag,
  BarChart2,
  Download,
  FileText,
  Trash2,
  Plus,
  X,
  Check,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { LocalNotifications } from "@capacitor/local-notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

type CheckIn = {
  id: string;
  created_at: string;
  decision: "yes" | "no" | "undecided";
  tags: string[];
  notes?: string | null;
};

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="heading-serif text-xs uppercase tracking-widest text-[#9A9184] mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-2xl border border-[#E0D7C7] bg-white/80 overflow-hidden divide-y divide-[#F0EBE0]">
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  sublabel,
  children,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-50" : "bg-[color:var(--sage-soft)]/40"
          }`}
      >
        <Icon
          className={`h-4 w-4 ${danger ? "text-red-500" : "text-[#8A9A5B]"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-tight ${danger ? "text-red-600" : "text-[#3F3A33]"
            }`}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-[#9A9184] mt-0.5 truncate">{sublabel}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#E0D7C7] bg-[#FDFBF7] p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="heading-serif text-lg text-center text-[#3F3A33] mb-2">
          {title}
        </h3>
        <p className="text-sm text-center text-[#6F685E] leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[#E0D7C7] bg-white py-3 text-sm font-medium text-[#6F685E] transition-all hover:bg-[#F5F0E8] active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { profile, isLoading: profileLoading, refetch } = useProfile();

  // Account
  const [userEmail, setUserEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("21:00");

  // Custom tags
  const [newTag, setNewTag] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Export / PDF
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Danger zone
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Storage Mode
  const [storageMode, setStorageMode] = useState<StorageMode>("cloud");
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Advanced insights toggle
  const [advancedInsights, setAdvancedInsights] = useState(false);

  // Load user email + reminder prefs
  useEffect(() => {
    const mode = StorageService.getMode();
    setStorageMode(mode);
    if (mode === "cloud") {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) { router.replace("/auth"); return; }
        setUserEmail(user.email ?? "");
      });
    } else {
      setUserEmail("Local Offline User");
    }

    // Restore reminder settings from localStorage
    const savedEnabled = localStorage.getItem("reminder_enabled");
    const savedTime = localStorage.getItem("reminder_time");
    const savedAdvanced = localStorage.getItem("advanced_insights");
    if (savedEnabled !== null) setRemindersEnabled(savedEnabled === "true");
    if (savedTime) setReminderTime(savedTime);
    if (savedAdvanced !== null) setAdvancedInsights(savedAdvanced === "true");
  }, [router]);

  // Sync display name from profile
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveDisplayName() {
    if (!profile) return;
    setIsSavingName(true);
    try {
      await StorageService.updateProfile({ display_name: displayName.trim() || null });
      toast.success("Name updated!");
      setNameEditing(false);
      await refetch();
    } catch {
      toast.error("Couldn't save name");
    }
    setIsSavingName(false);
  }

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // They are already logged into a cloud account but mode is local.
        // Migrate their local data up, then switch mode.
        await StorageService.uploadLocalDataToCloud(user.id);
        StorageService.setMode("cloud");
        setStorageMode("cloud");
        setUserEmail(user.email ?? "");
        toast.success("Local data synced to your Cloud account!");
      } else {
        // Redirect to auth to sign in/up, passing a query param so auth page knows to migrate
        router.push("/auth?upgrade=true");
      }
    } catch (e) {
      toast.error("Failed to upgrade");
    }
    setIsUpgrading(false);
  }

  async function handleDowngrade() {
    setIsDowngrading(true);
    try {
      const checkIns = await StorageService.getCheckIns();
      const currentProfile = await StorageService.getProfile();
      
      await StorageService.deleteData();
      StorageService.setMode("local");
      
      localStorage.setItem("local_checkins", JSON.stringify(checkIns));
      if (currentProfile) {
         localStorage.setItem("local_profile", JSON.stringify(currentProfile));
      }
      
      setStorageMode("local");
      setUserEmail("Local Offline User");
      setShowDowngradeModal(false);
      toast.success("Successfully downgraded to Local Only");
    } catch (e) {
      toast.error("Downgrade failed");
    }
    setIsDowngrading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  async function handleReminderToggle(enabled: boolean) {
    setRemindersEnabled(enabled);
    localStorage.setItem("reminder_enabled", String(enabled));
    if (enabled) {
      try {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display === "prompt") {
          permStatus = await LocalNotifications.requestPermissions();
        }
        if (permStatus.display !== "granted") {
          toast.error("Notification permission denied");
          setRemindersEnabled(false);
          localStorage.setItem("reminder_enabled", "false");
          return;
        }
        await scheduleNotification(reminderTime);
        toast.success("Reminder enabled!", { description: `We'll remind you at ${reminderTime} each day.` });
      } catch (e) {
        // Fallback for web
        if (typeof window !== "undefined" && "Notification" in window) {
          void Notification.requestPermission();
        }
        toast.success("Reminder enabled!", { description: `We'll remind you at ${reminderTime} each day.` });
      }
    } else {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      } catch (e) {}
      toast("Reminder turned off");
    }
  }

  async function scheduleNotification(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Daily Check-in",
            body: "Take a moment to reflect on how you feel today.",
            id: 1,
            schedule: {
              on: { hour: hours, minute: minutes },
              allowWhileIdle: true,
            },
          },
        ],
      });
    } catch (e) {}
  }

  async function handleReminderTimeChange(time: string) {
    setReminderTime(time);
    localStorage.setItem("reminder_time", time);
    if (remindersEnabled) {
      await scheduleNotification(time);
      toast.success("Reminder time updated", { description: `New time: ${time}` });
    }
  }

  function handleAdvancedInsightsToggle(enabled: boolean) {
    setAdvancedInsights(enabled);
    localStorage.setItem("advanced_insights", String(enabled));
    toast(enabled ? "Advanced Insights enabled" : "Advanced Insights disabled");
  }

  async function handleAddTag() {
    const tag = newTag.trim();
    if (!tag || !profile) return;
    if ((profile.custom_tags ?? []).includes(tag)) {
      toast.error("Tag already exists");
      return;
    }

    setIsSavingTags(true);
    try {
      const updatedTags = [...(profile.custom_tags ?? []), tag];
      await StorageService.updateProfile({ custom_tags: updatedTags });
      setNewTag("");
      await refetch();
      toast.success(`"${tag}" added`);
    } catch {
      toast.error("Couldn't save tag");
    }
    setIsSavingTags(false);
  }

  async function handleRemoveTag(tag: string) {
    if (!profile) return;
    try {
      const updatedTags = (profile.custom_tags ?? []).filter((t) => t !== tag);
      await StorageService.updateProfile({ custom_tags: updatedTags });
      await refetch();
      toast(`"${tag}" removed`);
    } catch {
      toast.error("Couldn't remove tag");
    }
  }

  async function handleExportCSV() {
    setIsExporting(true);
    try {
      const data = await StorageService.getCheckIns();
      if (!data) throw new Error("No data");

      const rows = [
        ["Date", "Decision", "Tags", "Notes"],
        ...data.map((c: CheckIn) => [
          new Date(c.created_at).toLocaleDateString(),
          c.decision,
          (c.tags ?? []).join("; "),
          c.notes ?? "",
        ]),
      ];

      const csv = rows
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `the-choice-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleGeneratePDF() {
    setIsGeneratingPdf(true);
    try {
      let data = await StorageService.getCheckIns();
      if (!data) throw new Error("No data");

      // Fetch last 90 days
      const since = new Date();
      since.setDate(since.getDate() - 90);

      data = data.filter(c => new Date(c.created_at) >= since);
      data.reverse(); // ascending order for pdf

      // Dynamic import — jspdf is large, only load when needed
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210;
      const margin = 20;
      let y = margin;

      const W = pageW - margin * 2;

      // Helpers
      const addText = (
        text: string,
        x: number,
        yPos: number,
        opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: "left" | "center" | "right" } = {}
      ) => {
        const { size = 11, bold = false, color = [63, 58, 51], align = "left" } = opts;
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        doc.text(text, x, yPos, { align });
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > 270) {
          doc.addPage();
          y = margin;
        }
      };

      // ── Header — matches the icon's two-line typographic layout ──
      doc.setFillColor(250, 248, 244);
      doc.rect(0, 0, pageW, 48, "F");
      // "the" — small, light weight
      addText("the", pageW / 2, 14, { size: 11, bold: false, color: [138, 154, 91], align: "center" });
      // "Choice" — large, bold
      addText("Choice", pageW / 2, 26, { size: 24, bold: true, color: [138, 154, 91], align: "center" });
      addText("Report · Last 90 Days", pageW / 2, 35, { size: 10, color: [111, 104, 94], align: "center" });
      addText(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 43, { size: 8, color: [154, 145, 132], align: "center" });
      y = 56;


      // ── Overview ──
      const yes = data.filter((c: CheckIn) => c.decision === "yes").length;
      const no = data.filter((c: CheckIn) => c.decision === "no").length;
      const undecided = data.filter((c: CheckIn) => c.decision === "undecided").length;
      const total = data.length;

      doc.setDrawColor(224, 215, 199);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, W, 38, 4, 4, "FD");

      addText("Overview", margin + 6, y + 10, { size: 12, bold: true });
      addText(`Total check-ins: ${total}`, margin + 6, y + 20, { size: 10 });
      addText(`✓ Yes: ${yes} (${total > 0 ? Math.round((yes / total) * 100) : 0}%)`, margin + 6, y + 28, { size: 10, color: [107, 142, 35] });
      addText(`✗ No: ${no} (${total > 0 ? Math.round((no / total) * 100) : 0}%)`, margin + 6 + W / 3, y + 28, { size: 10, color: [180, 100, 90] });
      addText(`~ Undecided: ${undecided}`, margin + 6 + (W / 3) * 2, y + 28, { size: 10, color: [111, 104, 94] });
      y += 48;

      // ── Tag frequency ──
      const tagCounts: Record<string, number> = {};
      data.forEach((c: CheckIn) => (c.tags ?? []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

      if (topTags.length > 0) {
        ensureSpace(60);
        addText("Most Common Context Tags", margin, y, { size: 12, bold: true });
        y += 8;

        doc.setDrawColor(224, 215, 199);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, W, topTags.length * 9 + 8, 4, 4, "FD");
        y += 6;

        topTags.forEach(([tag, count]) => {
          addText(`• ${tag}`, margin + 6, y, { size: 10 });
          addText(`${count}×`, margin + W - 6, y, { size: 10, align: "right", color: [138, 154, 91] });
          y += 9;
        });
        y += 8;
      }

      // ── Streaks ──
      ensureSpace(40);
      let maxYesStreak = 0; let currentStreak = 0;
      data.forEach((c: CheckIn) => {
        if (c.decision === "yes") { currentStreak++; maxYesStreak = Math.max(maxYesStreak, currentStreak); }
        else currentStreak = 0;
      });

      doc.setDrawColor(224, 215, 199);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, W, 26, 4, 4, "FD");
      addText("Longest 'Yes' streak:", margin + 6, y + 10, { size: 10 });
      addText(`${maxYesStreak} day${maxYesStreak !== 1 ? "s" : ""}`, margin + 6, y + 19, { size: 13, bold: true, color: [138, 154, 91] });
      y += 36;

      // ── Full log ──
      ensureSpace(20);
      addText("Full Check-In Log", margin, y, { size: 12, bold: true });
      y += 8;

      data.forEach((c: CheckIn) => {
        ensureSpace(10);
        const dateStr = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const decisionStr = c.decision === "yes" ? "Yes" : c.decision === "no" ? "No" : "Undecided";
        const color: [number, number, number] = c.decision === "yes" ? [107, 142, 35] : c.decision === "no" ? [180, 100, 90] : [111, 104, 94];

        addText(dateStr, margin, y, { size: 9, color: [154, 145, 132] });
        addText(decisionStr, margin + 22, y, { size: 9, bold: true, color });
        if (c.tags?.length) addText(c.tags.join(", "), margin + 50, y, { size: 8, color: [154, 145, 132] });
        y += 7;
      });

      // ── Footer ──
      doc.setFontSize(8);
      doc.setTextColor(154, 145, 132);
      doc.text("Generated by the Choice · private & confidential", pageW / 2, 290, { align: "center" });

      doc.save(`the-choice-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleDeleteData() {
    setIsDeletingData(true);
    try {
      if (storageMode === "cloud") {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) await supabase.from("daily_checkins").delete().eq("user_id", user.id);
      } else {
         localStorage.removeItem("local_checkins");
      }
      toast.success("All check-in data deleted");
      setShowDeleteDataModal(false);
    } catch {
      toast.error("Couldn't delete data");
    }
    setIsDeletingData(false);
  }

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    try {
      await StorageService.deleteData();
      toast.success("Account and data completely deleted");
      router.replace("/auth");
    } catch {
      toast.error("Couldn't delete account");
    }
    setIsDeletingAccount(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center pb-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#8A9A5B]" />
      </main>
    );
  }

  const isPremium = profile?.is_premium ?? false;

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-[#9A9184] uppercase tracking-widest mb-1">Your account</p>
        <h1 className="heading-serif text-3xl text-[#3F3A33]">Settings</h1>
        {isPremium && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C4A882]/20 to-[#A88B67]/20 border border-[#C4A882]/40 px-3 py-1">
            <Sparkles className="h-3 w-3 text-[#C4A882]" />
            <span className="text-xs font-semibold text-[#A88B67]">Premium member</span>
          </div>
        )}
      </div>

      <div className="px-5 space-y-6">

        {/* ── Account ── */}
        <Section title="Account">
          {/* Display name */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/40">
                <User className="h-4 w-4 text-[#8A9A5B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#9A9184] mb-1">Display name</p>
                {nameEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleSaveDisplayName(); }}
                      placeholder="Your name"
                      className="flex-1 rounded-xl border border-[#E0D7C7] bg-white px-3 py-1.5 text-sm text-[#3F3A33] outline-none focus:border-[#8A9A5B]"
                      autoFocus
                    />
                    <button
                      onClick={() => void handleSaveDisplayName()}
                      disabled={isSavingName}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8A9A5B] text-white disabled:opacity-50"
                    >
                      {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { setNameEditing(false); setDisplayName(profile?.display_name ?? ""); }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0EBE0] text-[#6F685E]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNameEditing(true)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-sm text-[#3F3A33]">
                      {profile?.display_name || <span className="text-[#9A9184] italic">Add a display name…</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#9A9184]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cloud-only account details */}
          {storageMode === "cloud" && (
            <>
              {/* Email */}
              <SettingRow icon={Mail} label="Email" sublabel={userEmail}>
                <span className="text-xs text-[#9A9184]">read-only</span>
              </SettingRow>

              {/* Sign out */}
              <button
                onClick={() => void handleSignOut()}
                className="w-full text-left transition-colors hover:bg-red-50/50 active:bg-red-50"
              >
                <SettingRow icon={LogOut} label="Sign out" danger />
              </button>
            </>
          )}
        </Section>

        {/* ── Daily Reminder (free) ── */}
        <Section title="Daily Reminder">
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/40">
                <Bell className="h-4 w-4 text-[#8A9A5B]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#3F3A33]">Remind me to check in</p>
                <p className="text-xs text-[#9A9184] mt-0.5">A gentle nudge each day</p>
              </div>
              {/* Toggle */}
              <button
                id="reminder-toggle"
                role="switch"
                aria-checked={remindersEnabled}
                onClick={() => handleReminderToggle(!remindersEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${remindersEnabled ? "bg-[#8A9A5B]" : "bg-[#D9D2C5]"
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${remindersEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          {remindersEnabled && (
            <div className="px-4 py-3.5 border-t border-[#F0EBE0]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/40">
                  <Bell className="h-4 w-4 text-[#8A9A5B] opacity-0" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <p className="text-sm text-[#3F3A33]">Reminder time</p>
                  <input
                    id="reminder-time-input"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="rounded-xl border border-[#E0D7C7] bg-white px-3 py-1.5 text-sm text-[#3F3A33] outline-none focus:border-[#8A9A5B]"
                  />
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── Advanced Insights (premium) ── */}
        <Section title="Insights">
          <PremiumGate
            isPremium={isPremium}
            featureName="Advanced Insights"
            description="Unlock day-of-week patterns, monthly comparisons, and your most conflicted periods."
          >
            {/* Shown only when isPremium = true */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/40">
                  <BarChart2 className="h-4 w-4 text-[#8A9A5B]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#3F3A33]">Advanced Insights</p>
                  <p className="text-xs text-[#9A9184] mt-0.5">Day-of-week patterns, monthly comparisons</p>
                </div>
                <button
                  id="advanced-insights-toggle"
                  role="switch"
                  aria-checked={advancedInsights}
                  onClick={() => handleAdvancedInsightsToggle(!advancedInsights)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${advancedInsights ? "bg-[#8A9A5B]" : "bg-[#D9D2C5]"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${advancedInsights ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>
          </PremiumGate>
        </Section>

        {/* ── Custom Tags (premium) ── */}
        <Section title="Tags">
          <PremiumGate
            isPremium={isPremium}
            featureName="Custom Tags"
            description="Create your own context tags to track exactly what matters to you."
          >
            {/* Shown only when isPremium = true */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/40">
                  <Tag className="h-4 w-4 text-[#8A9A5B]" />
                </div>
                <p className="text-sm font-medium text-[#3F3A33]">Your custom tags</p>
              </div>

              {/* Existing tags */}
              {(profile?.custom_tags ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(profile?.custom_tags ?? []).map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full border border-[#E0D7C7] bg-[#F5F0E8] px-3 py-1"
                    >
                      <span className="text-sm text-[#3F3A33]">{tag}</span>
                      <button
                        onClick={() => void handleRemoveTag(tag)}
                        className="text-[#9A9184] hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9A9184] italic">No custom tags yet</p>
              )}

              {/* Add tag input */}
              <div className="flex items-center gap-2">
                <input
                  ref={tagInputRef}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleAddTag(); }}
                  placeholder="Add a tag…"
                  maxLength={30}
                  className="flex-1 rounded-xl border border-[#E0D7C7] bg-white px-3 py-2 text-sm text-[#3F3A33] outline-none focus:border-[#8A9A5B]"
                />
                <button
                  id="add-tag-btn"
                  onClick={() => void handleAddTag()}
                  disabled={!newTag.trim() || isSavingTags}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8A9A5B] text-white disabled:opacity-40"
                >
                  {isSavingTags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </PremiumGate>
        </Section>

        {/* ── Export Data + Therapist Report (premium) ── */}
        <Section title="Your Data">
          <PremiumGate
            isPremium={isPremium}
            featureName="Export as CSV"
            description="Download your complete check-in history as a spreadsheet."
          >
            {/* Shown only when isPremium = true */}
            <button
              id="export-csv-btn"
              onClick={() => void handleExportCSV()}
              disabled={isExporting}
              className="w-full text-left transition-colors hover:bg-[#F5F0E8] active:bg-[#EDE8DF]"
            >
              <SettingRow
                icon={Download}
                label="Export as CSV"
                sublabel="Download your complete check-in history"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#9A9184]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#9A9184]" />
                )}
              </SettingRow>
            </button>
          </PremiumGate>

          {/* Therapist Report — separate premium gate */}
          <PremiumGate
            isPremium={isPremium}
            featureName="Report (PDF)"
            description="A 90-day summary — perfect to share with your therapist :D"
          >
            {/* Shown only when isPremium = true */}
            <button
              id="generate-pdf-btn"
              onClick={() => void handleGeneratePDF()}
              disabled={isGeneratingPdf}
              className="w-full text-left transition-colors hover:bg-[#F5F0E8] active:bg-[#EDE8DF]"
            >
              <SettingRow
                icon={FileText}
                label="Report (PDF)"
                sublabel="90-day summary with tag patterns & streaks"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#9A9184]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#9A9184]" />
                )}
              </SettingRow>
            </button>
          </PremiumGate>
        </Section>

        {/* ── Data & Privacy ── */}
        <Section title="Data & Privacy">
           <div className="px-4 py-3.5 border-b border-[#F0EBE0]">
              <p className="text-sm text-[#3F3A33]">
                Current Mode: <span className="font-semibold">{storageMode === "cloud" ? "Cloud Sync" : "Local Only"}</span>
              </p>
           </div>
           {storageMode === "local" ? (
             <button
                onClick={() => void handleUpgrade()}
                disabled={isUpgrading}
                className="w-full text-left transition-colors hover:bg-[#F5F0E8] active:bg-[#EDE8DF]"
              >
                <SettingRow
                  icon={Sparkles}
                  label="Upgrade to Cloud Sync"
                  sublabel="Back up your data across devices"
                >
                  {isUpgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#9A9184]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#9A9184]" />
                  )}
                </SettingRow>
              </button>
           ) : (
             <button
                onClick={() => setShowDowngradeModal(true)}
                className="w-full text-left transition-colors hover:bg-[#F5F0E8] active:bg-[#EDE8DF]"
              >
                <SettingRow
                  icon={Download}
                  label="Downgrade to Local Only"
                  sublabel="Delete cloud account and keep data on this device"
                >
                  <ChevronRight className="h-4 w-4 text-[#9A9184]" />
                </SettingRow>
              </button>
           )}
        </Section>

        {/* ── About ── */}
        <Section title="About">
          <Link
            href="/privacy"
            className="block w-full text-left transition-colors hover:bg-[#F5F0E8] active:bg-[#EDE8DF]"
          >
            <SettingRow
              icon={FileText}
              label="Privacy Policy"
              sublabel="Read how we protect your data"
            >
              <ChevronRight className="h-4 w-4 text-[#9A9184]" />
            </SettingRow>
          </Link>
        </Section>

        {/* ── Danger Zone ── */}
        <Section title="Danger Zone">
          <button
            id="delete-data-btn"
            onClick={() => setShowDeleteDataModal(true)}
            className="w-full text-left transition-colors hover:bg-red-50/50 active:bg-red-50"
          >
            <SettingRow
              icon={Trash2}
              label="Delete all check-in data"
              sublabel="Permanently removes your history"
              danger
            >
              <ChevronRight className="h-4 w-4 text-red-400" />
            </SettingRow>
          </button>

          <button
            id="delete-account-btn"
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full text-left transition-colors hover:bg-red-50/50 active:bg-red-50"
          >
            <SettingRow
              icon={Trash2}
              label="Delete my account"
              sublabel="Removes your account and all data forever"
              danger
            >
              <ChevronRight className="h-4 w-4 text-red-400" />
            </SettingRow>
          </button>
        </Section>

        {/* App version */}
        <p className="text-center text-xs text-[#9A9184] pb-2">
          the Choice · v1.0.0
        </p>
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        isOpen={showDeleteDataModal}
        title="Delete all data?"
        message="This will permanently delete all your check-ins, notes, and tags. This cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={() => void handleDeleteData()}
        onCancel={() => setShowDeleteDataModal(false)}
        isLoading={isDeletingData}
      />

      <ConfirmModal
        isOpen={showDeleteAccountModal}
        title="Delete your account?"
        message="This will sign you out and request account deletion. Your data will be permanently removed. This cannot be undone."
        confirmLabel="Delete account"
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setShowDeleteAccountModal(false)}
        isLoading={isDeletingAccount}
      />
      <ConfirmModal
        isOpen={showDowngradeModal}
        title="Downgrade to Local Only?"
        message="This will download all your cloud data to this device, and then permanently delete your cloud account from our servers."
        confirmLabel="Downgrade to Local"
        onConfirm={() => void handleDowngrade()}
        onCancel={() => setShowDowngradeModal(false)}
        isLoading={isDowngrading}
      />
    </main>
  );
}
