import { Collection } from "@/components/screens/Collection";

export default async function Page(props: PageProps<"/collection/[slug]">) {
  const { slug } = await props.params;
  return <Collection slug={slug} />;
}
