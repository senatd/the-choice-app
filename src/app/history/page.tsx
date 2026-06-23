"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { 
  Heart, 
  Star,
  CalendarClock, 
  Loader2, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

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

  const handleGenerateMockData = async () => {
    if (!user) return;
    setIsGenerating(true);

    const mockData = [];
    const decisions = ["yes", "no", "undecided"] as const;
    const possibleTags = [
      "Saw a cute baby",
      "Career focus",
      "Financial anxiety",
      "Partner dynamics",
      "Hormonal / cycle",
      "Energy levels",
      "Family pressure",
      "Future freedom",
    ];
    const possibleNotes = [
      "Felt really overwhelmed with work today, can't imagine adding a baby to this mix.",
      "Saw my friend's toddler and my heart melted.",
      "Just feeling neutral. Mostly focused on myself right now.",
      "Had a deep talk with my partner. We are on the same page.",
      "Slept terribly. Energy is too low to even think about it.",
    ];

    // Generate 14 days of past data
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomDecision = decisions[Math.floor(Math.random() * decisions.length)];
      
      const numTags = Math.floor(Math.random() * 3) + 1;
      const shuffledTags = [...possibleTags].sort(() => 0.5 - Math.random());
      const selectedTags = shuffledTags.slice(0, numTags);
      
      // Add a note 50% of the time
      const randomNote = Math.random() > 0.5 
        ? possibleNotes[Math.floor(Math.random() * possibleNotes.length)] 
        : null;

      mockData.push({
        user_id: user.id,
        decision: randomDecision,
        tags: selectedTags,
        notes: randomNote,
        created_at: date.toISOString(),
      });
    }

    const { error } = await supabase.from("daily_checkins").insert(mockData);

    if (!error) {
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) {
        setCheckIns(data);
      }
    } else {
      console.error("Failed to generate mock data", error);
    }
    
    setIsGenerating(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleDayClick = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn);
    setIsDialogOpen(true);
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

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
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sage-soft)] bg-white/70 px-3 py-1 text-xs font-medium text-[#6F685E] soft-shadow w-fit">
          <CalendarClock className="h-3 w-3 text-[#8A9A5B]" />
          <span>Your Calendar</span>
        </div>
        <h1 className="heading-serif text-2xl font-semibold tracking-tight text-[#3F3A33] sm:text-3xl">
          Looking back.
        </h1>
        <p className="max-w-xl text-[0.85rem] leading-relaxed text-[#6F685E]">
          A record of where your mind and body have been.
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
                Your daily check-ins will appear on the calendar over time, building a clearer picture of your patterns.
              </p>
            </div>
            
        </CardContent>
      </Card>
      ) : (
        <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between">
              <h2 className="heading-serif text-lg font-semibold text-[#3F3A33]">
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4 text-[#6F685E]" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4 text-[#6F685E]" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[0.7rem] font-medium text-[#9A9184] uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 gap-y-3">
              {paddingDays.map(i => (
                <div key={`padding-${i}`} className="h-10 sm:h-12" />
              ))}
              {days.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // Find check-in for this exact day (local date comparison is tricky with UTC, 
                // so we check if the string starts with the date or parse carefully).
                // Simplest approach: just check if created_at string starts with dateStr.
                // Assuming created_at is ISO string UTC, it might be off by a day depending on timezone.
                // For a more robust comparison, we parse both to local dates.
                const checkIn = checkIns.find(c => {
                  const checkInDate = new Date(c.created_at);
                  return checkInDate.getFullYear() === year &&
                         checkInDate.getMonth() === month &&
                         checkInDate.getDate() === day;
                });

                return (
                  <button
                    key={day}
                    onClick={() => checkIn && handleDayClick(checkIn)}
                    disabled={!checkIn}
                    className={`flex flex-col items-center justify-start h-10 sm:h-12 rounded-xl transition-all relative ${
                      checkIn 
                        ? "cursor-pointer hover:bg-[color:var(--sage-soft)]/20 active:scale-95" 
                        : "opacity-50 cursor-default"
                    }`}
                  >
                    <span className="text-[0.8rem] text-[#3F3A33] mb-1">{day}</span>
                    {checkIn && (
                      <div className="absolute bottom-1">
                        {checkIn.decision === "yes" && <img src="/icon-yes.png" alt="Yes" className="h-4 w-4 object-contain" />}
                        {checkIn.decision === "no" && <img src="/icon-no.png" alt="No" className="h-4 w-4 object-contain" />}
                        {checkIn.decision === "undecided" && <span className="block h-2 w-2 rounded-full bg-[#9A9184] mb-1" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-[0.65rem] text-[#8C8275] border-t border-[color:var(--sage-soft)]/30 pt-4">
              <div className="flex items-center gap-1.5">
                <img src="/icon-yes.png" alt="Yes" className="h-3.5 w-3.5 object-contain" /> Leaning Yes
              </div>
              <div className="flex items-center gap-1.5">
                <img src="/icon-no.png" alt="No" className="h-3.5 w-3.5 object-contain" /> Leaning No
              </div>
              <div className="flex items-center gap-1.5">
                <span className="block h-1.5 w-1.5 rounded-full bg-[#9A9184]" /> Undecided
              </div>
            </div>
          </CardContent>
        </Card>
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
