export type Status = "live" | "testing" | "soon" | "research";

const config: Record<Status, { label: string; dot: string }> = {
  live: { label: "Available now", dot: "bg-white" },
  testing: { label: "In testing", dot: "bg-white/50" },
  soon: { label: "Coming soon", dot: "border border-white/40" },
  research: {
    label: "Researching",
    dot: "border border-dashed border-white/30",
  },
};

export const StatusLabel = ({
  status,
  label,
  className = "",
}: {
  status: Status;
  label?: string;
  className?: string;
}) => {
  const cfg = config[status];
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {label ?? cfg.label}
    </span>
  );
};
