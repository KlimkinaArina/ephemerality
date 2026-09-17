import { FilmGrid } from "@/components/film-grid";
import { HeroSearch } from "@/components/hero-search";

export default function Home() {
  return (
    <>
      <HeroSearch />
      <FilmGrid emptyLabel="Фильмы появятся после слоя данных" />
    </>
  );
}
