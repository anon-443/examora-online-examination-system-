import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-7 animate-spin text-emerald-600" /></div>;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[hsl(var(--page))] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900"><ShieldAlert className="mx-auto size-8 text-emerald-600" /><h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] dark:text-white">Administrator sign-in required</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Sign in with an administrator account to continue to Examora administration.</p><Button onClick={() => startLogin()} className="mt-6 w-full rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">Sign in <ArrowRight className="ml-1.5 size-4" /></Button></div></div>;
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[hsl(var(--page))] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900"><ShieldAlert className="mx-auto size-8 text-amber-500" /><h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] dark:text-white">Administrator access only</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Your account is securely signed in, but it does not have permission to access content administration.</p><Button asChild className="mt-6 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Link href="/">Return to Examora</Link></Button></div></div>;
  return <>{children}</>;
}
