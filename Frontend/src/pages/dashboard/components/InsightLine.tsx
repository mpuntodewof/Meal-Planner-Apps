import React from "react";

interface Props {
  text: string;
}

// Renders the server-computed headline sentence. Renders nothing when empty
// (empty-data users get the empty state instead).
const InsightLine: React.FC<Props> = ({ text }) => {
  if (!text) return null;
  return <div className="ds-insight">{text}</div>;
};

export default InsightLine;
