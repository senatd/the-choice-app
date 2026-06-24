"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Heart,
  Moon,
  Star,
  LineChart,
  Sparkles,
  Brain,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { DAILY_NUGGETS } from "@/lib/nuggets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Desire = "yes" | "no" | "undecided" | null;

type CheckIn = {
  id: string;
  created_at: string;
  decision: "yes" | "no" | "undecided";
  tags: string[];
  notes?: string | null;
};

const GENERAL_TAGS = [
  "Partner dynamics",
  "Energy levels",
  "Family pressure",
];

const YES_TAGS = [
  "Saw a cute baby",
  "Nesting instinct",
  "Feeling maternal",
  "Financial confidence",
  "Craving family",
];

const NO_TAGS = [
  "Career focus",
  "Valuing freedom",
  "World anxiety",
  "Financial anxiety",
  "Enjoying quiet",
  "Physical toll fear",
  "Loss of identity",
  "Mental load",
];



function isSameLocalDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function Home() {
  const [todayEntry, setTodayEntry] = useState<CheckIn | null>(null);
  const [draftDesire, setDraftDesire] = useState<Desire>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<{ decision: string }[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    setUser(user);

    // Fetch all check-ins
    const { data: checkIns } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (checkIns) {
      setHistory(checkIns.map(c => ({ decision: c.decision })));
      // Find today's entry
      const today = new Date();
      const todayCheckIn = checkIns.find(c => isSameLocalDay(new Date(c.created_at), today));
      if (todayCheckIn) {
        setTodayEntry(todayCheckIn);
        setDraftDesire(todayCheckIn.decision);
        setSelectedTags(todayCheckIn.tags ?? []);
        setNotes(todayCheckIn.notes ?? "");
      }
    }

    // Fetch profile (display name + custom tags)
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, custom_tags")
      .eq("id", user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setCustomTags(profile.custom_tags ?? []);
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Open dialog pre-filled with today's data when editing
  const handleOpenDialog = (open: boolean) => {
    if (open && todayEntry) {
      setDraftDesire(todayEntry.decision);
      setSelectedTags(todayEntry.tags ?? []);
      setNotes(todayEntry.notes ?? "");
    } else if (open && !todayEntry) {
      setDraftDesire(null);
      setSelectedTags([]);
      setNotes("");
    }
    setOpen(open);
  };

  const nugget = useMemo(
    () => DAILY_NUGGETS[new Date().getDate() % DAILY_NUGGETS.length],
    []
  );

  const stats = useMemo(() => {
    if (history.length === 0) return { yesPercent: 0, noPercent: 0 };
    const yes = history.filter(l => l.decision === "yes").length;
    const no = history.filter(l => l.decision === "no").length;
    const total = yes + no;
    if (total === 0) return { yesPercent: 0, noPercent: 0 };
    return {
      yesPercent: Math.round((yes / total) * 100),
      noPercent: Math.round((no / total) * 100),
    };
  }, [history]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Build the tag list for the dialog — decision-aware + general + custom tags
  const dialogTags = useMemo(() => {
    if (draftDesire === "undecided" || !draftDesire) return customTags;
    const contextTags = draftDesire === "yes" ? YES_TAGS : draftDesire === "no" ? NO_TAGS : [];
    const allBuiltIn = [...contextTags, ...GENERAL_TAGS];
    // Add custom tags that aren't already in the list
    const extras = customTags.filter(t => !allBuiltIn.includes(t));
    return [...allBuiltIn, ...extras];
  }, [draftDesire, customTags]);

  const handleDesireChange = (newDesire: Desire) => {
    setDraftDesire(newDesire);
    // When switching desires, remove any selected tags that belong to the opposing context
    if (newDesire === "undecided") {
      // Clear all built-in tags if switching to unsure
      setSelectedTags(prev => prev.filter(tag => customTags.includes(tag) && !YES_TAGS.includes(tag) && !NO_TAGS.includes(tag) && !GENERAL_TAGS.includes(tag)));
      return;
    }

    const validTagsForNewDesire = newDesire === "yes" ? YES_TAGS : newDesire === "no" ? NO_TAGS : [];
    const allValidBuiltIn = [...validTagsForNewDesire, ...GENERAL_TAGS];
    
    setSelectedTags(prev => prev.filter(tag => 
      allValidBuiltIn.includes(tag) || (customTags.includes(tag) && !YES_TAGS.includes(tag) && !NO_TAGS.includes(tag))
    ));
  };

  const handleSaveCheckIn = async (desire: Desire) => {
    if (!desire || !user) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      if (todayEntry) {
        // UPDATE existing entry
        const { error } = await supabase
          .from("daily_checkins")
          .update({ decision: desire, tags: selectedTags, notes: notes.trim() || null })
          .eq("id", todayEntry.id);
        if (error) throw error;
        setTodayEntry({ ...todayEntry, decision: desire, tags: selectedTags, notes: notes.trim() || null });
        toast.success("Check-in updated");
      } else {
        // INSERT new entry
        const { data, error } = await supabase
          .from("daily_checkins")
          .insert({ user_id: user.id, decision: desire, tags: selectedTags, notes: notes.trim() || null })
          .select()
          .single();
        if (error) throw error;
        setTodayEntry(data);
        setHistory(prev => [{ decision: desire }, ...prev]);
        toast.success("Checked in ✓");
      }
      setOpen(false);
    } catch {
      setSaveError("We couldn't save your check-in. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const greetingName = displayName || "there";
  const hours = new Date().getHours();
  const greetingTimeOfDay =
    hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";

  const desireLabel =
    todayEntry?.decision === "yes"
      ? "Today leans toward wanting a child."
      : todayEntry?.decision === "no"
      ? "Today leans away from wanting a child."
      : todayEntry?.decision === "undecided"
      ? "Today feels genuinely undecided."
      : "You haven't checked in yet today.";

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-[#6F685E]">Settling you into your space…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sage-soft)] bg-white/70 px-3 py-1 text-xs font-medium text-[#6F685E] soft-shadow">
            <Sparkles className="h-3 w-3 text-[#8A9A5B]" />
            <span>the Choice</span>
          </div>
          <h1 className="heading-serif text-xl font-semibold tracking-tight text-[#3F3A33] sm:text-2xl lg:text-3xl">
            {greetingTimeOfDay}, {greetingName}.
          </h1>
          <p className="max-w-xl text-[0.82rem] leading-relaxed text-[#6F685E] sm:text-sm">
            Track your daily desire for (or against) having a child, alongside the
            context of your body, mood, and life.
          </p>
        </div>
        <div className="hidden items-center gap-3 rounded-3xl border border-transparent bg-white/70 px-4 py-3 text-xs text-[#6F685E] soft-shadow sm:flex">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-[#C46A4A]" />
            <div className="space-y-0.5">
              <p className="heading-serif text-sm font-medium text-[#3F3A33]">
                Gentle, not prescriptive.
              </p>
              <p className="text-[0.7rem] text-[#6F685E]">
                No answers. Just patterns, over time.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 space-y-5 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-start md:space-y-0 md:gap-5">
        <div className="space-y-5">
          <Card className="paper-surface text-[#3F3A33]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Today&apos;s Check-in</span>
                <span className="text-xs font-normal text-[#8C8275]">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </CardTitle>
              <CardDescription>
                {todayEntry
                  ? "You've checked in today. Tap to update your reflection."
                  : "A single, honest answer is enough for today."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {!todayEntry && (
                  <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-[#6F685E] border border-[color:var(--sage-soft)]">
                    <Brain className="h-3.5 w-3.5 text-[#8A9A5B]" />
                    <span>How does it feel today?</span>
                  </div>
                )}
                <Dialog open={open} onOpenChange={handleOpenDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      variant={todayEntry ? "outline" : "default"}
                      className={`mt-1 h-12 w-full justify-center rounded-full text-base sm:mt-0 sm:w-auto sm:px-7 gap-2 ${
                        todayEntry ? "border-[color:var(--sage-soft)] text-[#8A9A5B] hover:bg-[color:var(--sage-soft)]/20" : ""
                      }`}
                    >
                      {todayEntry ? (
                        <>
                          <Pencil className="h-4 w-4" />
                          Edit today&apos;s check-in
                        </>
                      ) : (
                        "Check in now"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {todayEntry ? "Update today's reflection" : "Do I want to have a child today?"}
                      </DialogTitle>
                      <DialogDescription>
                        There&apos;s no right answer. Capture what feels most true in
                        this moment.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <Button
                          variant={draftDesire === "yes" ? "default" : "outline"}
                          className="w-full justify-center gap-2"
                          onClick={() => handleDesireChange("yes")}
                          disabled={isSaving}
                        >
                          <img src="/icon-yes.png" alt="Yes" className="h-4 w-4 object-contain" />
                          Yes
                        </Button>
                        <Button
                          variant={draftDesire === "no" ? "default" : "outline"}
                          className="w-full justify-center gap-2"
                          onClick={() => handleDesireChange("no")}
                          disabled={isSaving}
                        >
                          <Star className="h-4 w-4" />
                          No
                        </Button>
                        <Button
                          variant={draftDesire === "undecided" ? "default" : "outline"}
                          className="w-full justify-center"
                          onClick={() => handleDesireChange("undecided")}
                          disabled={isSaving}
                        >
                          Unsure
                        </Button>
                      </div>

                      {saveError && (
                        <p className="text-[0.7rem] text-[#C46A4A]">{saveError}</p>
                      )}

                      {dialogTags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-900/80">
                            Context tags
                          </p>
                          <p className="text-xs text-emerald-900/80">
                            If you&apos;d like, tag what might be shaping today&apos;s
                            feeling.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {dialogTags.map((tag) => {
                              const active = selectedTags.includes(tag);
                              const isCustom = customTags.includes(tag) && !GENERAL_TAGS.includes(tag) && !YES_TAGS.includes(tag) && !NO_TAGS.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleToggleTag(tag)}
                                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50 rounded-full"
                                >
                                  <Badge
                                    active={active}
                                    variant={active ? "solid" : isCustom ? "muted" : "outline"}
                                  >
                                    {isCustom && "✦ "}{tag}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="notes" className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-900/80">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          placeholder="Why do you feel this way today?"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full rounded-2xl border border-[color:var(--sage-soft)] bg-[#FDFBF7] px-3 py-2 text-[0.8rem] text-[#3F3A33] outline-none transition focus:border-[color:var(--sage)] min-h-[80px] resize-none"
                        />
                      </div>

                      <Button
                        className="w-full justify-center rounded-full mt-2 gap-2"
                        onClick={() => handleSaveCheckIn(draftDesire)}
                        disabled={isSaving || !draftDesire}
                      >
                        {isSaving ? (
                          "Saving…"
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            {todayEntry ? "Update check-in" : "Save check-in"}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Today's status card */}
              <div className={`rounded-2xl px-4 py-3 text-sm text-[#3F3A33] border transition-colors ${
                todayEntry
                  ? "bg-[color:var(--sage-soft)]/15 border-[color:var(--sage-soft)]/60"
                  : "bg-white/80 border-[color:var(--sage-soft)]/70"
              }`}>
                <p className="heading-serif text-sm font-medium">
                  {todayEntry ? "Today's reflection" : "Waiting for today's check-in"}
                </p>
                <p className="mt-1 text-xs text-[#6F685E]">{desireLabel}</p>
                {selectedTags.length > 0 && todayEntry && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(todayEntry.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="muted">{tag}</Badge>
                    ))}
                  </div>
                )}
                {todayEntry?.notes && (
                  <p className="mt-2 text-[0.75rem] text-[#6F685E] italic leading-relaxed">
                    &ldquo;{todayEntry.notes}&rdquo;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance card */}
          <Card className="bg-white/90 text-[#3F3A33]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-[#8A9A5B]" />
                Your Balance
              </CardTitle>
              <CardDescription>
                How your feelings have leaned across all your check-ins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between text-xs text-[#6F685E]">
                <span>Based on {history.length} check-in{history.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-3 rounded-2xl bg-[#FBF7EE] p-4">
                <div className="flex items-center justify-between text-xs text-[#6F685E]">
                  <span>Lifetime distribution</span>
                  <span className="text-[0.7rem] italic">% of decisive days</span>
                </div>
                <div className="space-y-2">
                  <Bar label="Yes" value={stats.yesPercent} tone="yes" />
                  <Bar label="No" value={stats.noPercent} tone="no" />
                </div>
                <p className="text-[0.7rem] text-[#8C8275]">
                  Your real distribution — undecided days are not counted here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="bg-white/90 text-[#3F3A33]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8A9A5B]" />
                Daily nugget
              </CardTitle>
              <CardDescription>
                A rotating note on the challenge and joy of parenting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FBF7EE] px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[#6F685E] border border-[color:var(--sage-soft)]/80">
                {nugget.type === "joy" ? (
                  <>
                    <Heart className="h-3.5 w-3.5 text-[#C46A4A]" />
                    <span>Joy of parenting</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-3.5 w-3.5 text-[#8A9A5B]" />
                    <span>Reality check</span>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="heading-serif text-sm font-semibold text-[#3F3A33]">
                  {nugget.title}
                </p>
                <p className="text-[0.88rem] leading-relaxed text-[#6F685E]">
                  {nugget.body}
                </p>
              </div>
              <p className="text-[0.7rem] text-[#8C8275]">
                These reflections are prompts, not instructions. They&apos;re here
                to widen the picture as you sit with the question.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 text-[#3F3A33]">
            <CardHeader>
              <CardTitle>Ground rules of this space</CardTitle>
              <CardDescription>
                For people who are neither a firm yes nor a firm no.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#3F3A33]">
              <p>
                <span className="font-medium">No performance.</span> You don&apos;t
                need to be certain, consistent, or decided.
              </p>
              <p>
                <span className="font-medium">Context matters.</span> Hormones,
                money, work, relationships, and rest all color the answer.
              </p>
              <p>
                <span className="font-medium">Time is allowed.</span> This tool is
                meant to honor your process, not rush it.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}

type BarProps = { label: string; value: number; tone: "yes" | "no" | "undecided" };
function Bar({ label, value, tone }: BarProps) {
  const gradient =
    tone === "yes"
      ? "from-[#8A9A5B] via-[#E2E6D8] to-[#FDFBF7]"
      : tone === "no"
      ? "from-[#7DA3B5] via-[#D9E8EE] to-[#FDFBF7]"
      : "from-[#D7CFBF] via-[#F3EDE2] to-[#FFFFFF]";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-[#6F685E]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E6DFD2]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${Math.max(6, value)}%` }}
        />
      </div>
    </div>
  );
}
