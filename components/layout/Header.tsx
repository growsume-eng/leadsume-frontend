"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/inbox": "Inbox",
  "/crm": "CRM Pipeline",
  "/leads": "Leads",
  "/inboxes": "Inboxes",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const state = useAppState();

  const title =
    Object.entries(pageTitles).find(([key]) =>
      key === "/" ? pathname === "/" : pathname.startsWith(key)
    )?.[1] ?? "GrowSume";

  const unread = state.threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <header className="h-14 bg-[#0d1424] border-b border-[#1f2d45] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-slate-200">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search…"
            className="w-52 pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
