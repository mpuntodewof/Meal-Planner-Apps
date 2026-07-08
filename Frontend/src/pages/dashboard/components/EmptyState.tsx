import React from "react";

interface Props {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const EmptyState: React.FC<Props> = ({ message, ctaLabel, onCta }) => (
  <div className="ds-empty">
    <p>{message}</p>
    {ctaLabel && (
      <button className="ds-empty-cta" onClick={onCta} type="button">
        {ctaLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
