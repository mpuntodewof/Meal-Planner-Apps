import React from "react";
import { NameCount } from "../../../interfaces/dashboardModel";
import EmptyState from "./EmptyState";

const TopRecipesBar: React.FC<{ data: NameCount[] }> = ({ data }) => {
  if (!data.length) return <EmptyState message="Plan recipes to see your most-planned dishes." />;
  const W = 480, padL = 110, padR = 30, rowH = 28, top = 8;
  const max = Math.max(2, ...data.map((d) => d.count));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Math.max(120, top + data.length * rowH)}`} role="img" aria-label="Most planned recipes">
      {data.map((d, i) => {
        const y = top + i * rowH;
        const w = (d.count / max) * (W - padL - padR);
        return (
          <g key={i}>
            <text x={padL - 10} y={y + 13} textAnchor="end" className="axis-label">{d.name}</text>
            <rect x={padL} y={y} height={18} width={Math.max(w, 2)} rx={4} fill={i === 0 ? "var(--s3)" : "var(--s1)"} opacity={i === 0 ? 1 : 0.82} />
            <text x={padL + w + 7} y={y + 13} className="bar-label">{d.count}×</text>
          </g>
        );
      })}
    </svg>
  );
};

export default TopRecipesBar;
