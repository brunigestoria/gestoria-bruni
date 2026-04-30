"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Props = {
  data: {
    mes: string;
    ingresos: number;
    costos: number;
    ganancia: number;
  }[];
};

export default function FlujoCajaChart({ data }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 h-87.5">
      <h2 className="text-sm text-gray-400 mb-2">Flujo de caja</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />

          <XAxis dataKey="mes" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />

          <Tooltip
            contentStyle={{ backgroundColor: "#020617", border: "none" }}
           formatter={(value) =>
  typeof value === "number" ? `$${value.toLocaleString()}` : value
}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="costos"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="ganancia"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="proyeccion"
            stroke="#a78bfa"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}