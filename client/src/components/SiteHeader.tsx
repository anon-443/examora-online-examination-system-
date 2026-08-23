import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const links = [
  { label: "Explore exams", href: "/exams" },
  { label: "Practice", href: "/practice" },
  { label: "Study hub", href: "/study-hub" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "About", href: "/about" },
];

export function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
      <span className="grid size-9 place-items-center rounded-xl bg-slate-950 shadow-[0_9px_24px_-11px_rgba(15,23,42,0.75)] transition-transform duration-200 group-hover:-rotate-3 dark:bg-emerald-400">
        <ShieldCheck className="size-[19px] text-white dark:text-slate-950" strokeWidth={2.2} />
      </span>
      Examora
    </Link>
  );
}

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const updateShadow = () => setScrolled(window.scrollY > 6);
    updateShadow();
    window.addEventListener("scroll", updateShadow, { passive: true });
    return () => window.removeEventListener("scroll", updateShadow);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200/70 bg-[hsl(var(--page)/0.82)] backdrop-blur-xl transition-shadow dark:border-white/10 ${scrolled ? "shadow-[0_2px_12px_rgba(0,0,0,0.06)]" : ""}`}>
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${location === link.href ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          <NotificationBell />
          <ThemeToggle />
          {loading ? <div className="h-9 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-white/10" /> : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full px-1.5 py-1.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-white/10">
                  <Avatar className="size-7 border border-slate-200 dark:border-white/15">
                    <AvatarFallback className="bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-400 dark:text-slate-950">
                      {user.name?.slice(0, 1).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-24 truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{user.name || "My account"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer rounded-lg">My profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/history" className="cursor-pointer rounded-lg">My activity</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/learning" className="cursor-pointer rounded-lg">My learning</Link></DropdownMenuItem>
                {user.role === "admin" ? <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer rounded-lg"><LayoutDashboard className="mr-2 size-4" />Administration</Link></DropdownMenuItem> : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg text-red-600 focus:text-red-600">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : <><Button onClick={() => startLogin()} variant="outline" className="rounded-full border-emerald-300 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-300 dark:hover:bg-emerald-400/10">Sign up free</Button><Button onClick={() => startLogin()} className="rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">Sign in <ArrowRight className="ml-1 size-4" /></Button></>}
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(value => !value)} className="rounded-full" aria-label="Open navigation">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="border-t border-slate-200 bg-[hsl(var(--page))] px-5 py-4 shadow-lg dark:border-white/10 lg:hidden">
            <nav className="mx-auto flex max-w-xl flex-col gap-1" aria-label="Mobile navigation">
              {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">{link.label}</Link>)}
              {user ? <>
                <Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">My profile</Link>
                <Link href="/history" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">My activity</Link>
                <Link href="/learning" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">My learning</Link>
                {user.role === "admin" ? <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">Administration</Link> : null}
                <button onClick={logout} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">Sign out</button>
              </> : <div className="mt-2 grid gap-2"><Button onClick={() => startLogin()} variant="outline" className="rounded-xl border-emerald-300 text-emerald-800 dark:border-emerald-400/40 dark:text-emerald-300">Sign up free</Button><Button onClick={() => startLogin()} className="rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">Sign in to Examora</Button></div>}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
