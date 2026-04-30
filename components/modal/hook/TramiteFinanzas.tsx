type Props = {
  total?: number;
  saldo?: number;
};

export default function TramiteFinanzas({ total, saldo }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded mb-6 grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-400 text-xs">Total</p>
        <p className="text-lg font-semibold">
          ${total ?? "-"}
        </p>
      </div>

      <div>
        <p className="text-gray-400 text-xs">Saldo</p>
        <p className="text-lg font-semibold">
          ${saldo ?? "-"}
        </p>
      </div>
    </div>
  );
}