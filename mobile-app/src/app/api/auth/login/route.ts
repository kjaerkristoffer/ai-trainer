import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.APP_USERNAME ?? "admin";
  const validPass = process.env.APP_PASSWORD ?? "changeme";

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(username);
  return NextResponse.json({ ok: true });
}
