"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { parseUserRole, type UserRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

type AuthValue = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  role: null,
  loading: true,
});

async function syncProfile(user: User) {
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      last_platform: "web",
    },
    { onConflict: "id" }
  );
  if (error) console.error(error);
}

async function fetchRole(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return parseUserRole(data?.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function applyUser(nextUser: User | null) {
      if (!nextUser) {
        if (cancelled) return;
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      void syncProfile(nextUser);
      const nextRole = await fetchRole(nextUser.id);
      if (cancelled) return;
      setUser(nextUser);
      setRole(nextRole);
      setLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => applyUser(data.session?.user ?? null))
      .catch((error) => {
        console.error(error);
        if (cancelled) return;
        setUser(null);
        setRole(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, role, loading } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function loadSessionRole() {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return null;
  return fetchRole(userId);
}
