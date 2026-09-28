import { Suspense } from "react";
import { Signup } from "@/components/screens/Signup";

export default function Page() {
  return (
    <Suspense>
      <Signup />
    </Suspense>
  );
}
