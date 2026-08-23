import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Compass,
  FlaskConical,
  Globe2,
  History,
  Landmark,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const subjectCollections = [
  { eyebrow: "Pattern & proof", title: "Think in systems", copy: "Build confidence with structured reasoning, evidence, and discovery.", image: "/manus-storage/examora-subject-maths-science_93489760.png", subjects: [{ name: "Mathematics", icon: Brain }, { name: "Science", icon: FlaskConical }] },
  { eyebrow: "Ideas & context", title: "Read beyond the page", copy: "Develop clear expression and see how stories, sources, and society connect.", image: "/manus-storage/examora-subject-language-history_67200f55.png", subjects: [{ name: "English", icon: BookOpenCheck }, { name: "History", icon: Landmark }] },
  { eyebrow: "Build & lead", title: "Make practical moves", copy: "Explore the logic behind digital work, decisions, and opportunity.", image: "/manus-storage/examora-subject-code-business_14acbaa6.png", subjects: [{ name: "Programming", icon: Code2 }, { name: "Business", icon: BriefcaseBusiness }] },
];

const pathway = [
  ["01", "Browse with intent", "Choose a subject, difficulty, and time window that match your study goal"],
  ["02", "Focus in the exam room", "Use the timer, bookmarks, and progress cues to keep your attention on the work"],
  ["03", "Turn results into momentum", "Review explanations, download eligible documents, and choose your next step"],
];

const capabilityCards = [
  [Clock3, "Calm exam room", "A focused timed interface keeps attention on the assessment"],
  [History, "Progress retained", "Results, reviews, and eligible documents remain ready in history"],
  [Globe2, "Ready across devices", "Responsive layouts keep learning practical on desktop, tablet, and mobile"],
];

