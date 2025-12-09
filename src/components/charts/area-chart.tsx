"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface AreaChartProps {
  data: DataPoint[];
  dataKeys: { key: string; color: string; name: string }[];
  title?: string;
  height?: number;
}

export function CustomAreaChart({ data, dataKeys, title, height = 300 }: AreaChartProps) {
  return (
    <div className="chart-container p-4">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-primary glow-text">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#6b9b80" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }}
          />
          <YAxis 
            stroke="#6b9b80" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(0, 255, 136, 0.2)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 25, 18, 0.95)",
              border: "1px solid rgba(0, 255, 136, 0.3)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
            labelStyle={{ color: "#00ff88", fontWeight: "bold" }}
            itemStyle={{ color: "#e0f2e9" }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span style={{ color: "#e0f2e9" }}>{value}</span>}
          />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={dk.color}
              strokeWidth={2}
              fill={`url(#gradient-${dk.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
