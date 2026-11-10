// Small dependency-free charts (inline SVG / CSS) used by the Admin Dashboard.
// They scale to their container width, so they stay responsive.

const compact = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${n}`;
};

const W = 600;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 32, left: 16 };

// Vertical bar chart: data = [{ label, value }]
export function BarChart({ data, color = "var(--primary)", money = false }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (max === 0) return <div className="chart-empty">No data yet</div>;

  const slot = (W - PAD.left - PAD.right) / data.length;
  const barW = slot * 0.55;
  const plotH = H - PAD.top - PAD.bottom;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} style={{ stroke: "var(--border)", strokeWidth: 2 }} />
      {data.map((d, i) => {
        const h = (d.value / max) * plotH;
        const x = PAD.left + slot * i + (slot - barW) / 2;
        const y = H - PAD.bottom - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="8" style={{ fill: color }} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="15" fontWeight="600">
              {money ? compact(d.value) : d.value}
            </text>
            <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="15">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Line + area chart: data = [{ label, value }]
export function LineChart({ data, color = "var(--secondary)", money = false }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (max === 0) return <div className="chart-empty">No data yet</div>;

  const plotW = W - PAD.left - PAD.right - 30;
  const plotH = H - PAD.top - PAD.bottom;
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    ...d,
    x: PAD.left + 15 + step * i,
    y: H - PAD.bottom - (d.value / max) * plotH,
  }));
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0].x},${H - PAD.bottom} ${line} ${points[points.length - 1].x},${H - PAD.bottom}`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} style={{ stroke: "var(--border)", strokeWidth: 2 }} />
      <polygon points={area} style={{ fill: color, opacity: 0.15 }} />
      <polyline points={line} fill="none" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: color }} />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="6" style={{ fill: "var(--bg-card)", stroke: color, strokeWidth: 3 }} />
          <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="15" fontWeight="600">
            {money ? compact(p.value) : p.value}
          </text>
          <text x={p.x} y={H - 10} textAnchor="middle" fontSize="15">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// Horizontal bars: data = [{ label, value }]
export function HBarChart({ data, color = "var(--primary)" }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (max === 0) return <div className="chart-empty">No data yet</div>;

  return (
    <div>
      {data.map((d) => (
        <div className="hbar-row" key={d.label}>
          <span>{d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <strong>{d.value}</strong>
        </div>
      ))}
    </div>
  );
}
