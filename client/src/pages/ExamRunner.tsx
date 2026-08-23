import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StudentGate } from "@/components/StudentGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { remainingSeconds } from "@/lib/timer";
import { buildSubmissionReview, isLowTime, normalizeExamRecovery, toggleQuestionBookmark } from "@shared/examEnhancements";
import { AlertCircle, ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle2, Clock3, Cloud, Flag, Loader2, Send, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ExamRunner() {
  const [, params] = useRoute("/exams/:examId/attempt/:attemptId");
  const [, setLocation] = useLocation();
  const attemptId = Number(params?.attemptId);
  const { data: session, isLoading } = trpc.attempts.session.useQuery({ attemptId }, { enabled: attemptId > 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(() => new Set());
  const [now, setNow] = useState(Date.now());
  const [showReview, setShowReview] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState<number | null>(null);
  const [lastSuccessfulSaveAt, setLastSuccessfulSaveAt] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const lowTimeAnnouncedRef = useRef(false);

  const saveMutation = trpc.attempts.saveAnswer.useMutation({
    onSuccess: () => setLastSuccessfulSaveAt(Date.now()),
    onError: error => toast.error(`Answer could not be saved: ${error.message}`),
  });
  const submitMutation = trpc.attempts.submit.useMutation({
    onSuccess: result => {
      submittedRef.current = true;
      window.localStorage.removeItem(`examora:attempt:${result.attemptId}:recovery`);
      setLocation(`/results/${result.attemptId}`);
    },
    onError: error => toast.error(`Assessment could not be submitted: ${error.message}`),
  });

  useEffect(() => {
    if (!session) return;
    const serverAnswers = Object.fromEntries(session.answers.filter((answer): answer is typeof answer & { selectedOption: number } => answer.selectedOption !== null).map(answer => [answer.questionId, answer.selectedOption]));
    let recovery;
    try { recovery = normalizeExamRecovery(JSON.parse(window.localStorage.getItem(`examora:attempt:${session.attempt.id}:recovery`) || "null"), session.questions.map(question => question.id)); }
    catch { recovery = normalizeExamRecovery(null, session.questions.map(question => question.id)); }
    setAnswers({ ...serverAnswers, ...recovery.answers });
    setBookmarks(new Set(recovery.bookmarkedQuestionIds));
    setActiveIndex(recovery.activeIndex);
    setRecoveryReady(session.attempt.id);
  }, [session]);
  useEffect(() => {
    if (!session || recoveryReady !== session.attempt.id || submittedRef.current) return;
    window.localStorage.setItem(`examora:attempt:${session.attempt.id}:recovery`, JSON.stringify({ answers, bookmarkedQuestionIds: Array.from(bookmarks), activeIndex, savedAt: Date.now() }));
  }, [session, recoveryReady, answers, bookmarks, activeIndex]);
  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const secondsLeft = useMemo(() => session ? remainingSeconds(session.attempt.startedAt, session.exam.durationMinutes, now) : 0, [session, now]);
  const lowTime = session ? isLowTime(secondsLeft, session.exam.durationMinutes) : false;
  const review = useMemo(() => session ? buildSubmissionReview(session.questions.map(question => question.id), answers, bookmarks) : { answeredCount: 0, unansweredQuestionIds: [], flaggedQuestionIds: [] }, [session, answers, bookmarks]);
  const submit = useCallback(() => { if (session && !submittedRef.current && !submitMutation.isPending) submitMutation.mutate({ attemptId: session.attempt.id }); }, [session, submitMutation]);
  useEffect(() => { if (session && secondsLeft === 0 && !submittedRef.current) submit(); }, [session, secondsLeft, submit]);
  useEffect(() => { if (lowTime && !lowTimeAnnouncedRef.current) { lowTimeAnnouncedRef.current = true; toast.warning("Time is running low. Review and submit your answers soon."); } }, [lowTime]);

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"><Loader2 className="size-7 animate-spin text-emerald-600" /></div>;
  if (!session) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><SiteHeader /><div className="container py-16 text-center sm:py-20"><h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">This assessment is no longer active</h1><Button className="mt-5 min-h-11 rounded-xl" onClick={() => setLocation("/exams")}>Return to catalogue</Button></div><SiteFooter /></div>;

  const question = session.questions[activeIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = session.questions.length ? (answeredCount / session.questions.length) * 100 : 0;
  const reviewQuestionIds = review.unansweredQuestionIds.concat(review.flaggedQuestionIds.filter(id => !review.unansweredQuestionIds.includes(id)));
  const chooseAnswer = (questionId: number, selectedOption: number) => { setAnswers(current => ({ ...current, [questionId]: selectedOption })); saveMutation.mutate({ attemptId, questionId, selectedOption }); };

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><SiteHeader /><StudentGate><main className="container py-6 sm:py-10"><div className="mx-auto max-w-6xl">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">{session.exam.subject}</Badge><span className="text-xs font-semibold text-slate-400">Question {activeIndex + 1} of {session.questions.length}</span></div><h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-3xl dark:text-white">{session.exam.title}</h1><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><Cloud className="size-3.5" />{saveMutation.isPending ? "Saving answer…" : lastSuccessfulSaveAt ? `Last successful auto-save: ${new Date(lastSuccessfulSaveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Progress is saved automatically"}</p></div><div className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 sm:w-auto sm:self-start ${lowTime ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300" : "border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white"}`}><Clock3 className="size-[18px]" /><div className="text-right sm:text-left"><p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">Time remaining</p><p className="font-mono text-lg font-bold tracking-tight">{formatTime(secondsLeft)}</p></div></div></header>
    {lowTime ? <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200"><AlertCircle className="mt-0.5 size-4 shrink-0" /><p><b>Time is running low.</b> You have {formatTime(secondsLeft)} remaining.</p></div> : null}
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-400">Answer completion</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{answeredCount}/{session.questions.length} answered</p></div><Progress value={progress} className="mt-3 h-2 bg-slate-100 dark:bg-white/10" /><div className="mt-7 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-400">Question {activeIndex + 1}</p><Button type="button" variant="outline" size="sm" aria-pressed={bookmarks.has(question.id)} onClick={() => setBookmarks(current => toggleQuestionBookmark(current, question.id))} className={`min-h-10 rounded-lg ${bookmarks.has(question.id) ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300" : "border-slate-200 text-slate-600 dark:border-white/15 dark:text-slate-300"}`}>{bookmarks.has(question.id) ? <BookmarkCheck className="mr-1.5 size-3.5" /> : <Bookmark className="mr-1.5 size-3.5" />}{bookmarks.has(question.id) ? "Flagged" : "Flag for review"}</Button></div><h2 className="mt-3 max-w-3xl font-display text-xl font-semibold leading-[1.25] tracking-[-0.035em] text-slate-950 sm:text-2xl dark:text-white">{question.prompt}</h2><div className="mt-7 grid gap-3">{question.options.map((option, index) => { const selected = answers[question.id] === index; return <button key={option} type="button" onClick={() => chooseAnswer(question.id, index)} className={`flex min-h-14 w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors sm:p-5 ${selected ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-400/10" : "border-slate-200 bg-white hover:border-emerald-200 dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-400/30"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-500 dark:border-slate-600"}`}>{String.fromCharCode(65 + index)}</span><span className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{option}</span>{selected ? <CheckCircle2 className="ml-auto size-5 text-emerald-600 dark:text-emerald-400" /> : null}</button>; })}</div><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10"><Button variant="outline" onClick={() => setActiveIndex(index => Math.max(0, index - 1))} disabled={activeIndex === 0} className="min-h-11 rounded-xl"><ArrowLeft className="mr-1.5 size-4" />Previous</Button>{activeIndex < session.questions.length - 1 ? <Button onClick={() => setActiveIndex(index => Math.min(session.questions.length - 1, index + 1))} className="min-h-11 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">Next<ArrowRight className="ml-1.5 size-4" /></Button> : <Button onClick={() => setShowReview(true)} className="min-h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Submit assessment<Send className="ml-1.5 size-4" /></Button>}</div></section><aside className="order-first rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:order-last dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900 dark:text-white">Your progress</p><span className="text-xs font-semibold text-slate-500">{answeredCount}/{session.questions.length}</span></div>{bookmarks.size ? <p className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"><BookmarkCheck className="size-3.5" />{bookmarks.size} flagged for review</p> : null}<div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-5">{session.questions.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Go to question ${index + 1}`} className={`grid aspect-square place-items-center rounded-lg text-xs font-bold ${activeIndex === index ? "bg-slate-950 text-white dark:bg-emerald-400 dark:text-slate-950" : bookmarks.has(item.id) ? "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300" : answers[item.id] !== undefined ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>{index + 1}</button>)}</div><Button onClick={() => setShowReview(true)} variant="outline" className="mt-6 min-h-11 w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/30 dark:text-emerald-300"><Flag className="mr-1.5 size-4" />Finish & submit</Button><p className="mt-4 flex gap-2 text-[11px] leading-5 text-slate-400"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />Answers are stored locally for recovery and saved to your account when selected</p></aside></div>
    {showReview ? <div role="dialog" aria-modal="true" aria-labelledby="submission-review-title" className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-slate-900"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"><AlertCircle className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Final review</p><h3 id="submission-review-title" className="mt-1 font-display text-2xl font-semibold text-slate-950 dark:text-white">Review before you submit.</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{review.answeredCount} answered, {review.unansweredQuestionIds.length} unanswered, and {review.flaggedQuestionIds.length} flagged.</p></div></div>{reviewQuestionIds.length ? <div className="mt-5 flex flex-wrap gap-2">{reviewQuestionIds.map(questionId => <Button key={questionId} variant="outline" size="sm" onClick={() => { setActiveIndex(session.questions.findIndex(item => item.id === questionId)); setShowReview(false); }} className="rounded-lg">Question {session.questions.findIndex(item => item.id === questionId) + 1}</Button>)}</div> : null}<div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button variant="outline" onClick={() => setShowReview(false)} className="rounded-xl">Continue assessment</Button><Button onClick={submit} disabled={submitMutation.isPending} className="rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">{submitMutation.isPending ? "Submitting…" : "Submit assessment"}<Send className="ml-1.5 size-4" /></Button></div></div></div> : null}
  </div></main></StudentGate><SiteFooter /></div>;
}
