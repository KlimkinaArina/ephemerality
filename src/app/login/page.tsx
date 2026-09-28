import { Suspense } from "react";
import { Login } from "@/components/screens/Login";

export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
