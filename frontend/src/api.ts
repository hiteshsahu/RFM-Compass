export type GraphNode = {
  name: string;
  rows: number;
  primary_key: string | null;
  time_column: string | null;
  columns: string[];
};

export type GraphEdge = { src?: string; dst?: string; fkey?: string; raw?: string };

export type GraphSummary = { nodes: GraphNode[]; edges: GraphEdge[] };

export type PredictResponse = {
  rows: Record<string, unknown>[];
  explanation: string | null;
  latency_ms: number;
  run_mode: string;
};

export type EvaluateResponse = {
  metrics: Record<string, unknown>[];
  latency_ms: number;
  run_mode: string;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    fetch("/api/health").then((r) =>
      json<{ status: string; api_key_configured: boolean; kumo_version: string }>(r)
    ),
  graph: () => fetch("/api/graph").then((r) => json<GraphSummary>(r)),
  predict: (query: string, indices: (number | string)[] | null, explain: boolean) =>
    fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, indices, explain }),
    }).then((r) => json<PredictResponse>(r)),
  evaluate: (query: string) =>
    fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }).then((r) => json<EvaluateResponse>(r)),
};
