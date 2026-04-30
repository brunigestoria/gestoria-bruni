"use client";

import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const router = useRouter();

  const items = [
    { name: "Usuarios", path: "/configuracion/usuarios" },
    { name: "Roles", path: "/configuracion/roles" },
    { name: "Dependencias", path: "/configuracion/dependencias" },
    { name: "Precios", path: "/configuracion/precios" },
    { name: "Parámetros", path: "/configuracion/parametros" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div
            key={item.name}
            onClick={() => router.push(item.path)}
            className="bg-slate-800 p-4 rounded-xl cursor-pointer hover:bg-slate-700"
          >
            <p className="font-medium">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}