import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-film">
      <Skeleton className="h-[min(615px,70vh)] rounded-none" />
      <div className="mx-auto w-full max-w-[var(--ef-content-width)] space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-40 rounded-none" />
        <Skeleton className="h-64 rounded-none" />
      </div>
    </div>
  );
}
