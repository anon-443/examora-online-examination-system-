import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  Brain,
  CheckCircle2,
  Clock3,
  Compass,
  Focus,
  Gauge,
  Lightbulb,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const focusAreas = ["Critical thinking", "Quantitative reasoning", "Communication"] as const;

const studyDetails: Record<(typeof focusAreas)[number], { title: string; description: string; steps: string[] }> = {
  "Critical thinking": {
    title: "Make reasoning visible.",
    description: "Break a prompt into claims, evidence, assumptions, and alternatives before selecting an answer.",
    steps: ["Read the question stem twice", "Name the evidence being used", "Rule out answers that only restate the prompt"],
  },
  "Quantitative reasoning": {
    title: "Trade speed for certainty.",
    description: "Use a short setup routine to identify the unit, estimate the range, and only then calculate.",
    steps: ["Underline units and constraints", "Estimate before calculating", "Check whether the final magnitude is plausible"],
  },
  Communication: {
    title: "Read for intent.",
    description: "Identify audience, tone, and the required outcome before comparing each choice to the original task.",
    steps: ["State the audience in a few words", "Separate fact from tone", "Choose the clearest outcome-focused response"],
  },
};

const sampleQuiz = [
  {
    prompt: "Which action gives you the strongest basis for evaluating an argument?",
    options: ["Accept the conclusion immediately", "Compare its evidence, assumptions, and alternatives", "Choose the longest explanation", "Focus only on the speaker"],
    answer: 1,
    explanation: "A sound evaluation checks evidence, hidden assumptions, and plausible alternatives.",
  },
  {
    prompt: "A study goal is most useful when it is…",
    options: ["As broad as possible", "Linked to one skill and one session", "Changed every few minutes", "Only compared with other learners"],
    answer: 1,
    explanation: "A focused goal makes it easier to review the result and choose a specific next step.",
  },
  {
    prompt: "What is the best response when a timed question feels uncertain?",
    options: ["Leave the assessment", "Spend all remaining time on it", "Flag it, continue, and return during review", "Submit immediately"],
    answer: 2,
    explanation: "Bookmarking uncertainty protects pace and creates a deliberate review point.",
  },
];

