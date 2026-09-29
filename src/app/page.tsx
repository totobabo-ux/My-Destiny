import Home from "./Home";

export default async function Page({ searchParams }: PageProps<"/">) {
  const { new: startNew } = await searchParams;
  return <Home startNew={startNew === "1"} />;
}
