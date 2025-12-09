"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const defaultColors = ["#00ff88", "#00ccff", "#ff6b6b", "#ffd93d", "#c44dff", "#ff9f43", "#00d9ff", "#ff6b9d"];

export function CustomPieChart({ data, title, height = 300, innerRadius = 60, outerRadius = 100 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container p-4">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-primary glow-text">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs>
            {data.map((_, index) => (
              <linearGradient key={index} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={defaultColors[index % defaultColors.length]} stopOpacity={1} />
                <stop offset="100%" stopColor={defaultColors[index % defaultColors.length]} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="rgba(0, 255, 136, 0.3)"
            strokeWidth={1}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || `url(#pieGradient-${index})`}
                style={{ filter: "drop-shadow(0 0 8px rgba(0, 255, 136, 0.3))" }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 25, 18, 0.95)",
              border: "1px solid rgba(0, 255, 136, 0.3)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
            labelStyle={{ color: "#00ff88", fontWeight: "bold" }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name
            ]}
          />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => <span style={{ color: "#e0f2e9", fontSize: "12px" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