export function StudyHub() {
  const [active, setActive] = useState<(typeof focusAreas)[number]>(focusAreas[0]);
  const detail = studyDetails[active];

  return (
    <div className="min-h-screen bg-[hsl(var(--page))]">
      <SiteHeader />
      <main className="container py-12 sm:py-18">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white sm:px-10 sm:py-14">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <Badge className="relative border-0 bg-emerald-400/15 text-emerald-200"><Sparkles className="mr-1.5 size-3" />Study hub</Badge>
          <h1 className="relative mt-5 max-w-2xl font-display text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">A more deliberate way to prepare.</h1>
          <p className="relative mt-5 max-w-xl text-base leading-7 text-slate-300">Choose a focus, make a short plan, and move into a timed practice experience when you are ready.</p>
          <Button asChild className="relative mt-8 rounded-xl bg-emerald-400 font-bold text-slate-950 hover:bg-emerald-300"><Link href="/practice">Start a practice sprint <ArrowRight className="ml-1.5 size-4" /></Link></Button>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">Choose a focus</p>
            <div className="mt-4 grid gap-2">
              {focusAreas.map((area) => (
                <button key={area} onClick={() => setActive(area)} className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${active === area ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"}`}>
                  {area}<ArrowRight className="size-4" />
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]"><Gauge className="size-5 text-emerald-600" /><p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Stay specific.</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">One intent per session creates a clearer review later.</p></div>
          </aside>
          <AnimatePresence mode="wait">
            <motion.article key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-slate-900">
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Brain className="size-5" /></span>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">{active}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">{detail.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{detail.description}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">{detail.steps.map((step, index) => <div key={step} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">0{index + 1}</span><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{step}</p></div>)}</div>
              <Button asChild className="mt-7 rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"><Link href="/exams">Find a matching assessment <ArrowRight className="ml-1.5 size-4" /></Link></Button>
            </motion.article>
          </AnimatePresence>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[[Target, "Set an intent", "Choose the one skill you want to strengthen before opening an assessment."], [Clock3, "Protect your time", "Use a focused sprint rather than an undefined study session."], [BookMarked, "Close the loop", "Review explanations and use your outcome to shape the next session."]].map(([Icon, title, copy]) => { const CardIcon = Icon as typeof Target; return <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><CardIcon className="size-5 text-emerald-600 dark:text-emerald-300" /><h3 className="mt-5 font-display text-xl font-semibold text-slate-950 dark:text-white">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy as string}</p></article>; })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PracticeLab() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [minutes, setMinutes] = useState(20);
  const [mode, setMode] = useState<"Focus" | "Review">("Focus");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const current = sampleQuiz[activeQuestion];
  const score = sampleQuiz.filter((question, index) => answers[index] === question.answer).length;
  const allAnswered = Object.keys(answers).length === sampleQuiz.length;
  const restart = () => { setActiveQuestion(0); setAnswers({}); setSubmitted(false); };
  const { data: assessments = [] } = trpc.exams.list.useQuery();
  const startPersistedAssessment = trpc.attempts.start.useMutation({ onError: error => toast.error(error.message) });
  const launchPersistedPractice = () => {
    if (!user) return startLogin();
    const target = assessments.find(exam => exam.questionCount > 0);
    if (!target) return toast.message("Add starter assessments from the instructor workspace to launch a saved practice attempt.");
    startPersistedAssessment.mutate({ examId: target.id }, { onSuccess: result => setLocation(`/exams/${target.id}/attempt/${result.attemptId}`) });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--page))]">
      <SiteHeader />
      <main className="container py-12 sm:py-18">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <Badge className="border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"><PlayCircle className="mr-1.5 size-3" />Practice lab</Badge>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl dark:text-white">Practice with a plan, not just a timer.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">Launch saved practice to create a timed, result-backed assessment attempt. The short quiz below is an unsaved warm-up preview.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button disabled={startPersistedAssessment.isPending} onClick={launchPersistedPractice} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">{startPersistedAssessment.isPending ? "Preparing practice…" : user ? "Launch saved practice" : "Sign in to save practice"}<ArrowRight className="ml-1.5 size-4" /></Button><Button asChild variant="outline" className="rounded-xl"><Link href="/exams">Browse available exams</Link></Button><Button asChild variant="ghost" className="rounded-xl"><Link href="/study-hub">Need a study cue?</Link></Button></div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] sm:p-9 dark:border-white/10 dark:bg-slate-900">
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-emerald-400/15 blur-2xl" />
            <p className="relative text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">Build your sprint</p>
            <div className="relative mt-6 grid grid-cols-3 gap-2">{[10, 20, 30].map((option) => <button key={option} onClick={() => setMinutes(option)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${minutes === option ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "border-slate-200 text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:text-slate-300"}`}>{option} min</button>)}</div>
            <div className="relative mt-5 flex rounded-xl bg-slate-100 p-1 dark:bg-white/[0.06]">{(["Focus", "Review"] as const).map((option) => <button key={option} onClick={() => setMode(option)} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${mode === option ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{option} mode</button>)}</div>
            <div className="relative mt-7 rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-bold">{minutes}-minute {mode.toLowerCase()} sprint</p><p className="mt-1 max-w-xs text-sm leading-6 text-slate-300">{mode === "Focus" ? "Choose one assessment and minimise context switching until it is complete." : "Revisit a submitted result and capture one improvement for next time."}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Focus className="size-5" /></span></div></div>
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03] sm:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">Quick warm-up preview</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Question {activeQuestion + 1} of {sampleQuiz.length} · not saved</p></div><div className="flex gap-1.5">{sampleQuiz.map((_, index) => <button key={index} onClick={() => !submitted && setActiveQuestion(index)} aria-label={`Open question ${index + 1}`} className={`size-8 rounded-full text-xs font-bold transition-colors ${activeQuestion === index ? "bg-emerald-600 text-white" : answers[index] !== undefined ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>{index + 1}</button>)}</div></div></div>
          <div className="p-6 sm:p-8">
            {submitted ? (
              <div className="grid gap-6 lg:grid-cols-[0.65fr_1fr]">
                <div className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-bold text-emerald-300">Practice result</p><p className="mt-3 font-display text-5xl font-semibold">{score}/{sampleQuiz.length}</p><p className="mt-3 text-sm leading-6 text-slate-300">You completed the interactive sample. Review the explanations, then continue into a timed assessment when ready.</p><Button onClick={restart} className="mt-6 rounded-xl bg-emerald-400 font-bold text-slate-950 hover:bg-emerald-300">Try again</Button></div>
                <div className="space-y-3">{sampleQuiz.map((question, index) => <article key={question.prompt} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start gap-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${answers[index] === question.answer ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"}`}>{answers[index] === question.answer ? "✓" : "!"}</span><div><p className="text-sm font-bold text-slate-800 dark:text-white">{question.prompt}</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{question.explanation}</p></div></div></article>)}</div>
              </div>
            ) : (
              <>
                <h2 className="max-w-3xl font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl dark:text-white">{current.prompt}</h2>
                <div className="mt-7 grid gap-3">{current.options.map((option, index) => <button key={option} onClick={() => setAnswers((previous) => ({ ...previous, [activeQuestion]: index }))} className={`flex items-center gap-4 rounded-xl border p-4 text-left text-sm font-semibold transition-all ${answers[activeQuestion] === index ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm dark:border-emerald-400/50 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]"}`}><span className="grid size-7 shrink-0 place-items-center rounded-full border border-current text-xs">{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
                <div className="mt-7 flex flex-wrap justify-between gap-3"><Button variant="outline" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)} className="rounded-xl">Previous</Button>{activeQuestion < sampleQuiz.length - 1 ? <Button disabled={answers[activeQuestion] === undefined} onClick={() => setActiveQuestion((value) => value + 1)} className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">Next question <ArrowRight className="ml-1.5 size-4" /></Button> : <Button disabled={!allAnswered} onClick={() => setSubmitted(true)} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Submit practice</Button>}</div>
              </>
            )}
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">{[[ListChecks, "Before you start", "Choose one objective and put distractions away."], [Lightbulb, "While you work", "Flag uncertainty rather than pausing your flow."], [CheckCircle2, "When you finish", "Use the review explanation to select a specific next step."]].map(([Icon, title, copy]) => { const CardIcon = Icon as typeof ListChecks; return <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><CardIcon className="size-5 text-emerald-600 dark:text-emerald-300" /><h2 className="mt-5 font-display text-xl font-semibold text-slate-950 dark:text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy as string}</p></article>; })}</section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ExamGuide() {
  const items = [["Before", Compass, "Choose a calm space, confirm your available time, and review the assessment duration."], ["During", Focus, "Answer deliberately, use bookmarks for uncertainty, and let the timer guide your pace—not your confidence."], ["After", CheckCircle2, "Read the explanation-aware review, save any eligible documents, and set one next learning goal."]];
  return <div className="min-h-screen bg-[hsl(var(--page))]"><SiteHeader /><main className="container py-12 sm:py-18"><section className="mx-auto max-w-3xl text-center"><Badge className="border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"><ShieldCheck className="mr-1.5 size-3" />Exam-ready guide</Badge><h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl dark:text-white">Enter the exam room feeling prepared.</h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">A short, practical pathway to help you prepare, stay focused, and learn from every submitted assessment.</p></section><section className="mx-auto mt-12 max-w-4xl space-y-4">{items.map(([stage, Icon, copy], index) => { const StageIcon = Icon as typeof Compass; return <article key={stage as string} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center dark:border-white/10 dark:bg-slate-900"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><StageIcon className="size-5" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">0{index + 1} · {stage as string}</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy as string}</p></div><CheckCircle2 className="hidden size-5 text-slate-300 sm:block dark:text-white/20" /></article>; })}</section><div className="mt-10 flex justify-center"><Button asChild className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"><Link href="/exams">Open the catalogue <ArrowRight className="ml-1.5 size-4" /></Link></Button></div></main><SiteFooter /></div>;
}
