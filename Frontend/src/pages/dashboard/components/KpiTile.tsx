import React from "react";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaKind?: "up" | "flat";
  spark?: number[];        // 0..1 heights
  empty?: boolean;
  emptyText?: string;
}

const KpiTile: React.FC<Props> = ({ label, value, delta, deltaKind = "flat", spark, empty, emptyText }) => {
  if (empty) {
    return (
      <div className="ds-kpi">
        <div className="label">{label}</div>
        <div className="val" style={{ color: "var(--muted)" }}>—</div>
        <div className="delta flat">{emptyText ?? "No data yet"}</div>
      </div>
    );
  }
  return (
    <div className="ds-kpi">
      <div className="label">{label}</div>
      <div className="val">{value}</div>
      {delta && <div className={`delta ${deltaKind}`}>{delta}</div>}
      {spark && spark.length > 0 && (
        <div className="spark">
          {spark.map((h, i) => (
            <i key={i} style={{ height: `${Math.max(4, Math.round(h * 100))}%` }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default KpiTile;