function SampleExamCard({ title, subject, difficulty, questions, duration }: { title: string; subject: string; difficulty: string; questions: number; duration: number }) {
  return (
    <Link href="/practice" className="interactive-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-3">
        <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Example practice</Badge>
        <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{subject} · {difficulty}</p>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{questions} questions · {duration} min</p>
      <span className="mt-5 inline-flex items-center text-sm font-bold text-slate-700 dark:text-slate-200">Open Practice Lab <ArrowRight className="ml-1 size-4" /></span>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">{eyebrow}</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SubjectCollectionCard({ collection }: { collection: typeof subjectCollections[number] }) {
  return <Link href="/exams" className="group relative isolate flex min-h-[390px] flex-col justify-end overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_22px_55px_-32px_rgba(15,23,42,0.7)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_72px_-30px_rgba(15,23,42,0.75)] sm:p-7 dark:border-white/10"><img src={collection.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,12,24,0.08)_10%,rgba(5,12,24,0.46)_47%,rgba(5,12,24,0.97)_100%)]" /><div className="absolute inset-x-5 top-5 flex items-center justify-between"><span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200 backdrop-blur">{collection.eyebrow}</span><span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10 text-emerald-200 backdrop-blur"><Sparkles className="size-4" /></span></div><div><div className="flex flex-wrap gap-2">{collection.subjects.map(({ name, icon: Icon }) => <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-bold text-white/90 backdrop-blur"><Icon className="size-3.5 text-emerald-200" />{name}</span>)}</div><h3 className="mt-5 font-display text-3xl font-semibold leading-[0.98] tracking-[-0.055em]">{collection.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">{collection.copy}</p><span className="mt-6 inline-flex items-center text-sm font-bold text-emerald-200">Explore subjects <ArrowRight className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-1" /></span></div></Link>;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: exams = [] } = trpc.exams.list.useQuery();
  const { data: leaderboard = [] } = trpc.attempts.leaderboard.useQuery({ subject: "", period: "all" });
  const featured = exams.slice(0, 3);
  const startMutation = trpc.attempts.start.useMutation({
    onSuccess: result => {
      const target = featured[0];
      if (target) setLocation(`/exams/${target.id}/attempt/${result.attemptId}`);
    },
  });
  const startFirst = () => {
    if (!user) return startLogin();
    if (featured[0]) return startMutation.mutate({ examId: featured[0].id });
    setLocation("/exams");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[hsl(var(--page))] text-slate-950 dark:text-slate-50">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="hero-grid" />
          <div className="container relative grid min-h-[455px] translate-y-5 items-center gap-7 py-5 sm:translate-y-7 sm:gap-10 sm:py-8 lg:min-h-[510px] lg:translate-y-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="relative z-10 -translate-y-7 -mb-7 max-w-xl sm:-translate-y-10 sm:-mb-10 lg:-translate-y-14 lg:-mb-14"
            >
              <motion.div variants={reveal}>
                <Badge className="rounded-full border-0 bg-emerald-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <Sparkles className="mr-1.5 size-3" />Assessment considered
                </Badge>
              </motion.div>
              <motion.h1 variants={reveal} className="mt-5 font-display text-[clamp(3rem,5vw,4.65rem)] font-semibold leading-[0.95] tracking-[-0.065em] text-slate-950 dark:text-white">
                Assess with <span className="text-emerald-600 dark:text-emerald-400">clarity</span><br />Grow with intent
              </motion.h1>
              <motion.p variants={reveal} className="mt-6 max-w-[34rem] text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Discover well-structured assessments, stay focused in a calm exam room, and turn every result into your next best step
              </motion.p>
              <motion.div variants={reveal} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={startFirst} disabled={startMutation.isPending} size="lg" className="rounded-xl bg-slate-950 px-6 font-semibold text-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.7)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                  {startMutation.isPending ? "Preparing assessment…" : user ? "Start an assessment" : "Begin your journey"}<ArrowRight className="ml-1.5 size-4" />
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-slate-200 bg-white/60 px-6 font-semibold text-slate-800 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <Link href="/exams"><Compass className="mr-1.5 size-4" />Explore catalogue</Link>
                </Button>
              </motion.div>
              <motion.div variants={reveal} className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {[[Clock3, "Timed assessment flow"], [History, "Personal result history"], [ShieldCheck, "Role-secured platform"]].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof Clock3;
                  return <span key={String(label)} className="inline-flex items-center gap-1.5"><FeatureIcon className="size-4 text-emerald-600" />{String(label)}</span>;
                })}
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.97, x: 16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.23, 1, 0.32, 1] }} className="relative mx-auto w-full max-w-2xl lg:translate-x-5">
              <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-900 shadow-[0_30px_100px_-25px_rgba(15,23,42,0.45)] dark:border-white/10">
                <img src="/manus-storage/examora-hero-illustration_a0ceefab.png" alt="Students completing a digital assessment" className="aspect-[16/10] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent px-5 pb-5 pt-24 text-white sm:px-7 sm:pb-7">
                  <div className="max-w-[78%]"><p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-300">Examora space</p></div>
                  <span className="hidden size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur sm:grid"><Play className="ml-0.5 size-4 fill-current" /></span>
                </div>
              </div>
              <div className="absolute left-4 top-4 hidden w-fit rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.45)] backdrop-blur md:block dark:border-white/10 dark:bg-slate-900/95">
                <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"><Clock3 className="size-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Focus mode</p><p className="text-[15px] font-bold text-slate-800 dark:text-white">Every minute matters</p></div></div>
              </div>
              <div aria-hidden="true" className="absolute bottom-5 right-20 hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3 py-2 text-[11px] font-bold tracking-wide text-white/90 backdrop-blur lg:flex"><span className="flex gap-1"><i className="size-1.5 rounded-full bg-emerald-300" /><i className="size-1.5 rounded-full bg-cyan-200" /><i className="size-1.5 rounded-full bg-violet-200" /></span>Ready when you are</div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white/80 py-6 backdrop-blur sm:py-7 dark:border-white/10 dark:bg-slate-900/50">
          <div className="container grid gap-4 text-center sm:grid-cols-3 sm:text-left">
            {[[BookOpenCheck, "Purposeful practice", "Curated, structured assessments"], [Trophy, "Meaningful feedback", "Clear outcome summaries"], [ShieldCheck, "Secure by role", "Student and admin access controls"]].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof BookOpenCheck;
              return <div key={String(title)} className="flex items-center justify-center gap-3 sm:justify-start"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><FeatureIcon className="size-5" /></span><div><p className="text-[15px] font-bold">{String(title)}</p><p className="text-[13px] text-slate-500 dark:text-slate-400">{String(copy)}</p></div></div>;
            })}
          </div>
        </section>

        <section className="container pb-10 pt-8 sm:pb-12 sm:pt-10">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} className="spark-grid relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)] sm:p-9">
              <div className="absolute -right-14 -top-12 size-48 rounded-full bg-emerald-400/20 blur-2xl" />
              <p className="relative text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-300">Your learning command center</p>
              <h2 className="relative mt-3 font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl xl:whitespace-nowrap">Build momentum before you begin</h2>
              <p className="relative mt-4 text-sm leading-6 text-slate-300 lg:max-w-none">Use focused study spaces, practice sprints, and a simple exam guide to shape an intentional assessment routine</p>
              <div className="relative mt-7 flex flex-wrap gap-3"><Button asChild className="rounded-xl bg-emerald-400 font-bold text-slate-950 hover:bg-emerald-300"><Link href="/practice">Launch Practice Lab <ArrowRight className="ml-1.5 size-4" /></Link></Button><Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/study-hub">Open Study Hub</Link></Button></div>
              <div className="relative mt-9 grid gap-3 sm:grid-cols-3">
                {[[Target, "Plan", "Pick a focus"], [Clock3, "Practice", "Work with pace"], [History, "Reflect", "Review the result"]].map(([Icon, title, copy], index) => {
                  const StepIcon = Icon as typeof Target;
                  return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur"><div className="flex items-center justify-between"><StepIcon className="size-4 text-emerald-300" /><span className="text-[10px] font-bold text-slate-500">0{index + 1}</span></div><p className="mt-4 text-sm font-bold">{String(title)}</p><p className="mt-1 text-xs text-slate-400">{String(copy)}</p></div>;
                })}
              </div>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Link href="/exam-guide" className="interactive-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><span className="absolute right-5 top-5 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="size-5" /></span><p className="mt-11 font-display text-xl font-semibold text-slate-950 dark:text-white">Exam-ready guide</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 xl:whitespace-nowrap">A practical checklist for before, during, and after your assessment</p><span className="mt-5 inline-flex items-center text-sm font-bold text-emerald-700 dark:text-emerald-300">Open guide <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" /></span></Link>
              <Link href="/profile" className="interactive-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><span className="absolute right-5 top-5 grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><History className="size-5" /></span><p className="mt-11 font-display text-xl font-semibold text-slate-950 dark:text-white">Review your growth</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 xl:whitespace-nowrap">Return to your private history, trend charts, reports, and achievements</p><span className="mt-5 inline-flex items-center text-sm font-bold text-violet-700 dark:text-violet-300">View profile <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" /></span></Link>
            </div>
          </div>
        </section>

        <section className="section-wash py-10 sm:py-12"><div className="container"><SectionHeading eyebrow="Your path" title="Three steps to a clearer result" /><div className="mt-7 grid gap-4 md:grid-cols-3">{pathway.map(([number, title, copy]) => <article key={number} className="interactive-card flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900"><span className="grid size-10 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white dark:bg-emerald-400 dark:text-slate-950">{number}</span><h3 className="mt-5 font-display text-xl font-semibold text-slate-950 dark:text-white">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">{copy}</p></article>)}</div></div></section>

        <section className="section-wash py-10 sm:py-12"><div className="container"><SectionHeading eyebrow="The catalogue" title="What will you be assessed on" action={<div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900/75 dark:text-emerald-200"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.13)]" />Six subject pathways</div>} /><p className="mt-3 text-base leading-7 text-slate-600 xl:max-w-none xl:whitespace-nowrap dark:text-slate-300">Choose a direction that matches how you want to think, create, and grow. Each path opens a curated catalogue of assessments.</p><div className="mt-7 grid gap-5 lg:grid-cols-3">{subjectCollections.map(collection => <SubjectCollectionCard key={collection.title} collection={collection} />)}</div><div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm sm:flex-row sm:items-center sm:p-6 dark:border-white/10 dark:bg-slate-900/85"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Compass className="size-5" /></span><div><p className="font-display text-lg font-semibold text-slate-950 dark:text-white">Find an assessment that fits today</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Browse live assessments by subject, difficulty, or time available.</p></div></div><Button asChild className="shrink-0 rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"><Link href="/exams">Explore live catalogue <ArrowRight className="ml-1.5 size-4" /></Link></Button></div></div></section>

        <section className="container py-10 sm:py-12"><div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 lg:grid lg:grid-cols-2"><div className="p-6 sm:p-9"><div className="flex flex-wrap gap-2"><Badge className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">Critical thinking</Badge><Badge variant="outline" className="rounded-full">Intermediate</Badge></div><h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">Critical Thinking: Foundations</h2><p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">See the calm, clear MCQ format learners encounter before they begin a timed assessment</p><div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-emerald-600" />25 min</span><span className="inline-flex items-center gap-1.5"><BookOpenCheck className="size-4 text-emerald-600" />20 questions</span></div><div className="mt-8 flex flex-wrap gap-3"><Button asChild variant="outline" className="rounded-xl"><Link href="/exams">Preview exam <ArrowRight className="ml-1.5 size-4" /></Link></Button><Button onClick={startFirst} className="rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">Start now <ArrowRight className="ml-1.5 size-4" /></Button></div></div><div className="relative bg-slate-50 p-6 dark:bg-slate-950/40 sm:p-9"><div className="absolute -right-12 top-0 size-40 rounded-full bg-emerald-400/15 blur-3xl" /><p className="relative text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">Question preview</p><p className="relative mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">Which response best evaluates an argument?</p><div className="relative mt-6 space-y-2">{["Accept its conclusion without evidence", "Consider evidence, assumptions, and alternatives", "Choose the longest answer", "Focus only on the speaker"].map((answer, index) => <div key={answer} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${index === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"}`}><span className="grid size-6 place-items-center rounded-full border text-xs font-bold">{String.fromCharCode(65 + index)}</span>{answer}</div>)}</div></div></div></section>

        <section className="container py-10 sm:py-12"><SectionHeading eyebrow="Leaderboard" title="See where you rank" action={<Button asChild variant="outline" className="w-fit rounded-xl"><Link href="/leaderboard">View full leaderboard <ArrowRight className="ml-1.5 size-4" /></Link></Button>} /><div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">{leaderboard.length ? leaderboard.slice(0, 5).map(entry => <div key={`${entry.rank}-${entry.name}`} className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 px-5 py-4 text-sm ${entry.rank === 1 ? "bg-emerald-50/80 dark:bg-emerald-400/[0.08]" : "odd:bg-slate-50/70 dark:odd:bg-white/[0.02]"}`}><span className={`grid size-8 place-items-center rounded-full font-bold ${entry.rank === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{entry.rank}</span><span className="truncate"><b className="text-slate-900 dark:text-white">{entry.name}</b><small className="ml-2 text-slate-500">{entry.subject}</small></span><span className="font-bold text-emerald-700 dark:text-emerald-300">{entry.percentage}%</span></div>) : <div className="grid min-h-28 place-items-center p-5 text-center"><div><UsersRound className="mx-auto size-5 text-emerald-600" /><p className="mt-2 font-semibold text-slate-800 dark:text-white">Live rankings will appear here</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Complete an assessment to contribute to the leaderboard</p></div></div>}</div></section>

        <section className="container py-12 sm:py-18"><SectionHeading eyebrow="Learning experience" title="Designed for focused progress" /><div className="mt-8 grid gap-4 md:grid-cols-3">{capabilityCards.map(([Icon, title, copy]) => { const CapabilityIcon = Icon as typeof Clock3; return <article key={String(title)} className="interactive-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><CapabilityIcon className="size-5 text-emerald-600 dark:text-emerald-300" /><h3 className="mt-5 font-display text-xl font-semibold text-slate-950 dark:text-white">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{String(copy)}</p></article>; })}</div></section>

        <section className="bg-[#0D1117] py-9 text-white"><div className="container grid gap-6 text-center sm:grid-cols-3 sm:divide-x sm:divide-white/15">{[["Timed", "assessment flow"], ["Instant", "outcome review"], ["Private", "learning history"]].map(([value, label]) => <div key={value} className="px-6"><p className="font-display text-4xl font-semibold text-emerald-400">{value}</p><p className="mt-2 text-sm text-slate-300">{label}</p></div>)}</div></section>

        <section className="container py-12 sm:py-18"><div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white shadow-[0_30px_80px_-38px_rgba(15,23,42,0.8)] sm:px-12 sm:py-12"><div className="absolute -right-16 -top-24 size-64 rounded-full bg-emerald-400/15 blur-3xl" /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-300">A better assessment rhythm</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.055em] sm:text-4xl lg:whitespace-nowrap lg:text-[2.65rem]">Know where you stand and choose your next step</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Answer with focus, receive an immediate result, and retain a private history of completed work</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-200"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Focused</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Measured</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Actionable</span></div></div><Button asChild className="h-11 shrink-0 rounded-xl bg-emerald-400 px-5 font-bold text-slate-950 hover:bg-emerald-300"><Link href="/exams">Find an assessment <ArrowRight className="ml-1.5 size-4" /></Link></Button></div></div></section>

        <section className="container py-12 sm:py-18"><SectionHeading eyebrow="Find your focus" title="Explore live assessments" action={<Button asChild variant="ghost" className="w-fit rounded-full text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-emerald-300"><Link href="/exams">View the catalogue <ArrowRight className="ml-1.5 size-4" /></Link></Button>} /><div className="mt-8 grid gap-4 md:grid-cols-3">{featured.length ? featured.map(exam => <Link key={exam.id} href="/exams" className="interactive-card group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><Badge className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{exam.subject}</Badge><ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" /></div><h3 className="mt-4 font-display text-lg font-semibold text-slate-950 dark:text-white">{exam.title}</h3><p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{exam.questionCount} questions · {exam.durationMinutes} min · {exam.difficulty}</p></Link>) : <><SampleExamCard title="Critical Thinking Sprint" subject="Critical thinking" difficulty="Intermediate" questions={8} duration={15} /><SampleExamCard title="Quantitative Reasoning" subject="Mathematics" difficulty="Foundation" questions={10} duration={20} /><SampleExamCard title="Communication Clarity" subject="Communication" difficulty="Introductory" questions={6} duration={10} /></>}</div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
