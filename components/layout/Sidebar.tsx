"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  Zap,
  KanbanSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/campaigns", icon: Send, label: "Campaigns" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/crm", icon: KanbanSquare, label: "CRM" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/inboxes", icon: UserCircle, label: "Inboxes" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#0d1424] border-r border-[#1f2d45] transition-all duration-300 relative shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-[#1f2d45]",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-base tracking-tight">
            GrowSume
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = (() => {
            if (href === "/") return pathname === "/";
            // exact-match-first-leaf routes to avoid /inbox matching /inboxes
            if (href === "/inbox") return pathname === "/inbox";
            if (href === "/inboxes") return pathname === "/inboxes";
            return pathname === href || pathname.startsWith(href + "/");
          })();
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-400" : "")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors z-10 shadow-lg"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* User */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-4 border-t border-[#1f2d45]",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
          AR
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              Alex Rivera
            </p>
            <p className="text-xs text-slate-500 truncate">alex@growsume.io</p>
          </div>
        )}
      </div>
    </aside>
  );
}
