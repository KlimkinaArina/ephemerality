import { AccountScreen } from "@/components/screens/AccountScreen";

export default async function Page(props: PageProps<"/session/[id]">) {
  const { id } = await props.params;
  return (
    <AccountScreen
      title="Сеанс"
      description={`Сеанс ${id}: время, зал, цена и места.`}
    />
  );
}
