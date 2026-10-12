import { RequireAuth } from "@/components/require-auth";
import { AccountScreen } from "@/components/screens/AccountScreen";

export default function Page() {
  return (
    <RequireAuth>
      <AccountScreen
        title="Мои билеты"
        description="Билеты на сеансы и QR для входа в зал."
      />
    </RequireAuth>
  );
}
