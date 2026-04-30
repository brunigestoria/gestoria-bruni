"use client";

import TitularItem from "@/components/ICC/TitularItem";
import { Titular } from "@/app/types/titular";


type Props = {
  titulares?: Titular[];
};

export default function TramiteTitulares({ titulares }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-sm text-gray-400 mb-2">Titulares</h3>

      <div className="bg-gray-800 p-3 rounded space-y-3">
        {titulares?.length ? (
          titulares.map((t, i) => (
            <div key={i} className="border-b border-gray-700 pb-2">

              {/* 🔥 ACA METEMOS EL ICC */}
              <TitularItem titular={t} />

              {/* 🔹 INFO EXTRA */}
              <div className="flex justify-between mt-2">

                {t.telefono && (
                  <p className="text-xs text-gray-400">{t.telefono}</p>
                )}

                {t.principal && (
                  <span className="text-xs bg-blue-600 px-2 rounded">
                    Principal
                  </span>
                )}

              </div>

            </div>
          ))
        ) : (
          <p>-</p>
        )}
      </div>
    </div>
  );
}