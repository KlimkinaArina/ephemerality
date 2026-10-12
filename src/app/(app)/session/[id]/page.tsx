import { Session } from "@/components/screens/Session";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Session id={id} />;
}
