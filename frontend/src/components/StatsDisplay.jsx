/**
 * StatsDisplay renders the statistics returned by the Node.js API for a single matrix.
 *
 * @param {{ label: string, stats: { max: number, min: number, average: number, sum: number, isDiagonal: boolean } }} props
 */
export default function StatsDisplay({ label, stats }) {
  if (!stats) return null;

  const rows = [
    { key: 'Maximum', value: formatVal(stats.max) },
    { key: 'Minimum', value: formatVal(stats.min) },
    { key: 'Average', value: formatVal(stats.average) },
    { key: 'Sum', value: formatVal(stats.sum) },
  ];

  return (
    <div>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>
        <span className="badge badge-blue" style={{ marginRight: 8, fontSize: 13 }}>{label}</span>
        Statistics
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map(({ key, value }) => (
          <div key={key} style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{key}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{value}</span>
          </div>
        ))}
        <div style={rowStyle}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Diagonal</span>
          <span className={`badge ${stats.isDiagonal ? 'badge-green' : 'badge-red'}`}>
            {stats.isDiagonal ? 'yes' : 'no'}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatVal(v) {
  if (v === undefined || v === null) return '—';
  if (Math.abs(v) < 1e-10) return '0';
  const abs = Math.abs(v);
  if (abs >= 0.001 && abs < 1e9) return parseFloat(v.toPrecision(8)).toString();
  return v.toExponential(4);
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
};
