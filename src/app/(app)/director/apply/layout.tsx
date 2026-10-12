import type { ReactNode } from "react";
import { RequireRole } from "@/components/require-role";

export default function DirectorApplyLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["director", "moderator"]}>{children}</RequireRole>
  );
}
