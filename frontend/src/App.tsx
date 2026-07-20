import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { api, EvaluateResponse, GraphSummary, PredictResponse } from "./api";
import { Compass } from "./components/Compass";
import { QueryDeck } from "./components/QueryDeck";
import { ResultsPanel } from "./components/ResultsPanel";
import { monoFont } from "./theme";

/** Extract the entity table from "... FOR [EACH] <table>.<col> ..." */
function targetTableOf(query: string): string | null {
  const m = query.match(/FOR\s+(?:EACH\s+)?([A-Za-z_][A-Za-z0-9_]*)\./i);
  return m ? m[1] : null;
}

export default function App() {
  const [graph, setGraph] = useState<GraphSummary | null>(null);
  const [keyConfigured, setKeyConfigured] = useState(true);
  const [kumoVersion, setKumoVersion] = useState<string | null>(null);
  const [query, setQuery] = useState(
    "PREDICT COUNT(orders.*, 0, 90, days)=0 FOR users.user_id IN (1, 2, 3)"
  );
  const [explain, setExplain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.health()
      .then((h) => {
        setKeyConfigured(h.api_key_configured);
        setKumoVersion(h.kumo_version);
      })
      .catch(() => {});
    api.graph().then(setGraph).catch((e) => setError(String(e.message ?? e)));
  }, []);

  const targetTable = useMemo(() => targetTableOf(query), [query]);

  async function run(kind: "predict" | "evaluate") {
    setBusy(true);
    setError(null);
    setPrediction(null);
    setEvaluation(null);
    try {
      if (kind === "predict") setPrediction(await api.predict(query, null, explain));
      else setEvaluation(await api.evaluate(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 5 }, pb: 6 }}>
      <Box component="header" sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase", mb: 0.5 }}
        >
          RFM <Box component="span" sx={{ color: "primary.main" }}>Compass</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "56ch" }}>
          Navigate a relational schema, ask a predictive question, see what the foundation model
          answers — and how fast.
        </Typography>
      </Box>

      {!keyConfigured && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderColor: "primary.main" }}>
          No <Box component="span" sx={{ fontFamily: monoFont }}>KUMO_API_KEY</Box> configured —
          schema navigation works, but predictions need a free key from kumorfm.ai in{" "}
          <Box component="span" sx={{ fontFamily: monoFont }}>.env</Box>.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "380px 1fr" },
          gap: 3.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: "0.14em", display: "block", mb: 1.25 }}
          >
            Inferred schema
          </Typography>
          <Compass
            graph={graph}
            targetTable={targetTable}
            onSelect={(t) => {
              const node = graph?.nodes.find((n) => n.name === t);
              if (node?.primary_key) {
                setQuery(`PREDICT COUNT(orders.*, 0, 90, days)=0 FOR ${t}.${node.primary_key} IN (1, 2, 3)`);
              }
            }}
          />
          {graph && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {graph.nodes.length} tables · {graph.edges.length} inferred links. Click a table to
              aim a query at it.
            </Typography>
          )}
        </Box>
        <Stack sx={{ minWidth: 0 }} spacing={2.5}>
          <QueryDeck
            query={query}
            setQuery={setQuery}
            explain={explain}
            setExplain={setExplain}
            busy={busy}
            onPredict={() => run("predict")}
            onEvaluate={() => run("evaluate")}
            kumoVersion={kumoVersion}
          />
          <ResultsPanel prediction={prediction} evaluation={evaluation} error={error} />
        </Stack>
      </Box>

      <Box component="footer" sx={{ mt: 4 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Latency shown is client-observed end-to-end (network + sampling + inference), measured
          per request.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Built on the KumoRFM SDK.
        </Typography>
      </Box>
    </Container>
  );
}
