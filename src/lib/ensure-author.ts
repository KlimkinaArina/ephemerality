import { slugify } from "@/lib/slug";
import { supabase } from "@/lib/supabase";

export async function ensureAuthor(userId: string, name: string) {
  const authorSlug = slugify(name);
  const { data: existing, error: lookupError } = await supabase
    .from("authors")
    .select("id, name")
    .eq("slug", authorSlug)
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) return { authorId: null as string | null, error: lookupError };
  if (existing) return { authorId: existing.id, error: null };

  const insertAuthor = (slug: string) =>
    supabase
      .from("authors")
      .insert({ name, slug, user_id: userId })
      .select("id")
      .single();

  let { data: created, error: insertError } = await insertAuthor(authorSlug);
  if (insertError) {
    const retry = await insertAuthor(`${authorSlug}-${userId.slice(0, 8)}`);
    created = retry.data;
    insertError = retry.error;
  }

  if (insertError || !created) {
    return { authorId: null as string | null, error: insertError };
  }
  return { authorId: created.id, error: null };
}
