import { Film } from "@/components/screens/Film";

export default async function Page(props: PageProps<"/film/[id]">) {
  const { id } = await props.params;
  return <Film id={id} />;
}
