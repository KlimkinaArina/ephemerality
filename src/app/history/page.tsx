import { RequireAuth } from "@/components/require-auth";
import { AccountScreen } from "@/components/screens/AccountScreen";

export default function Page() {
  return (
    <RequireAuth>
      <AccountScreen
        title="История"
        description="Просмотры и прогресс появятся здесь после слоя с user_id."
      />
    </RequireAuth>
  );
}
