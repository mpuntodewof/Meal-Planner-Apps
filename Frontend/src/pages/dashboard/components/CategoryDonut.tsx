import React from "react";
import { NameCount } from "../../../interfaces/dashboardModel";
import EmptyState from "./EmptyState";

const COLORS = ["var(--s3)", "var(--s2)", "var(--s1)", "var(--s5)", "var(--s6)", "var(--s4)"];

const CategoryDonut: React.FC<{ data: NameCount[] }> = ({ data }) => {
  if (!data.length) return <EmptyState message="No categories yet — plan some recipes." />;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const cx = 110, cy = 110, r = 78, rin = 48;
  let a0 = -Math.PI / 2;
  const arcs = data.map((d, idx) => {
    const frac = d.count / total, a1 = a0 + frac * Math.PI * 2, gap = 0.03;
    const s = a0 + gap / 2, e = a1 - gap / 2;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const xi1 = cx + rin * Math.cos(e), yi1 = cy + rin * Math.sin(e);
    const xi2 = cx + rin * Math.cos(s), yi2 = cy + rin * Math.sin(s);
    const large = e - s > Math.PI ? 1 : 0;
    a0 = a1;
    return <path key={idx} d={`M${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}L${xi1} ${yi1}A${rin} ${rin} 0 ${large} 0 ${xi2} ${yi2}Z`} fill={COLORS[idx % COLORS.length]} />;
  });
  const top = data[0];
  return (
    <svg className="chart" viewBox="0 0 220 220" role="img" aria-label="Recipe category mix">
      {arcs}
      <text x={cx} y={cy} textAnchor="middle" className="value-lg" fontSize="20" fill="var(--ink)">{top.name}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" className="axis-label" fontSize="12">{Math.round((top.count / total) * 100)}% · top</text>
    </svg>
  );
};

export default CategoryDonut;
