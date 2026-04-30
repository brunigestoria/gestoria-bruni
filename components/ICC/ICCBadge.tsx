type Props = {
  icc: number;
  categoria: string;
  color: string;
};

export default function ICCBadge({ icc, categoria, color }: Props) {
  const colorMap: Record<string, string> = {
  verde: "bg-green-600 text-white",
  verde_suave: "bg-green-400 text-black",
  amarillo: "bg-yellow-400 text-black",
  naranja: "bg-orange-500 text-white",
  rojo: "bg-red-600 text-white",
  gris: "bg-gray-500 text-white",
};

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-300">
        ICC: {Math.round(icc)}
      </span>

      <span
        className={`text-xs px-2 py-1 rounded text-white ${
          colorMap[color] || "bg-gray-500"
        }`}
      >
        {categoria}
      </span>
    </div>
  );
}