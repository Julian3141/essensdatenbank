export default function CircleProgress({ value, goal, label, unit, color = '#22c55e', size = 56 }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const offset = circumference * (1 - pct)
  const over = goal > 0 && value > goal
  const strokeColor = over ? '#ef4444' : color

  function fmt(v) {
    if (unit === 'kcal') return `${Math.round(v)}`
    if (unit === 'mg') return `${Math.round(v)}`
    if (unit === 'µg') return `${v.toFixed(1)}`
    return `${v.toFixed(1)}`
  }

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 44 44">
          {/* Hintergrundkreis */}
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          {/* Fortschrittskreis */}
          <circle
            cx="22" cy="22" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Wert in der Mitte */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold leading-none" style={{ color: strokeColor }}>
            {fmt(value)}
          </span>
          {goal > 0 && (
            <span className="text-[8px] text-gray-400 leading-none mt-0.5">/{fmt(goal)}</span>
          )}
        </div>
      </div>
      <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full text-center">{label}</span>
    </div>
  )
}
