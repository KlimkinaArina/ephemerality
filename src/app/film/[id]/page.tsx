export default async function FilmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.24em] text-primary">Фильм</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">{id}</h1>
      <div className="mt-8 aspect-video rounded-md border border-border bg-card" />
      <p className="mt-6 max-w-2xl text-muted-foreground">
        Карточка фильма, плеер и шаринг появятся на следующем слое. Сейчас это
        пустой публичный маршрут `/film/:id`.
      </p>
    </article>
  );
}
