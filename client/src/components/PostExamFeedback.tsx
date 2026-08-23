import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ratings = [
  { value: 1, label: "Very easy" }, { value: 2, label: "Easy" }, { value: 3, label: "Balanced" }, { value: 4, label: "Challenging" }, { value: 5, label: "Very challenging" },
];

export function PostExamFeedback({ attemptId }: { attemptId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.attempts.feedback.useQuery({ attemptId }, { enabled: attemptId > 0 });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  useEffect(() => { if (data) { setRating(data.difficultyRating); setComment(data.comment || ""); } }, [data]);
  const save = trpc.attempts.saveFeedback.useMutation({
    onSuccess: async () => { await utils.attempts.feedback.invalidate({ attemptId }); toast.success("Thank you — your feedback has been saved."); },
    onError: error => toast.error(`Feedback could not be saved: ${error.message}`),
  });
  if (isLoading) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />;
  return <section aria-labelledby="feedback-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><MessageSquareText className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Learner feedback</p><h2 id="feedback-heading" className="mt-1 font-display text-xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">How did this assessment feel?</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Your private rating helps administrators improve clarity, pacing, and support materials.</p></div></div><div className="mt-5"><p className="text-sm font-bold text-slate-900 dark:text-white">Difficulty rating</p><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">{ratings.map(item => <button key={item.value} type="button" aria-pressed={rating === item.value} onClick={() => setRating(item.value)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors ${rating === item.value ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-400/25"}`}>{item.value}. {item.label}</button>)}</div></div><div className="mt-5"><label htmlFor="exam-feedback-comment" className="text-sm font-bold text-slate-900 dark:text-white">Comments <span className="font-normal text-slate-500">(optional)</span></label><Textarea id="exam-feedback-comment" value={comment} onChange={event => setComment(event.target.value.slice(0, 1200))} maxLength={1200} placeholder="What supported your learning, or what could be clearer?" className="mt-2 min-h-24 resize-y rounded-xl" /><p className="mt-1 text-right text-xs text-slate-400">{comment.length}/1200</p></div><Button type="button" disabled={!rating || save.isPending} onClick={() => save.mutate({ attemptId, difficultyRating: rating, comment: comment.trim() || undefined })} className="mt-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{save.isPending ? <><Loader2 className="mr-1.5 size-4 animate-spin" />Saving feedback…</> : data ? "Update feedback" : "Save feedback"}</Button></section>;
}
