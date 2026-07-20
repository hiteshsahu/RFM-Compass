import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { GraphSummary } from "../api";
import { monoFont } from "../theme";

/**
 * The compass rose: tables arranged radially around a hub, foreign-key edges
 * as chords, and a bearing needle pointing at the table the current query
 * predicts FOR — the visualization encodes what you're navigating toward.
 */
export function Compass({
  graph,
  targetTable,
  onSelect,
}: {
  graph: GraphSummary | null;
  targetTable: string | null;
  onSelect: (table: string) => void;
}) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 118;

  if (!graph) {
    return (
      <Paper
        aria-label="Schema compass loading"
        sx={{ aspectRatio: "1", display: "grid", placeItems: "center", borderRadius: "50%", borderStyle: "dashed" }}
      >
        <Typography color="text.secondary" sx={{ fontFamily: monoFont }}>
          calibrating…
        </Typography>
      </Paper>
    );
  }

  const nodes = graph.nodes.map((node, i) => {
    const angle = (i / graph.nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { ...node, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle };
  });
  const byName = new Map(nodes.map((n) => [n.name, n]));
  const target = targetTable ? byName.get(targetTable) : null;

  return (
    <svg
      className="compass"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Schema compass: ${nodes.map((n) => n.name).join(", ")}`}
    >
      {/* Bezel rings */}
      <circle cx={cx} cy={cy} r={radius + 34} className="ring ring--outer" />
      <circle cx={cx} cy={cy} r={radius} className="ring" />
      {/* Tick marks every 15 degrees */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * 2 * Math.PI;
        const r1 = radius + 28;
        const r2 = i % 6 === 0 ? radius + 18 : radius + 24;
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(a)}
            y1={cy + r1 * Math.sin(a)}
            x2={cx + r2 * Math.cos(a)}
            y2={cy + r2 * Math.sin(a)}
            className="tick"
          />
        );
      })}
      {/* FK edges as chords */}
      {graph.edges.map((e, i) => {
        const s = e.src ? byName.get(e.src) : undefined;
        const d = e.dst ? byName.get(e.dst) : undefined;
        if (!s || !d) return null;
        return (
          <g key={i}>
            <line x1={s.x} y1={s.y} x2={d.x} y2={d.y} className="edge" />
            <text x={(s.x + d.x) / 2} y={(s.y + d.y) / 2 - 6} className="edge-label mono">
              {e.fkey}
            </text>
          </g>
        );
      })}
      {/* Bearing needle */}
      {target && (
        <line
          x1={cx}
          y1={cy}
          x2={cx + (radius - 30) * Math.cos(target.angle)}
          y2={cy + (radius - 30) * Math.sin(target.angle)}
          className="needle"
        />
      )}
      <circle cx={cx} cy={cy} r={5} className="hub" />
      {/* Table nodes */}
      {nodes.map((n) => (
        <g
          key={n.name}
          className={`table-node ${n.name === targetTable ? "table-node--target" : ""}`}
          onClick={() => onSelect(n.name)}
          tabIndex={0}
          role="button"
          aria-label={`Table ${n.name}, ${n.rows.toLocaleString()} rows`}
          onKeyDown={(ev) => ev.key === "Enter" && onSelect(n.name)}
        >
          <circle cx={n.x} cy={n.y} r={26} />
          <text x={n.x} y={n.y - 2} className="table-name">
            {n.name}
          </text>
          <text x={n.x} y={n.y + 12} className="table-rows mono">
            {n.rows.toLocaleString()}
          </text>
        </g>
      ))}
    </svg>
  );
}
