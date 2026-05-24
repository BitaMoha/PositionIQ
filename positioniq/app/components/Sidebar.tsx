"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  Swords,
  DollarSign,
  BookOpen,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/competitor", label: "Competitor Intel", icon: Target },
  { href: "/narratives", label: "Customer Narratives", icon: MessageSquare },
  { href: "/battlecards", label: "Battlecards", icon: Swords },
  { href: "/pricing", label: "Pricing Intelligence", icon: DollarSign },
  { href: "/playbook", label: "Value Selling Playbook", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#0F1729]">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center border-b border-white/10 px-6">
        <span className="text-lg font-bold tracking-tight text-white">PositionIQ</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-violet-600 text-white"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <p className="text-xs text-white/40">Stripe PMM · Adyen Intel</p>
      </div>
    </aside>
  );
}
