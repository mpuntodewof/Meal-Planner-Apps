import React from "react";

export type TabKey = "overview" | "profile" | "recipes" | "favorites" | "security";

export interface TabDef {
  key: TabKey;
  label: string;
}

interface Props {
  tabs: TabDef[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}

// Accessible design-system tab bar. All classes are namespaced ds-* so Bootstrap
// cannot restyle them (same collision-avoidance the dashboard already relies on).
const DashboardTabs: React.FC<Props> = ({ tabs, active, onChange }) => {
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (idx + dir + tabs.length) % tabs.length;
    onChange(tabs[next].key);
  };

  return (
    <div className="ds-tabs scroll-x" role="tablist" aria-label="Dashboard sections">
      {tabs.map((t, idx) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={active === t.key}
          tabIndex={active === t.key ? 0 : -1}
          className={`ds-tab ${active === t.key ? "is-active" : ""}`}
          onClick={() => onChange(t.key)}
          onKeyDown={(e) => onKeyDown(e, idx)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;
