export function FilmGrid({ emptyLabel }: { emptyLabel: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Каталог
        </h2>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-md border border-border bg-card"
          >
            <div className="aspect-[3/4] bg-muted/60" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded-sm bg-muted" />
              <div className="h-2 w-1/3 rounded-sm bg-muted/80" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
