"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Star, Loader2, Sparkles, Flame, CalendarDays, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-[color:var(--sage-soft)] bg-[#FDFBF7] p-3 text-sm shadow-md min-w-[150px]">
        <p className="font-semibold text-[#3F3A33] mb-1">{label}</p>
        <p className="text-[#8A9A5B] font-medium text-[0.75rem] mb-2">
          Trend score: {data.Trend ?? "No data"}
        </p>
        
        {data.decision && (
          <div className="pt-2 border-t border-[color:var(--sage-soft)]/40 mt-1">
            <p className="text-[0.65rem] uppercase tracking-wider text-[#8C8275] mb-1.5">Logged on this day</p>
            <div className="flex items-center gap-2 mb-1.5">
              {data.decision === "yes" && <img src="/icon-yes.png" alt="Yes" className="h-3.5 w-3.5 object-contain" />}
              {data.decision === "no" && <img src="/icon-no.png" alt="No" className="h-3.5 w-3.5 object-contain" />}
              {data.decision === "undecided" && <span className="block h-2.5 w-2.5 rounded-full bg-[#9A9184]" />}
              <span className="capitalize text-[#3F3A33] font-medium text-xs">{data.decision}</span>
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {data.tags.map((t: string) => (
                  <span key={t} className="bg-[color:var(--sage-soft)]/20 text-[#6F685E] text-[10px] px-1.5 py-0.5 rounded-sm">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {data.notes && (
              <p className="text-[10px] text-[#8C8275] italic mt-1.5 line-clamp-3 leading-relaxed">
                "{data.notes}"
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error && data) setCheckIns(data);
      setIsLoading(false);
    };
    void fetchData();
  }, [router]);

  // --- Derived Insights ---

  // Overall balance (yes vs no only)
  const balance = useMemo(() => {
    const yes = checkIns.filter(c => c.decision === "yes").length;
    const no = checkIns.filter(c => c.decision === "no").length;
    const total = yes + no;
    return {
      yes, no, total,
      yesPercent: total > 0 ? Math.round((yes / total) * 100) : 0,
      noPercent: total > 0 ? Math.round((no / total) * 100) : 0,
    };
  }, [checkIns]);

  // Tag correlations
  const tagInsights = useMemo(() => {
    const yesDays = checkIns.filter(c => c.decision === "yes");
    const noDays = checkIns.filter(c => c.decision === "no");

    const countTags = (days: CheckIn[]) => {
      const counts: Record<string, number> = {};
      days.forEach(day => {
        (day.tags || []).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([tag, count]) => ({
          tag,
          count,
          percent: days.length > 0 ? Math.round((count / days.length) * 100) : 0,
        }));
    };

    return {
      yesTags: countTags(yesDays),
      noTags: countTags(noDays),
      hasTagData: checkIns.some(c => c.tags && c.tags.length > 0),
    };
  }, [checkIns]);

  // Trend: rolling 7-day desire score over last 30 days
  const trendData = useMemo(() => {
    if (checkIns.length < 3) return [];

    const data = [];
    const now = new Date();
    // Generate the last 30 days in order
    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
      const windowStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - 6, 0, 0, 0);

      // Find all check-ins in this 7-day window
      const windowCheckIns = checkIns.filter(c => {
        const d = new Date(c.created_at);
        return d >= windowStart && d <= targetDate;
      });

      if (windowCheckIns.length > 0) {
        let scoreSum = 0;
        windowCheckIns.forEach(c => {
          if (c.decision === "yes") scoreSum += 100;
          else if (c.decision === "undecided") scoreSum += 50;
          // no is 0, so adds nothing
        });
        const avg = Math.round(scoreSum / windowCheckIns.length);
        const exactDayCheckIn = windowCheckIns.find(c => isSameLocalDay(new Date(c.created_at), targetDate));
        data.push({
          date: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          Trend: avg,
          tags: exactDayCheckIn?.tags || [],
          decision: exactDayCheckIn?.decision,
          notes: exactDayCheckIn?.notes
        });
      } else {
        // If no check-ins in the last 7 days, return null so Recharts connects the gap smoothly
        const exactDayCheckIn = windowCheckIns.find(c => isSameLocalDay(new Date(c.created_at), targetDate));
        data.push({
          date: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          Trend: null,
          tags: exactDayCheckIn?.tags || [],
          decision: exactDayCheckIn?.decision,
          notes: exactDayCheckIn?.notes
        });
      }
    }
    return data;
  }, [checkIns]);

  // Consistency stats
  const consistency = useMemo(() => {
    const total = checkIns.length;
    if (total === 0) return { total: 0, streak: 0, bestMonth: "—" };

    // Current streak
    const sorted = [...checkIns].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    let streak = 0;
    let prev = new Date();
    prev.setHours(0, 0, 0, 0);
    for (const c of sorted) {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      const diff = (prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) { streak++; prev = d; }
      else break;
    }

    // Best month
    const monthCounts: Record<string, number> = {};
    checkIns.forEach(c => {
      const label = new Date(c.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      monthCounts[label] = (monthCounts[label] || 0) + 1;
    });
    const bestMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { total, streak, bestMonth };
  }, [checkIns]);

  const hasEnoughData = checkIns.length >= 3;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--sage)]" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 sm:pb-32 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sage-soft)] bg-white/70 px-3 py-1 text-xs font-medium text-[#6F685E] soft-shadow w-fit">
          <Sparkles className="h-3 w-3 text-[#8A9A5B]" />
          <span>Insights</span>
        </div>
        <h1 className="heading-serif text-2xl font-semibold tracking-tight text-[#3F3A33] sm:text-3xl">
          Your patterns.
        </h1>
        <p className="max-w-xl text-[0.85rem] leading-relaxed text-[#6F685E]">
          What your check-ins reveal about your feelings over time.
        </p>
      </header>

      {!hasEnoughData ? (
        <Card className="paper-surface mt-4 border-dashed text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3EDE2]">
              <Sparkles className="h-5 w-5 text-[#8A9A5B]" />
            </div>
            <p className="heading-serif font-medium text-[#3F3A33]">Not enough data yet</p>
            <p className="max-w-xs text-[0.8rem] text-[#6F685E]">
              Keep logging your daily check-ins. Insights will appear once you have more history to work with.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">

          {/* Section 1 — Overall Balance */}
          <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3F3A33]">
                <TrendingUp className="h-4 w-4 text-[#8A9A5B]" />
                Overall Balance
              </CardTitle>
              <CardDescription>Your lifetime Yes vs No, from {balance.total} decisive check-ins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Big visual tug-of-war bar */}
              <div className="relative h-10 w-full overflow-hidden rounded-full bg-[#EDE7DA]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[color:var(--sage)] to-[color:var(--sage-soft)] transition-all duration-700"
                  style={{ width: `${balance.yesPercent}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full rounded-full bg-gradient-to-l from-[#7DA3B5] to-[#D9E8EE] transition-all duration-700"
                  style={{ width: `${balance.noPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#6F685E]">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-[#8A9A5B] fill-current" />
                  <span className="font-medium text-[#3F3A33]">{balance.yesPercent}%</span>
                  <span>Yes ({balance.yes} days)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{balance.noPercent}%</span>
                  <span>No ({balance.no} days)</span>
                  <Star className="h-3 w-3 text-[#7DA3B5] fill-current" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 & 3 — Tag Correlations */}
          {!tagInsights.hasTagData ? (
            <Card className="bg-white/80 border border-dashed border-[color:var(--sage-soft)]">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3EDE2]">
                  <Sparkles className="h-4 w-4 text-[#8A9A5B]" />
                </div>
                <p className="heading-serif font-medium text-[#3F3A33]">No tag data yet</p>
                <p className="max-w-xs text-[0.78rem] text-[#6F685E] leading-relaxed">
                  Start selecting context tags when you check in — like &quot;Career focus&quot; or &quot;Hormonal / cycle&quot; — and this section will show you what tends to shape your feelings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Yes tags */}
              <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-[#3F3A33]">
                    <Heart className="h-3.5 w-3.5 text-[#8A9A5B] fill-current" />
                    What drives your Yes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tagInsights.yesTags.length === 0 ? (
                    <p className="text-[0.75rem] text-[#8C8275] italic">No tags on your Yes days yet.</p>
                  ) : tagInsights.yesTags.map(({ tag, percent }) => (
                    <div key={tag} className="space-y-1">
                      <div className="flex justify-between text-[0.75rem] text-[#3F3A33]">
                        <span>{tag}</span>
                        <span className="text-[#8C8275]">{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6DFD2]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[color:var(--sage)] to-[color:var(--sage-soft)] transition-all duration-500"
                          style={{ width: `${Math.max(6, percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* No tags */}
              <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-[#3F3A33]">
                    <Star className="h-3.5 w-3.5 text-[#7DA3B5] fill-current" />
                    What drives your No
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tagInsights.noTags.length === 0 ? (
                    <p className="text-[0.75rem] text-[#8C8275] italic">No tags on your No days yet.</p>
                  ) : tagInsights.noTags.map(({ tag, percent }) => (
                    <div key={tag} className="space-y-1">
                      <div className="flex justify-between text-[0.75rem] text-[#3F3A33]">
                        <span>{tag}</span>
                        <span className="text-[#8C8275]">{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6DFD2]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7DA3B5] to-[#D9E8EE] transition-all duration-500"
                          style={{ width: `${Math.max(6, percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Section 4 — Trend chart */}
          {trendData.length >= 3 && (
            <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3F3A33]">
                  <TrendingUp className="h-4 w-4 text-[#8A9A5B]" />
                  Your Trend
                </CardTitle>
                <CardDescription>A 7-day rolling average of your feelings over the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD2" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9A9184" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 50, 100]}
                      tick={{ fontSize: 10, fill: "#9A9184" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v === 100 ? "Yes" : v === 50 ? "Unsure" : v === 0 ? "No" : ""}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#8A9A5B", strokeWidth: 1, strokeDasharray: "4 2" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Trend"
                      stroke="#8A9A5B"
                      strokeWidth={2}
                      dot={{ fill: "#8A9A5B", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#8A9A5B" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Section 5 — Consistency */}
          <Card className="bg-white/80 border border-[color:var(--sage-soft)]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3F3A33]">
                <Flame className="h-4 w-4 text-[#8A9A5B]" />
                Consistency
              </CardTitle>
              <CardDescription>How regularly you&apos;ve been showing up for yourself.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#FBF7EE] p-4 text-center">
                  <CalendarDays className="h-5 w-5 text-[#8A9A5B]" />
                  <p className="heading-serif text-2xl font-semibold text-[#3F3A33]">{consistency.total}</p>
                  <p className="text-[0.65rem] text-[#8C8275] uppercase tracking-wider">Total days</p>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#FBF7EE] p-4 text-center">
                  <Flame className="h-5 w-5 text-[#C46A4A]" />
                  <p className="heading-serif text-2xl font-semibold text-[#3F3A33]">{consistency.streak}</p>
                  <p className="text-[0.65rem] text-[#8C8275] uppercase tracking-wider">Day streak</p>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#FBF7EE] p-4 text-center">
                  <Sparkles className="h-5 w-5 text-[#8A9A5B]" />
                  <p className="heading-serif text-sm font-semibold text-[#3F3A33] leading-tight mt-1">{consistency.bestMonth}</p>
                  <p className="text-[0.65rem] text-[#8C8275] uppercase tracking-wider">Best month</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </main>
  );
}
