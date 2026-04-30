"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col">

      {/* PARTE SUPERIOR */}
      <div className="p-4">

        <h2 className="text-lg font-semibold mb-6">
          Gestoría Bruni
        </h2>

        <nav className="space-y-3">

          <Link href="/dashboard">
  <div className="hover:text-white cursor-pointer">
    Dashboard
  </div>
</Link>

          <Link href="/tramites">
  <div className="hover:text-white cursor-pointer">
    Tramites
  </div>
</Link>

          <Link href="/prefectura">
  <div className="hover:text-white cursor-pointer">
    Prefectura Hoy
  </div>
</Link>

          <Link href="/alertas">
  <div className="hover:text-white cursor-pointer">
    Alertas
  </div>
</Link>

          <Link href="/historial">
  <div className="hover:text-white cursor-pointer">
    Historial
  </div>
</Link>

          <Link href="/finanzas">
  <div className="hover:text-white cursor-pointer">
    Finanzas
  </div>
</Link>

          <Link href="/reparto">
  <div className="hover:text-white cursor-pointer">
    Reparto
  </div>
</Link>

          <Link href="/metricas">
  <div className="hover:text-white cursor-pointer">
    Metricas
  </div>
</Link>

        </nav>

      </div>

      {/* EMPUJA CONFIGURACIÓN AL FONDO */}
      <div className="mt-auto p-4 border-t border-gray-800">

        <Link href="/configuracion">
  <div className="hover:text-white cursor-pointer">
    Configuracion
  </div>
</Link>

      </div>

    </aside>
  );
}