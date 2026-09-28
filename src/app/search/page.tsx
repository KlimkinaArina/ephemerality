import { Search } from "@/components/screens/Search";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page(props: PageProps<"/search">) {
  const { q, minutes } = await props.searchParams;
  return (
    <Search
      initialQuery={firstValue(q) ?? ""}
      initialMinutes={firstValue(minutes) ?? ""}
    />
  );
}
