interface DonutChartProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function DonutChart({
  percentage,
  color,
  size = 80,
  strokeWidth = 8,
  label,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(Math.max(percentage, 0), 100);
  const strokeDasharray = `${(filled / 100) * circumference} ${circumference}`;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
        role="img"
        aria-label={`${Math.round(filled)}% completion`}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#e9e4f5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.18}
          fontWeight="700"
          fill="#3d3560"
          fontFamily="Figtree, system-ui, sans-serif"
        >
          {Math.round(filled)}%
        </text>
      </svg>
      {label && (
        <span className="text-xs font-medium text-muted-foreground text-center max-w-[80px] truncate">
          {label}
        </span>
      )}
    </div>
  );
}
