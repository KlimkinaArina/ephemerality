import { ListRowSkeleton } from "@/components/film-grid";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
      <ListRowSkeleton />
    </div>
  );
}
