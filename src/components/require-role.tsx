"use client";

import { type ReactNode } from "react";
import { Forbidden } from "@/components/forbidden";
import { FilmGridSkeleton } from "@/components/film-grid";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/roles";

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <RoleGate roles={roles}>{children}</RoleGate>
    </RequireAuth>
  );
}

function RoleGate({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
        <FilmGridSkeleton count={3} />
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    return <Forbidden />;
  }

  return children;
}
