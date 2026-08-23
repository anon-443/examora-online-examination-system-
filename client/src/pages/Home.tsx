import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, Clock3, Compass, Play, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } };

function ExamPreview({ exam }: { exam: { id: number; title: string; subject: string; durationMinutes: number; difficulty: string; questionCount: number } }) {
  return (
    <Link href="/exams" className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_22px_38px_-24px_rgba(16,185,129,0.35)] dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-400/30">
      <div className="flex items-center justify-between gap-3"><Badge variant="secondary" className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{exam.subject}</Badge><ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" /></div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">{exam.title}</h3>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400"><span>{exam.questionCount} questions</span><span>{exam.durationMinutes} min</span><span>{exam.difficulty}</span></div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: exams = [] } = trpc.exams.list.useQuery();
  const startMutation = trpc.attempts.start.useMutation({ onSuccess: result => setLocation(`/exams/active/attempt/${result.attemptId}`) });
  const featured = exams.slice(0, 3);

  const startFirst = () => {
    if (!user) return startLogin();
    if (featured[0]) startMutation.mutate({ examId: featured[0].id });
    else setLocation("/exams");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[hsl(var(--page))] text-slate-950 dark:text-slate-50">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
          <div className="container relative grid min-h-[610px] items-center gap-12 py-16 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:py-24">
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.09 } } }} className="relative z-10 max-w-xl">
              <motion.div variants={fadeUp}><Badge className="rounded-full border-0 bg-emerald-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800 shadow-none dark:bg-emerald-400/15 dark:text-emerald-300"><Sparkles className="mr-1.5 size-3" />Assessment, considered</Badge></motion.div>
              <motion.h1 variants={fadeUp} className="mt-6 font-display text-[clamp(3rem,6.1vw,5.85rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-slate-950 dark:text-white">Assess with <span className="text-emerald-600 dark:text-emerald-400">clarity.</span><br />Grow with intent.</motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">Discover well-structured assessments, stay focused in a calm exam room, and turn each result into your next best step.</motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={startFirst} disabled={startMutation.isPending} size="lg" className="rounded-xl bg-slate-950 px-6 font-semibold text-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.7)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">{startMutation.isPending ? "Preparing assessment…" : user ? "Start an assessment" : "Begin your journey"}<ArrowRight className="ml-1.5 size-4" /></Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-slate-200 bg-white/50 px-6 font-semibold text-slate-800 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"><Link href="/exams"><Compass className="mr-1.5 size-4" />Explore catalogue</Link></Button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Timed assessment flow</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Personal result history</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" />Role-secured platform</span></motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96, x: 16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.23, 1, 0.32, 1] }} className="relative mx-auto w-full max-w-2xl lg:translate-x-8">
              <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-900 shadow-[0_30px_100px_-25px_rgba(15,23,42,0.45)] dark:border-white/10">
                <img src="/manus-storage/examora-hero-illustration_a0ceefab.png" alt="Students completing a digital assessment" className="aspect-[16/10] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent px-5 pb-5 pt-16 text-white sm:px-7 sm:pb-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Examora space</p><p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">A quiet place to show what you know.</p></div><span className="hidden size-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur sm:grid"><Play className="ml-0.5 size-4 fill-current" /></span></div>
              </div>
              <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur md:block dark:border-white/10 dark:bg-slate-900/95"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"><Clock3 className="size-4" /></span><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Focus mode</p><p className="text-sm font-bold text-slate-800 dark:text-white">Every minute matters</p></div></div></div>
            </motion.div>
          </div>
        </section>
        <section className="border-y border-slate-200 bg-white py-6 dark:border-white/10 dark:bg-slate-900/50"><div className="container grid gap-4 text-center sm:grid-cols-3 sm:text-left"><div className="flex items-center justify-center gap-3 sm:justify-start"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><BookOpenCheck className="size-[18px]" /></span><div><p className="text-sm font-bold">Purposeful practice</p><p className="text-xs text-slate-500 dark:text-slate-400">Curated, structured assessments</p></div></div><div className="flex items-center justify-center gap-3 sm:justify-start"><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Award className="size-[18px]" /></span><div><p className="text-sm font-bold">Meaningful feedback</p><p className="text-xs text-slate-500 dark:text-slate-400">Clear outcome summaries</p></div></div><div className="flex items-center justify-center gap-3 sm:justify-start"><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"><ShieldCheck className="size-[18px]" /></span><div><p className="text-sm font-bold">Secure by role</p><p className="text-xs text-slate-500 dark:text-slate-400">Student and admin access controls</p></div></div></div></section>
        <section className="container py-20 sm:py-28"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Find your focus</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl dark:text-white">Explore live assessments.</h2></div><Button asChild variant="ghost" className="w-fit rounded-full text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-emerald-300"><Link href="/exams">View the catalogue <ArrowRight className="ml-1.5 size-4" /></Link></Button></div>
          <AnimatePresence mode="wait"><motion.div key={featured.length} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-9 grid gap-4 md:grid-cols-3">{featured.length ? featured.map(exam => <ExamPreview key={exam.id} exam={exam} />) : <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-white/15 dark:bg-white/[0.03]"><p className="font-display text-lg font-semibold text-slate-800 dark:text-white">The assessment catalogue is being prepared.</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Published assessments will appear here for students to explore and complete.</p></div>}</motion.div></AnimatePresence>
        </section>
        <section className="container pb-20 sm:pb-28"><div className="overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white shadow-[0_30px_80px_-38px_rgba(15,23,42,0.8)] sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">A better assessment rhythm</p><h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Know exactly where you stand—and where you can go next.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Answer with focus, receive an immediate result, and retain a private history of the work you have completed.</p></div><Button asChild size="lg" className="mt-7 rounded-xl bg-emerald-400 px-6 font-bold text-slate-950 hover:bg-emerald-300 lg:mt-0"><Link href="/exams">Find an assessment <ArrowRight className="ml-1.5 size-4" /></Link></Button></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
