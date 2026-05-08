import React from 'react';

export function FloodPredictionSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Chart background */}
      <rect x="10" y="10" width="180" height="100" rx="12" className="fill-primary/5" />
      {/* Grid lines */}
      {[30, 50, 70, 90].map(y => (
        <line key={y} x1="30" y1={y} x2="180" y2={y} className="stroke-border" strokeWidth="0.5" strokeDasharray="4 3" />
      ))}
      {/* Rising wave area */}
      <path d="M30 90 Q55 85 70 70 Q85 55 100 60 Q115 65 130 45 Q145 25 160 30 Q175 35 180 20" className="stroke-primary" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M30 90 Q55 85 70 70 Q85 55 100 60 Q115 65 130 45 Q145 25 160 30 Q175 35 180 20 V100 H30 Z" className="fill-primary/10" />
      {/* Data points */}
      {[[70, 70], [100, 60], [130, 45], [160, 30]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" className="fill-primary" />
      ))}
      {/* Warning threshold line */}
      <line x1="30" y1="50" x2="180" y2="50" className="stroke-warning" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="32" y="47" className="fill-warning" fontSize="7" fontWeight="600">CẢNH BÁO</text>
      {/* Prediction zone */}
      <rect x="140" y="15" width="45" height="90" rx="4" className="fill-primary/5 stroke-primary/20" strokeWidth="1" strokeDasharray="3 2" />
      <text x="148" y="107" className="fill-primary" fontSize="6" fontWeight="700">DỰ BÁO</text>
    </svg>
  );
}

export function RealtimeMapSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Map background */}
      <rect x="5" y="5" width="190" height="110" rx="12" className="fill-emerald-500/5" />
      {/* Roads */}
      <path d="M20 60 H180" className="stroke-border" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 15 V105" className="stroke-border" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 20 L140 100" className="stroke-border" strokeWidth="2" strokeLinecap="round" />
      {/* River */}
      <path d="M15 30 Q50 35 70 50 Q90 65 120 60 Q150 55 185 70" className="stroke-blue-400" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
      <path d="M15 30 Q50 35 70 50 Q90 65 120 60 Q150 55 185 70" className="stroke-blue-500" strokeWidth="2" strokeLinecap="round" />
      {/* Flood zone */}
      <ellipse cx="90" cy="55" rx="30" ry="18" className="fill-red-500/15 stroke-red-400/40" strokeWidth="1" strokeDasharray="4 3" />
      {/* Map pins */}
      {[[45, 42], [130, 75], [155, 35]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" className={i === 0 ? 'fill-red-500' : 'fill-emerald-500'} />
          <circle cx={x} cy={y} r="3" className="fill-white" />
          <circle cx={x} cy={y} r="10" className={i === 0 ? 'fill-red-500/20' : 'fill-emerald-500/20'}>
            <animate attributeName="r" from="8" to="16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

export function EvacuationRouteSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="190" height="110" rx="12" className="fill-purple-500/5" />
      {/* Danger zone */}
      <circle cx="40" cy="60" r="25" className="fill-red-500/10 stroke-red-400/30" strokeWidth="1" strokeDasharray="4 3" />
      <text x="28" y="63" className="fill-red-500" fontSize="8" fontWeight="700">NGẬP</text>
      {/* Safe zone */}
      <rect x="145" y="30" width="40" height="60" rx="8" className="fill-emerald-500/10 stroke-emerald-400/30" strokeWidth="1" />
      <text x="149" y="64" className="fill-emerald-600" fontSize="7" fontWeight="700">AN TOÀN</text>
      {/* Route path with animation */}
      <path d="M65 60 Q80 45 100 42 Q120 39 135 45 Q145 48 150 55" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 4">
        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />
      </path>
      {/* Arrow at end */}
      <polygon points="150,55 143,49 143,61" className="fill-primary" />
      {/* People dots */}
      {[[50, 50], [55, 68], [42, 72]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" className="fill-foreground/60" />
      ))}
    </svg>
  );
}

