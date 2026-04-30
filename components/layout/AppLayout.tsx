import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">

      {/* TOPBAR */}
      <Topbar />

      {/* CONTENIDO DEBAJO DEL TOPBAR */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 bg-gray-950 text-gray-200 p-6 overflow-auto">
          {children}
        </main>

      </div>

    </div>
  );
}