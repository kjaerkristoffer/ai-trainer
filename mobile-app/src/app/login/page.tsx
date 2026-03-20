"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_42%)]" />
      <div className="pointer-events-none absolute right-[-4rem] top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_58%)] blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl justify-end">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-kicker backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Personal training intelligence
          </div>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Your workouts, mapped like a private performance atlas.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              AI Trainer turns your Hevy and Strava history into a focused mobile dashboard with monthly rhythm, yearly consistency, and workout-by-workout drill-down.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-panel">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Private by default</p>
              <p className="mt-1 text-sm text-muted-foreground">Single-user sign-in protects your personal training data.</p>
            </div>
            <div className="surface-panel">
              <TrendingUp className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Live monthly rhythm</p>
              <p className="mt-1 text-sm text-muted-foreground">Scan the month and jump straight from day to workout detail.</p>
            </div>
            <div className="surface-panel">
              <Dumbbell className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Strength + cardio</p>
              <p className="mt-1 text-sm text-muted-foreground">Both training worlds sit inside one visual language.</p>
            </div>
          </div>
        </section>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-background/88 to-muted/70 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-content-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-3xl">AI Trainer</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Secure access to your private training dashboard</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  className="h-12 rounded-xl bg-background/60"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  className="h-12 rounded-xl bg-background/60"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                {loading ? "Signing in..." : "Enter dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
