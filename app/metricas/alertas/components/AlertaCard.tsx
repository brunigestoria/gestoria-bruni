type Props = {
  titulo: string;
  positiva?: string;
  negativa?: string;
  onClick?: () => void;
};

export default function AlertaCard({
  titulo,
  positiva,
  negativa,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-800 p-4 rounded-xl cursor-pointer hover:bg-slate-700 transition space-y-2"
    >
      <h3 className="font-semibold">{titulo}</h3>

      {!positiva && !negativa && (
        <p className="text-gray-400 text-sm">
          Sin alertas relevantes
        </p>
      )}

      {negativa && (
        <p className="text-red-400 text-sm">
          🔻 {negativa}
        </p>
      )}

      {positiva && (
        <p className="text-green-400 text-sm">
          🔺 {positiva}
        </p>
      )}
    </div>
  );
}