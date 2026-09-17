import { FilmGrid } from "@/components/film-grid";
import { HeroSearch } from "@/components/hero-search";

export default function SearchPage() {
  return (
    <>
      <HeroSearch />
      <FilmGrid emptyLabel="Результаты появятся после подключения каталога" />
    </>
  );
}
