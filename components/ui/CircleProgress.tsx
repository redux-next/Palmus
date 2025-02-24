interface CircleProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircleProgress = ({
  progress,
  size = 40,
  strokeWidth = 2,
  className = "",
}: CircleProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="absolute rotate-[-90deg]" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="stroke-border"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="stroke-primary transition-all duration-200"
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
};
