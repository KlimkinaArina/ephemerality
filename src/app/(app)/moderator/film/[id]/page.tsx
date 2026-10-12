import { AccountScreen } from "@/components/screens/AccountScreen";

export default async function Page(props: PageProps<"/moderator/film/[id]">) {
  const { id } = await props.params;
  return (
    <AccountScreen
      title="Заявка"
      description={`Решение по заявке ${id} и заметка режиссёру.`}
    />
  );
}
