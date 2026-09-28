import { supabase } from "@/lib/supabase";

export function authApiMessage(data: Record<string, unknown>, fallback = "Ошибка") {
  const message =
    (typeof data.msg === "string" && data.msg) ||
    (typeof data.message === "string" && data.message) ||
    (typeof data.error_description === "string" && data.error_description) ||
    (typeof data.error === "string" && data.error);
  return message || fallback;
}

export async function applyAuthSession(data: {
  access_token?: string;
  refresh_token?: string;
  session?: { access_token?: string; refresh_token?: string } | null;
}) {
  const access_token = data.access_token ?? data.session?.access_token;
  const refresh_token = data.refresh_token ?? data.session?.refresh_token;
  if (!access_token || !refresh_token) return false;

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}
