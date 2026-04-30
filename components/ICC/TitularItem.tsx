
"use client";

import { useICC } from "@/components/ICC/useICC";
import ICCBadge from "@/components/ICC/ICCBadge";
import { Titular } from "@/app/types/titular";

type Props = {
  titular: Titular;
};

export default function TitularItem({ titular }: Props) {
  const icc = useICC(titular.id);

  return (
    <div className="border-b border-gray-800 pb-2 mb-2">
      
      <div>{titular.nombre}</div>
      <div className="text-xs text-gray-400">{titular.dni}</div>

      <div className="mt-1">

        {!titular.id && (
          <div className="text-xs text-gray-500">
            Cliente nuevo (sin historial)
          </div>
        )}

        {titular.id && (
          icc ? (
            <>
              <div className="flex items-center gap-2">
                <ICCBadge
                  icc={icc.icc}
                  categoria={icc.categoria}
                  color={icc.color}
                />
                <span className="text-xs text-gray-400">
                  {icc.icc} pts
                </span>
              </div>

              {icc.icc < 50 && (
                <div className="text-red-400 text-xs mt-1">
                  ⚠ Cliente con comportamiento riesgoso
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500">
              Cargando ICC...
            </div>
          )
        )}

      </div>
    </div>
  );
}