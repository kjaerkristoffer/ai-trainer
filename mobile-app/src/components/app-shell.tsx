"use client";

import { usePathname, useRouter } from "next/navigation";
import { Calendar, BarChart3, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Month", icon: Calendar },
  { href: "/year", label: "Year", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_46%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-36 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.14),transparent_60%)] blur-3xl" />

      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border/70 bg-background/72 px-3 py-2 shadow-[0_14px_60px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 rounded-full px-2 py-1 text-left"
          >
            <span className="grid h-10 w-10 place-content-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">AI Trainer</span>
              <span className="block text-[11px] text-muted-foreground">Private fitness atlas</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full border border-border/70 bg-background/60 backdrop-blur-sm"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-8 pt-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-4 z-40 px-4 safe-area-bottom">
        <div className="mx-auto flex w-full max-w-sm items-center justify-around rounded-full border border-border/70 bg-background/78 p-2 shadow-[0_18px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  "flex min-w-28 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
