import { RequireAuth } from "@/components/require-auth";
import { AccountScreen } from "@/components/screens/AccountScreen";

export default function Page() {
  return (
    <RequireAuth>
      <AccountScreen
        title="Избранное"
        description="Здесь появятся сохранённые фильмы. Гостевой каталог доступен без входа — этот экран только для аккаунта."
      />
    </RequireAuth>
  );
}
