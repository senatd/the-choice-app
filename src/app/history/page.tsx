"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { 
  CalendarClock, 
  Loader2, 
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

type CheckIn = {
  id: string;
  created_at: string;
  decision: "yes" | "no" | "undecided";
  tags: string[];
  notes?: string | null;
};

function isSameLocalDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<"calendar" | "journal">("calendar");
  const router = useRouter();

  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      setUser(user);

      const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCheckIns(data);
      }
      setIsLoading(false);
    };

    void fetchHistory();
  }, [router]);

  const handleDayClick = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn);
    setIsDialogOpen(true);
  };

  // Generate 52 weeks of dates for the heatmap
  const heatmapWeeks = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    const daysToEndOfWeek = 6 - dayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysToEndOfWeek);
    
    // We want 52 weeks (364 days)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 363);

    const weeks = [];
    let current = new Date(startDate);
    for (let i = 0; i < 52; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, []);

  const journalEntries = useMemo(() => checkIns.filter(c => c.notes && c.notes.trim().length > 0), [checkIns]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--sage)]" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 sm:pb-32 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="flex bg-[#F0EBE0] p-1 rounded-full w-fit">
          <button 
            onClick={() => setViewType("calendar")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewType === "calendar" ? "bg-white shadow-sm text-[#3F3A33]" : "text-[#8C8275] hover:text-[#3F3A33]"}`}
          >
            <CalendarClock className="h-3.5 w-3.5" /> Calendar
          </button>
          <button 
            onClick={() => setViewType("journal")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewType === "journal" ? "bg-white shadow-sm text-[#3F3A33]" : "text-[#8C8275] hover:text-[#3F3A33]"}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Journal
          </button>
        </div>
        <h1 className="heading-serif text-2xl font-semibold tracking-tight text-[#3F3A33] sm:text-3xl mt-2">
          {viewType === "calendar" ? "Looking back." : "Your journal."}
        </h1>
        <p className="max-w-xl text-[0.85rem] leading-relaxed text-[#6F685E]">
          {viewType === "calendar" ? "A visual record of where your mind and body have been." : "Reflections and notes on your journey."}
        </p>
      </header>

      {checkIns.length === 0 ? (
        <Card className="paper-surface mt-8 text-center border-dashed">
          <CardContent className="pt-10 pb-10 space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-[#F3EDE2] flex items-center justify-center mb-2">
              <CalendarClock className="h-5 w-5 text-[#8A9A5B]" />
            </div>
            <div className="space-y-1">
              <h3 className="heading-serif font-medium text-[#3F3A33]">No history yet</h3>
              <p className="text-[0.8rem] text-[#6F685E] max-w-sm">
                Your daily check-ins will appear here over time, building a clearer picture of your patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewType === "calendar" ? (
        <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="heading-serif text-lg font-semibold text-[#3F3A33]">
              The Last Year
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[color:var(--sage-soft)] scrollbar-track-transparent flex flex-col">
              <div className="flex gap-1.5 min-w-max">
                {heatmapWeeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    {week.map((date, j) => {
                      const checkIn = checkIns.find(c => isSameLocalDay(new Date(c.created_at), date));
                      const isFuture = date > new Date();
                      
                      let bg = "bg-[#F0EBE0]/60";
                      let border = "";
                      if (checkIn) {
                        if (checkIn.decision === "yes") bg = "bg-[#8A9A5B]";
                        else if (checkIn.decision === "no") bg = "bg-[#7DA3B5]";
                        else bg = "bg-[#9A9184]";
                      } else if (!isFuture && date <= new Date()) {
                        border = "border border-[#E6DFD2]";
                        bg = "bg-transparent";
                      } else if (isFuture) {
                        bg = "bg-transparent opacity-30";
                      }

                      return (
                        <div 
                          key={j} 
                          onClick={() => checkIn && handleDayClick(checkIn)}
                          title={date.toDateString()}
                          className={`w-[14px] h-[14px] rounded-[3px] transition-transform ${bg} ${border} ${checkIn ? "cursor-pointer hover:scale-110 shadow-sm" : "cursor-default"}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-[0.65rem] text-[#8C8275] border-t border-[color:var(--sage-soft)]/30 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="block h-[10px] w-[10px] rounded-[2px] bg-[#8A9A5B]" /> Leaning Yes
              </div>
              <div className="flex items-center gap-1.5">
                <span className="block h-[10px] w-[10px] rounded-[2px] bg-[#7DA3B5]" /> Leaning No
              </div>
              <div className="flex items-center gap-1.5">
                <span className="block h-[10px] w-[10px] rounded-[2px] bg-[#9A9184]" /> Undecided
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journalEntries.length === 0 ? (
            <p className="text-sm text-[#8C8275] italic text-center py-10">No journal entries yet. Add notes to your check-ins to see them here.</p>
          ) : (
            journalEntries.map(entry => (
              <Card key={entry.id} className="bg-white/80 border border-[color:var(--sage-soft)]/50 transition-all hover:bg-white cursor-pointer" onClick={() => handleDayClick(entry)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#8C8275] uppercase tracking-widest">
                      {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      {entry.decision === "yes" && <img src="/icon-yes.png" alt="Yes" className="h-4 w-4 object-contain" />}
                      {entry.decision === "no" && <img src="/icon-no.png" alt="No" className="h-4 w-4 object-contain" />}
                      {entry.decision === "undecided" && <span className="block h-2.5 w-2.5 rounded-full bg-[#9A9184]" />}
                    </div>
                  </div>
                  <p className="text-[#3F3A33] text-[0.9rem] leading-relaxed italic border-l-2 border-[color:var(--sage-soft)] pl-3">
                    &quot;{entry.notes}&quot;
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {entry.tags.map(tag => (
                        <span key={tag} className="bg-[#F0EBE0] text-[#6F685E] text-[10px] px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="heading-serif text-xl font-normal text-[#3F3A33]">
              {selectedCheckIn && new Date(selectedCheckIn.created_at).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your reflection from this day.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCheckIn && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-center">
                {selectedCheckIn.decision === "yes" && (
                  <div className="flex flex-col items-center gap-2 text-emerald-900">
                    <img src="/icon-yes.png" alt="Yes" className="h-14 w-14 object-contain drop-shadow-sm" />
                    <span className="heading-serif font-medium">Leaning Yes</span>
                  </div>
                )}
                {selectedCheckIn.decision === "no" && (
                  <div className="flex flex-col items-center gap-2 text-[#6F685E]">
                    <img src="/icon-no.png" alt="No" className="h-14 w-14 object-contain drop-shadow-sm" />
                    <span className="heading-serif font-medium">Leaning No</span>
                  </div>
                )}
                {selectedCheckIn.decision === "undecided" && (
                  <div className="flex flex-col items-center gap-2 text-[#5C554B]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6DFD2]/60">
                      <span className="block h-3 w-3 rounded-full bg-[#9A9184]" />
                    </div>
                    <span className="heading-serif font-medium">Undecided</span>
                  </div>
                )}
              </div>

              {selectedCheckIn.tags && selectedCheckIn.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[#8C8275]">
                    Context Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCheckIn.tags.map(tag => (
                      <Badge key={tag} variant="muted">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCheckIn.notes && (
                <div className="space-y-2">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[#8C8275]">
                    Notes
                  </p>
                  <div className="rounded-2xl bg-[#FBF7EE] p-4 text-[0.85rem] text-[#3F3A33] leading-relaxed italic border border-[#E6DFD2]">
                    &quot;{selectedCheckIn.notes}&quot;
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
