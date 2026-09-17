import { FilmGrid } from "@/components/film-grid";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs uppercase tracking-[0.24em] text-primary">
          Подборка
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">{slug}</h1>
      </div>
      <div className="mt-10">
        <FilmGrid emptyLabel="Программа пока пуста" />
      </div>
    </div>
  );
}
