import { RequireAuth } from "@/components/require-auth";
import { Tickets } from "@/components/screens/Tickets";

export default function Page() {
  return (
    <RequireAuth>
      <Tickets />
    </RequireAuth>
  );
}
