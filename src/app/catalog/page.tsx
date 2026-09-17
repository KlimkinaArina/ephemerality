import { FilmGrid } from "@/components/film-grid";

export default function CatalogPage() {
  return (
    <div className="pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="mb-2 text-3xl font-medium tracking-tight">Каталог</h1>
        <p className="mb-10 text-muted-foreground">
          Поиск и фильтры по длительности, настроению и теме.
        </p>
      </div>
      <FilmGrid emptyLabel="Пустая витрина" />
    </div>
  );
}
