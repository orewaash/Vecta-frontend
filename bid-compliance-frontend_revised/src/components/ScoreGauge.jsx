import React from 'react';

const RISK_COLOR = {
  Low: 'var(--color-pass)',
  Medium: 'var(--color-review)',
  High: 'var(--color-fail)',
};

export default function ScoreGauge({ score, riskLevel, size = 72 }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = RISK_COLOR[riskLevel] || 'var(--color-ink-muted)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-semibold text-ink" style={{ fontSize: size * 0.24 }}>
          {score}
        </span>
      </div>
    </div>
  );
}
