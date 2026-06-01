import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#fafafa]">
        <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
