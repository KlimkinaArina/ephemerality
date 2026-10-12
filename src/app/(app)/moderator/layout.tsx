import type { ReactNode } from "react";
import { RequireRole } from "@/components/require-role";

export default function ModeratorLayout({ children }: { children: ReactNode }) {
  return <RequireRole roles={["moderator"]}>{children}</RequireRole>;
}
