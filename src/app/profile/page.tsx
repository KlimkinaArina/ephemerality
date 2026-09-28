import { RequireAuth } from "@/components/require-auth";
import { AccountScreen } from "@/components/screens/AccountScreen";

export default function Page() {
  return (
    <RequireAuth>
      <AccountScreen
        title="Профиль"
        description="Настройки аккаунта. Сейчас достаточно email из сессии Supabase Auth."
      />
    </RequireAuth>
  );
}
