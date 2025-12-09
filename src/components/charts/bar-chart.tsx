"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  colors?: string[];
}

const defaultColors = ["#00ff88", "#00ccff", "#ff6b6b", "#ffd93d", "#c44dff", "#ff9f43", "#00d9ff", "#ff6b9d"];

export function CustomBarChart({ data, title, height = 300, layout = "vertical", colors = defaultColors }: BarChartProps) {
  return (
    <div className="chart-container p-4">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-primary glow-text">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          layout={layout}
          margin={{ top: 10, right: 30, left: layout === "vertical" ? 80 : 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
          {layout === "vertical" ? (
            <>
              <XAxis type="number" stroke="#6b9b80" fontSize={12} tickLine={false} axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }} />
              <YAxis type="category" dataKey="name" stroke="#6b9b80" fontSize={11} tickLine={false} axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }} width={75} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" stroke="#6b9b80" fontSize={12} tickLine={false} axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }} />
              <YAxis stroke="#6b9b80" fontSize={12} tickLine={false} axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 25, 18, 0.95)",
              border: "1px solid rgba(0, 255, 136, 0.3)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
            labelStyle={{ color: "#00ff88", fontWeight: "bold" }}
            itemStyle={{ color: "#e0f2e9" }}
            cursor={{ fill: "rgba(0, 255, 136, 0.1)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
