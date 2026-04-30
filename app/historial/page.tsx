"use client";

import Link from "next/link";

export default function Historial() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">Historial</h1>

      <div className="grid grid-cols-3 gap-4">

        <Link href="/historial/embarcaciones">
          <div className="bg-gray-800 p-6 rounded cursor-pointer hover:bg-gray-700">
            🚤 Embarcaciones
          </div>
        </Link>

        <Link href="/historial/clientes">
          <div className="bg-gray-800 p-6 rounded cursor-pointer hover:bg-gray-700">
            👤 Clientes
          </div>
        </Link>

        <Link href="/historial/brokers">
          <div className="bg-gray-800 p-6 rounded cursor-pointer hover:bg-gray-700">
            🧑‍💼 Brokers
          </div>
        </Link>

      </div>

    </div>
  );
}