import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "./ui/button";

export function StudentGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-[60vh] place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" /></div>;
  if (user) return <>{children}</>;
  return (
    <div className="container grid min-h-[62vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><LockKeyhole className="size-5" /></span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">Continue with your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Sign in to start assessments, save your answers, and revisit your results.</p>
        <Button onClick={() => startLogin()} className="mt-6 w-full rounded-xl bg-slate-950 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">Sign in securely <ArrowRight className="ml-1 size-4" /></Button>
      </div>
    </div>
  );
}
