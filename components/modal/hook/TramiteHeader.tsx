type Props = {
  tramite: {
    embarcacion?: string;
    matricula?: string;
  };
  onEditar: () => void;
  onEstadoChange: (estado: string) => void;
};

export default function TramiteHeader({
  tramite,
  onEditar,
  onEstadoChange,
}: Props) {
  return (
    <div className="mb-6 border-b border-gray-800 pb-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">

      <div>
        <h2 className="text-2xl font-semibold">
          {tramite.embarcacion?.toUpperCase()}
        </h2>
        <p className="text-gray-400 text-sm">
          Matrícula: {tramite.matricula || "-"}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={onEditar} className="bg-gray-700 px-3 py-2 rounded">
          Editar
        </button>

        <button
          onClick={() => onEstadoChange("PRESENTAR")}
          className="bg-gray-700 px-3 py-2 rounded"
        >
          Presentar
        </button>
      </div>
    </div>
  );
}