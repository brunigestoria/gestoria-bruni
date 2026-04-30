"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Documento = {
  tipo_documento: string;
  url: string;
};

type Props = {
  tramiteId: string;
};

export default function DocumentosSection({ tramiteId }: Props) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);

  // 🔹 cargar documentos
  async function cargarDocs() {
    const { data } = await supabase
      .from("tramite_documentos")
      .select("tipo_documento, url")
      .eq("tramite_id", tramiteId);

    setDocs(data || []);
  }

  // 🔹 cargar fotos
  async function cargarFotos() {
    const { data } = await supabase.storage
      .from("documentos-tramites")
      .list(`${tramiteId}/fotos`, { limit: 100 });

    if (data) {
      setFotos(data.map((f) => f.name));
    }
  }

  useEffect(() => {
    if (tramiteId) {
      cargarDocs();
      cargarFotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tramiteId]);

  // 🔹 refresh global
  useEffect(() => {
    function recargar() {
      cargarDocs();
      cargarFotos();
    }

    window.addEventListener("tramite_actualizado", recargar);
    return () =>
      window.removeEventListener("tramite_actualizado", recargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tramiteId]);

  function obtener(tipo: string) {
    return docs.find((d) => d.tipo_documento === tipo);
  }

  return (
    <div className="bg-gray-900 p-6 rounded space-y-6">
      <h3 className="text-lg font-semibold">Documentos</h3>

      {/* 📄 DOCUMENTOS */}
      <div className="
  grid 
  grid-cols-2 
  sm:grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-2 
  gap-4
">
        <DocumentoCard titulo="expediente" doc={obtener("expediente")} tramiteId={tramiteId} />
        <DocumentoCard titulo="provisorio" doc={obtener("provisorio")} tramiteId={tramiteId} />
        <DocumentoCard titulo="matricula" doc={obtener("matricula")} tramiteId={tramiteId} />

        {/* 📸 FOTOS */}
        <FotosCard fotos={fotos} tramiteId={tramiteId} recargar={cargarFotos} />
      </div>
    </div>
  );
}

//
// 📄 DOCUMENTO CARD
//
function DocumentoCard({
  titulo,
  doc,
  tramiteId,
}: {
  titulo: string;
  doc?: Documento;
  tramiteId: string;
}) {
  const [preview, setPreview] = useState(false);

  async function handleUpload(file: File) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${tramiteId}/${titulo}.${fileExt}`;

    const { error } = await supabase.storage
      .from("documentos-tramites")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert(error.message);
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos-tramites/${filePath}`;

    await supabase.from("tramite_documentos").upsert({
      tramite_id: tramiteId,
      tipo_documento: titulo,
      url,
    });

    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  return (
    <DropZone onFile={handleUpload}>
      <div className="bg-gray-800 p-4 rounded text-center space-y-3">

        <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full uppercase">
          {titulo}
        </span>

        {doc ? (
          <>
            <span className="text-emerald-500 text-xs">Cargado</span>

            <div className="flex gap-3 justify-center text-sm">
              <button onClick={() => setPreview(true)}>👁 Ver</button>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                ⬇
                </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-500 text-sm">
              Arrastrar o subir
            </span>

            <label className="cursor-pointer">
              <span className="text-xs bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
                ⬆ Subir archivo
              </span>

              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </div>
        )}
      </div>

      {preview && doc && (
        <PreviewModal url={doc.url} onClose={() => setPreview(false)} />
      )}
    </DropZone>
  );
}

//
// 📸 FOTOS
//
function FotosCard({
  fotos,
  tramiteId,
  recargar,
}: {
  fotos: string[];
  tramiteId: string;
  recargar: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  async function subir(files: FileList | null) {
    if (!files) return;

    for (const file of Array.from(files)) {
      const path = `${tramiteId}/fotos/${Date.now()}_${file.name}`;

      await supabase.storage
        .from("documentos-tramites")
        .upload(path, file);
    }

    recargar();
  }

  function getUrl(nombre: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos-tramites/${tramiteId}/fotos/${nombre}`;
  }

  return (
    <DropZone onFiles={subir}>
      <div className="bg-gray-800 p-4 rounded space-y-3">

        <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full uppercase">
          fotos
        </span>

        <label className="cursor-pointer block text-center">
          <span className="text-xs bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
            ⬆ Subir fotos
          </span>

          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => subir(e.target.files)}
          />
        </label>

        {fotos.length === 0 ? (
          <div className="text-gray-500 text-sm text-center">
            Arrastrar fotos o usar el botón
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <img
                key={f}
                src={getUrl(f)}
                onClick={() => setPreview(getUrl(f))}
                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
              />
            ))}
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal url={preview} onClose={() => setPreview(null)} />
      )}
    </DropZone>
  );
}

//
// 🧲 DROP ZONE
//
function DropZone({
  children,
  onFile,
  onFiles,
}: {
  children: React.ReactNode;
  onFile?: (file: File) => void;
  onFiles?: (files: FileList) => void;
}) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (onFiles) onFiles(files);
    else if (onFile && files[0]) onFile(files[0]);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border border-dashed border-gray-700 rounded hover:border-blue-500 transition"
    >
      {children}
    </div>
  );
}

//
// 👁 PREVIEW
//
function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const esPDF = url.toLowerCase().includes(".pdf");

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[90%] h-[90%] bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {esPDF ? (
          <iframe
            src={url}
            className="w-full h-full"
          />
        ) : (
          <img
            src={url}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}