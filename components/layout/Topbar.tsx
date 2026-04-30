"use client";

import { useState } from "react";
import NuevoTramiteModal from "@/components/tramite/NuevoTramiteModal";
import BuscadorGlobal from "@/components/tramite/BuscadorGlobal";

export default function Topbar() {
    const [nuevoTramiteOpen, setNuevoTramiteOpen] = useState(false);
    return (
    <header className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-6">
      {/* Logo */}
     <img
  src="/logo.png"
  alt="Logo"
  className="h-14 w-auto object-contain"
/>

      {/* Buscador */}
      <BuscadorGlobal
  onSelect={(id, tipo) => {
    if (tipo === "tramite") {
      console.log("abrir modal tramite", id);
      // 👉 abrir modal
    }

    if (tipo === "cliente") {
      console.log("ir a cliente", id);
    }

    if (tipo === "broker") {
      console.log("ir a broker", id);
    }
  }}
/>
      
      {/* Acciones */}
      <div className="flex items-center gap-4">

        <button
  className="bg-blue-600 px-4 py-2 rounded"
  onClick={() => setNuevoTramiteOpen(true)}
>
  + Nuevo trámite
</button>

        <div>🔔</div>

        <div className="flex items-center gap-2">
          <span>Cali</span>
          <span className="text-gray-400 text-sm">(Dueño)</span>
        </div>

      </div>
{nuevoTramiteOpen && (
  <NuevoTramiteModal
    onClose={() => setNuevoTramiteOpen(false)}
    onCreated={() => {
      setNuevoTramiteOpen(false);
      window.dispatchEvent(new Event("tramite-creado"));
    }}
  />
)}
    </header>
    
  );
}