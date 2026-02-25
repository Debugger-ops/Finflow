'use client';
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function AssetAllocationChart({ data }: { data: any[] }) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  return (
    <PieChart width={400} height={300}>
      <Pie dataKey="value" data={data} cx="50%" cy="50%" outerRadius={80} label>
        {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
