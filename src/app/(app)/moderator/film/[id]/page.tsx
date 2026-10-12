import { ModeratorFilm } from "@/components/screens/ModeratorFilm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModeratorFilm id={id} />;
}
