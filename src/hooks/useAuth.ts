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
import { supabase } from "@/lib/supabase";

type AuthValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthValue>({ user: null, loading: true });

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      const nextUser = data.session?.user ?? null;
      if (nextUser) await syncProfile(nextUser);
      if (cancelled) return;
      setUser(nextUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (nextUser) {
        syncProfile(nextUser).then(() => {
          if (!cancelled) {
            setUser(nextUser);
            setLoading(false);
          }
        });
        return;
      }
      setUser(null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
