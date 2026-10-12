import { NextResponse } from "next/server";
import { authRouteError, createSupabaseAuthClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createSupabaseAuthClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Не заданы NEXT_PUBLIC_SUPABASE_URL или ANON_KEY" },
      { status: 500 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Некорректный запрос" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ message: "Укажите email и пароль" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      const message = authRouteError(error, "Неверный email или пароль");
      const unavailable = message.startsWith("Supabase сейчас недоступен");
      return NextResponse.json(
        { message },
        { status: unavailable ? 503 : 401 }
      );
    }
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      session: data.session,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: authRouteError(error) }, { status: 503 });
  }
}
