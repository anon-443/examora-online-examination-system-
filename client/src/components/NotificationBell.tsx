import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

export function NotificationBell() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.collaboration.notifications.list.useQuery(undefined, { enabled: Boolean(user) });
  const markRead = trpc.collaboration.notifications.markRead.useMutation({ onSuccess: () => utils.collaboration.notifications.list.invalidate() });
  const markAllRead = trpc.collaboration.notifications.markAllRead.useMutation({ onSuccess: () => utils.collaboration.notifications.list.invalidate() });
  if (!user) return null;
  const unread = notifications.filter(item => !item.readAt).length;

  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}><Bell className="size-[18px]" />{unread ? <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[340px] rounded-2xl p-2"><div className="flex items-center justify-between px-2 py-1.5"><DropdownMenuLabel className="p-0 font-display text-base font-semibold">Notifications</DropdownMenuLabel>{unread ? <button onClick={() => markAllRead.mutate()} className="text-xs font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300"><CheckCheck className="mr-1 inline size-3.5" />Mark all read</button> : null}</div><DropdownMenuSeparator />{notifications.length ? notifications.slice(0, 6).map(item => <DropdownMenuItem key={item.id} onClick={() => { if (!item.readAt) markRead.mutate({ id: item.id }); if (item.actionHref) setLocation(item.actionHref); }} className="cursor-pointer items-start gap-3 rounded-xl px-2 py-3 focus:bg-emerald-50 dark:focus:bg-emerald-400/10"><Circle className={`mt-1 size-2 shrink-0 fill-current ${item.readAt ? "text-slate-300 dark:text-white/20" : "text-emerald-500"}`} /><span className="min-w-0"><span className="block text-sm font-bold text-slate-800 dark:text-white">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.body}</span></span></DropdownMenuItem>) : <div className="px-3 py-8 text-center"><Bell className="mx-auto size-5 text-emerald-600" /><p className="mt-2 text-sm font-bold">You’re all caught up.</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New cohort work and deadlines will appear here.</p></div>}</DropdownMenuContent></DropdownMenu>;
}
