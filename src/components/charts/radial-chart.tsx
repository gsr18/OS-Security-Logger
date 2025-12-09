"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DataPoint {
  name: string;
  value: number;
  fill: string;
}

interface RadialChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

export function CustomRadialChart({ data, title, height = 300 }: RadialChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartData = data.map(d => ({
    ...d,
    fullMark: maxValue,
  }));

  return (
    <div className="chart-container p-4">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-primary glow-text">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="20%" 
          outerRadius="90%" 
          data={chartData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "rgba(0, 255, 136, 0.05)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 25, 18, 0.95)",
              border: "1px solid rgba(0, 255, 136, 0.3)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
            labelStyle={{ color: "#00ff88", fontWeight: "bold" }}
          />
          <Legend 
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value) => <span style={{ color: "#e0f2e9", fontSize: "12px" }}>{value}</span>}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
