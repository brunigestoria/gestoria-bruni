type Props = {
  tramite: {
    estado?: string;
    fecha_presentacion?: string;
    fecha_estado_actual?: string;
    lugar_guarda_actual?: string;
    tipo_tramite?: string;
    dependencia?: string;
    numero_tramite?: string;
    numero_gde?: string;
  };
};

export default function TramiteDatos({ tramite }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-sm text-gray-400 mb-3">Datos del trámite</h3>

      <div className="bg-gray-800 p-4 rounded grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

        <div>
          <p className="text-gray-400 text-xs">Estado</p>
          <span className="px-2 py-1 text-xs rounded bg-blue-600">
            {tramite.estado?.replaceAll("_", " ").toUpperCase()}
          </span>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Tipo</p>
          <p>{tramite.tipo_tramite || "-"}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Dependencia</p>
          <p>{tramite.dependencia || "-"}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Fecha presentación</p>
          <p>
            {tramite.fecha_presentacion
              ? new Date(tramite.fecha_presentacion).toLocaleDateString("es-AR")
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Último movimiento</p>
          <p>
            {tramite.fecha_estado_actual
              ? new Date(tramite.fecha_estado_actual).toLocaleDateString("es-AR")
              : "-"}
          </p>
        </div>

         <div>
  <p className="text-gray-400 text-xs">Lugar de guarda</p>
  <p className="text-white">
    {tramite.lugar_guarda_actual || "Oficina"}
  </p>
</div>

        <div>
          <p className="text-gray-400 text-xs">N° Trámite</p>
          <p>{tramite.numero_tramite || "-"}</p>
        </div>
         <div>
                <p className="text-gray-400 text-xs">N° GDE</p>
                <p>{tramite.numero_gde || "-"}</p>
              </div>
 

      </div>
    </div>
  );
}