import { useTheme, type TextSize } from "@/contexts/ThemeContext";
import { Accessibility, Check } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const options: Array<{ value: TextSize; label: string; hint: string }> = [
  { value: "default", label: "Default text", hint: "Balanced interface scale" },
  { value: "comfortable", label: "Comfortable text", hint: "More room to read" },
  { value: "large", label: "Large text", hint: "Maximum readable scale" },
];

export function TextSizeControl() {
  const { textSize, setTextSize } = useTheme();
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full" aria-label="Choose text size" title="Text size"><Accessibility className="size-[18px]" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5"><DropdownMenuLabel className="px-2 py-1.5 text-sm font-bold">Reading size</DropdownMenuLabel><p className="px-2 pb-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose the text scale that feels most comfortable.</p><DropdownMenuSeparator />{options.map(option => <DropdownMenuItem key={option.value} onClick={() => setTextSize(option.value)} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2.5"><span><span className="block text-sm font-semibold">{option.label}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.hint}</span></span>{textSize === option.value ? <Check className="size-4 text-emerald-600" /> : null}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}
