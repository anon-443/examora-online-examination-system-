import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock3, FileQuestion, Search, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const difficultyClasses = { Beginner: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", Intermediate: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", Advanced: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300" };

export default function ExamCatalog() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: exams = [], isLoading } = trpc.exams.list.useQuery();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const startMutation = trpc.attempts.start.useMutation({
    onSuccess: ({ attemptId }) => setLocation(`/exams/active/attempt/${attemptId}`),
  });
  const subjects = useMemo(() => ["All", ...Array.from(new Set(exams.map(exam => exam.subject)))], [exams]);
  const filtered = exams.filter(exam => (subject === "All" || exam.subject === subject) && `${exam.title} ${exam.subject}`.toLowerCase().includes(search.toLowerCase()));
  const startExam = (examId: number) => user ? startMutation.mutate({ examId }) : startLogin();

  return <div className="min-h-screen bg-[hsl(var(--page))]"><SiteHeader /><main>
    <section className="container pb-4 pt-3 sm:pb-5 sm:pt-4"><div className="flex flex-col justify-between gap-2 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Assessment catalogue</p><h1 className="mt-1 font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl dark:text-white">Choose your next <span className="text-emerald-600 dark:text-emerald-400">challenge</span></h1></div><Button asChild variant="outline" className="w-fit rounded-xl border-slate-200 bg-white font-semibold dark:border-white/15 dark:bg-white/5"><Link href="/leaderboard"><Trophy className="mr-1.5 size-4 text-amber-500" />Leaderboard</Link></Button></div>
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center dark:border-white/10 dark:bg-slate-900"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-12 border-0 bg-slate-50 pl-9 shadow-none focus-visible:ring-emerald-500 dark:bg-white/5" placeholder="Search by assessment or subject" /></div><div className="flex gap-2 overflow-x-auto pb-0.5 md:max-w-[55%]">{subjects.map(item => <button key={item} onClick={() => setSubject(item)} className={`min-h-10 shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${subject === item ? "bg-slate-950 text-white dark:bg-emerald-400 dark:text-slate-950" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"}`}>{item}</button>)}</div></div>
    </section>
    <section className="container pb-10 sm:pb-12"><AnimatePresence mode="wait">{isLoading ? <div className="grid gap-5 md:grid-cols-2">{[1,2,3].map(item => <div key={item} className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />)}</div> : filtered.length ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 md:grid-cols-2">{filtered.map((exam, index) => <motion.article key={exam.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="interactive-card group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_38px_-30px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><Badge variant="secondary" className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{exam.subject}</Badge><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${difficultyClasses[exam.difficulty as keyof typeof difficultyClasses]}`}>{exam.difficulty}</span></div><h2 className="mt-4 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.045em] text-slate-950 dark:text-white">{exam.title}</h2><p className="mt-2 flex-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{exam.description}</p><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-emerald-600" />{exam.durationMinutes} minutes</span><span className="inline-flex items-center gap-1.5"><FileQuestion className="size-3.5 text-emerald-600" />{exam.questionCount} questions</span></div><Button onClick={() => startExam(exam.id)} disabled={startMutation.isPending || exam.questionCount === 0} className="mt-4 min-h-10 w-full rounded-xl bg-slate-950 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">{exam.questionCount === 0 ? "Questions unavailable" : startMutation.isPending ? "Preparing…" : "Start assessment"}<ArrowRight className="ml-1.5 size-4" /></Button></motion.article>)}</motion.div> : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-white/15 dark:bg-white/[0.03]"><div className="max-w-sm px-6"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Sparkles className="size-5" /></span><h2 className="mt-4 font-display text-xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">No assessment matches that search</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Try another subject or return when an administrator publishes new content</p></div></motion.div>}</AnimatePresence></section>
  </main><SiteFooter /></div>;
}
