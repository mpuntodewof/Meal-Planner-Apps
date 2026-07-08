import React from "react";
import { WeeklyPoint } from "../../../interfaces/dashboardModel";
import EmptyState from "./EmptyState";

const COLORS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s6)"];
const KEYS: (keyof WeeklyPoint)[] = ["breakfast", "lunch", "dinner", "snack"];

const StackedWeeklyChart: React.FC<{ weekly: WeeklyPoint[] }> = ({ weekly }) => {
  if (!weekly.length || weekly.every((w) => w.totalMeals === 0)) {
    return <EmptyState message="Plan meals across a few weeks to see your rhythm here." />;
  }
  const W = 620, H = 240, padL = 34, padB = 28, padT = 10, padR = 10;
  const max = Math.max(6, ...weekly.map((w) => w.totalMeals));
  const bw = (W - padL - padR) / weekly.length;
  // Cap the bar width so a single populated week reads as a slim column rather
  // than a chunky square block. Bars stay centered in their weekly slot.
  const bwidth = Math.min(bw * 0.56, 38);
  const ph = H - padB - padT;
  const ticks = [0, 1, 2, 3].map((g) => ({ y: padT + ph - (ph * g) / 3, v: Math.round((max * g) / 3) }));

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Meals planned per week by slot">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="var(--grid)" />
          <text x={padL - 6} y={t.y + 3} textAnchor="end" className="axis-label">{t.v}</text>
        </g>
      ))}
      {weekly.map((w, i) => {
        const x = padL + i * bw + (bw - bwidth) / 2; // center the bar in its slot
        let y0 = padT + ph;
        const vals = KEYS.map((k) => w[k] as number);
        return (
          <g key={i}>
            {vals.map((v, si) => {
              const h = (v / max) * ph;
              if (h <= 0) return null;
              y0 -= h;
              const rect = <rect key={si} x={x} y={y0} width={bwidth} height={Math.max(h - 2, 1)} fill={COLORS[si]} rx={3} />;
              y0 -= 2;
              return rect;
            })}
            <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="axis-label">{w.weekLabel}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default StackedWeeklyChart;
