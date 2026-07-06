import React from "react";
import { WeeklyPoint } from "../../../interfaces/dashboardModel";
import EmptyState from "./EmptyState";

const NutritionTrendLine: React.FC<{ weekly: WeeklyPoint[] }> = ({ weekly }) => {
  const known = weekly
    .map((w, i) => ({ i, v: w.avgCalories, label: w.weekLabel }))
    .filter((p) => p.v !== null) as { i: number; v: number; label: string }[];
  if (known.length < 2) {
    return <EmptyState message="Not enough analyzed recipes yet. Nutrition appears once planned recipes have AI estimates." />;
  }
  const W = 480, H = 200, padL = 42, padR = 16, padT = 14, padB = 28;
  const vs = known.map((p) => p.v);
  const min = Math.min(...vs) - 40, max = Math.max(...vs) + 40;
  const pw = W - padL - padR, ph = H - padT - padB;
  const X = (i: number) => padL + (i * pw) / (weekly.length - 1);
  const Y = (v: number) => padT + ph - ((v - min) / (max - min)) * ph;
  const d = known.map((p, idx) => `${idx === 0 ? "M" : "L"}${X(p.i)} ${Y(p.v)}`).join(" ");
  const ticks = [0, 1, 2, 3].map((g) => ({ y: padT + ph - (ph * g) / 3, v: Math.round(min + ((max - min) * g) / 3) }));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average planned calories per week">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="var(--grid)" />
          <text x={padL - 8} y={t.y + 3} textAnchor="end" className="axis-label">{t.v}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--s1)" strokeWidth={2.5} strokeLinejoin="round" />
      {known.map((p, i) => (
        <circle key={i} cx={X(p.i)} cy={Y(p.v)} r={4} fill="var(--surface)" stroke="var(--s1)" strokeWidth={2.5} />
      ))}
      {weekly.map((w, i) => (
        <text key={i} x={X(i)} y={H - 8} textAnchor="middle" className="axis-label">{w.weekLabel}</text>
      ))}
    </svg>
  );
};

export default NutritionTrendLine;
