import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase-env";

export function createSupabaseAuthClient() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const SUPABASE_DOWN =
  "Supabase сейчас недоступен (проект на паузе или 502). Откройте dashboard, восстановите проект и повторите вход.";

export function authRouteError(error: unknown, fallback = "Ошибка") {
  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      msg?: unknown;
      status?: unknown;
    };
    const text =
      (typeof record.message === "string" && record.message) ||
      (typeof record.msg === "string" && record.msg) ||
      "";
    if (
      record.status === 502 ||
      record.status === 503 ||
      record.status === 521 ||
      /bad gateway|web server is down|failed to fetch/i.test(text)
    ) {
      return SUPABASE_DOWN;
    }
    if (text.trim()) return text;
  }
  if (error instanceof TypeError) {
    return "Не удалось связаться с Supabase. Проверьте NEXT_PUBLIC_SUPABASE_URL и сеть.";
  }
  return fallback;
}
