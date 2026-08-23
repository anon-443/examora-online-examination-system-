import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/SiteHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart3, BookOpenCheck, ChevronLeft, ClipboardList, LayoutDashboard, LogOut, Menu, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Assessments", href: "/admin#assessments", icon: BookOpenCheck },
  { label: "Questions", href: "/admin#questions", icon: ClipboardList },
  { label: "Participation", href: "/admin#participation", icon: UsersRound },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const sideNav = <nav className="space-y-1" aria-label="Administration navigation">{nav.map(item => { const Icon = item.icon; const active = location === "/admin" && item.href === "/admin"; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-slate-950 text-white dark:bg-emerald-400 dark:text-slate-950" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"}`}><Icon className="size-[17px]" />{item.label}</Link>; })}</nav>;
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-white/10 dark:bg-slate-900 lg:flex"><Brand /><div className="mt-10">{sideNav}</div><div className="mt-auto border-t border-slate-100 pt-4 dark:border-white/10"><Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"><ChevronLeft className="size-3.5" />Back to Examora</Link><div className="mt-3 flex items-center gap-2.5 px-3"><Avatar className="size-8"><AvatarFallback className="bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-400 dark:text-slate-950">{user?.name?.slice(0, 1).toUpperCase() || "A"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800 dark:text-white">{user?.name || "Administrator"}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Administrator</p></div><button onClick={logout} className="text-slate-400 transition-colors hover:text-rose-600" aria-label="Sign out"><LogOut className="size-4" /></button></div></div></aside>
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-slate-50/85 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 lg:ml-[264px] lg:px-9"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={() => setOpen(true)} aria-label="Open admin menu"><Menu className="size-5" /></Button><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">Examora</p><h1 className="font-display text-lg font-semibold tracking-[-0.035em]">Administration</h1></div></div><ThemeToggle /></header>
    {open ? <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-[280px] bg-white px-4 py-5 shadow-2xl dark:bg-slate-900" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between"><Brand /><Button size="icon" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}><X className="size-5" /></Button></div><div className="mt-10">{sideNav}</div></aside></div> : null}
    <main className="lg:ml-[264px]">{children}</main>
  </div>;
}
