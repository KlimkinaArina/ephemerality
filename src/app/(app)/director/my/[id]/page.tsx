import { DirectorApplication } from "@/components/screens/DirectorApplication";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DirectorApplication id={id} />;
}
