"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">
          Sistema
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">SiBIVe</h1>
        <p className="mt-1 text-xs text-white/60">Sistema blockchain para inspección de vehículos</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-brand"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
        Blockchain privada · Geth
      </div>
    </aside>
  );
}
