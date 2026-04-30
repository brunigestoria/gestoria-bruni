import TramitesTable from "@/components/tables/TramitesTable";

export default function Home() {
  return (
    <main>
      <h1 className="text-xl font-bold p-4">
        Sistema Gestoria Bruni V2
      </h1>

      <TramitesTable />
    </main>
  );
}