export function EarlyWarningSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="190" height="110" rx="12" className="fill-orange-500/5" />
      {/* Bell */}
      <path d="M100 30 C80 30 70 45 70 60 L65 75 H135 L130 60 C130 45 120 30 100 30 Z" className="fill-orange-500/20 stroke-orange-500" strokeWidth="2" />
      <rect x="93" y="75" width="14" height="6" rx="3" className="fill-orange-500" />
      <circle cx="100" cy="25" r="3" className="fill-orange-500" />
      {/* Signal rings */}
      {[20, 30, 40].map((r, i) => (
        <g key={i}>
          <path d={`M${55 - i * 8} ${50 - i * 5} A${r} ${r} 0 0 1 ${55 - i * 8} ${70 + i * 5}`} className="stroke-orange-400" strokeWidth="2" fill="none" opacity={0.6 - i * 0.15}>
            <animate attributeName="opacity" from={0.6 - i * 0.15} to="0" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </path>
          <path d={`M${145 + i * 8} ${50 - i * 5} A${r} ${r} 0 0 0 ${145 + i * 8} ${70 + i * 5}`} className="stroke-orange-400" strokeWidth="2" fill="none" opacity={0.6 - i * 0.15}>
            <animate attributeName="opacity" from={0.6 - i * 0.15} to="0" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </path>
        </g>
      ))}
      {/* Phone notifications */}
      <rect x="25" y="85" width="24" height="22" rx="4" className="fill-card stroke-border" strokeWidth="1" />
      <rect x="28" y="89" width="18" height="3" rx="1" className="fill-orange-500/50" />
      <rect x="28" y="94" width="12" height="2" rx="1" className="fill-border" />
      <rect x="160" y="85" width="24" height="22" rx="4" className="fill-card stroke-border" strokeWidth="1" />
      <rect x="163" y="89" width="18" height="3" rx="1" className="fill-orange-500/50" />
      <rect x="163" y="94" width="12" height="2" rx="1" className="fill-border" />
    </svg>
  );
}

export function ReliefDistributionSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="190" height="110" rx="12" className="fill-indigo-500/5" />
      {/* Central hub */}
      <circle cx="100" cy="55" r="18" className="fill-primary/15 stroke-primary" strokeWidth="2" />
      <text x="90" y="58" className="fill-primary" fontSize="8" fontWeight="700">HUB</text>
      {/* Distribution lines + endpoints */}
      {[
        { x: 40, y: 30, label: 'A' },
        { x: 160, y: 30, label: 'B' },
        { x: 40, y: 85, label: 'C' },
        { x: 160, y: 85, label: 'D' },
      ].map((point, i) => (
        <g key={i}>
          <line x1="100" y1="55" x2={point.x} y2={point.y} className="stroke-primary/30" strokeWidth="1.5" strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
          </line>
          <rect x={point.x - 14} y={point.y - 10} width="28" height="20" rx="6" className="fill-card stroke-border" strokeWidth="1" />
          <text x={point.x - 4} y={point.y + 4} className="fill-foreground" fontSize="9" fontWeight="700">{point.label}</text>
        </g>
      ))}
      {/* Supply icons */}
      <rect x="88" y="80" width="10" height="12" rx="2" className="fill-emerald-500/30 stroke-emerald-500" strokeWidth="1" />
      <rect x="102" y="80" width="10" height="12" rx="2" className="fill-blue-500/30 stroke-blue-500" strokeWidth="1" />
    </svg>
  );
}

export function AnalyticsDashboardSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="190" height="110" rx="12" className="fill-rose-500/5" />
      {/* Dashboard frame */}
      <rect x="15" y="15" width="170" height="90" rx="8" className="fill-card stroke-border" strokeWidth="1" />
      {/* Top bar */}
      <rect x="15" y="15" width="170" height="16" rx="8" className="fill-muted" />
      <circle cx="28" cy="23" r="3" className="fill-red-400" />
      <circle cx="38" cy="23" r="3" className="fill-amber-400" />
      <circle cx="48" cy="23" r="3" className="fill-emerald-400" />
      {/* Bar chart */}
      {[
        { x: 30, h: 35, color: 'fill-primary/60' },
        { x: 48, h: 50, color: 'fill-primary/80' },
        { x: 66, h: 25, color: 'fill-primary/40' },
        { x: 84, h: 60, color: 'fill-primary' },
        { x: 102, h: 40, color: 'fill-primary/70' },
      ].map((bar, i) => (
        <rect key={i} x={bar.x} y={95 - bar.h} width="12" height={bar.h} rx="3" className={bar.color} />
      ))}
      {/* Mini pie chart */}
      <circle cx="150" cy="55" r="18" className="fill-muted" />
      <path d="M150 37 A18 18 0 0 1 168 55 L150 55 Z" className="fill-primary" />
      <path d="M168 55 A18 18 0 0 1 150 73 L150 55 Z" className="fill-emerald-500" />
      <path d="M150 73 A18 18 0 0 1 132 55 L150 55 Z" className="fill-amber-500" />
      {/* KPI cards */}
      <rect x="130" y="78" width="45" height="18" rx="4" className="fill-muted" />
      <rect x="133" y="82" width="20" height="3" rx="1" className="fill-emerald-500/50" />
      <rect x="133" y="88" width="30" height="2" rx="1" className="fill-border" />
    </svg>
  );
}
