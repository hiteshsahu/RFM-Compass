import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { EvaluateResponse, PredictResponse } from "../api";
import { monoFont } from "../theme";

function Readout({ latencyMs, runMode }: { latencyMs: number; runMode: string }) {
  return (
    <Box
      aria-label="Latency readout"
      sx={{ display: "flex", alignItems: "baseline", gap: 0.5, fontFamily: monoFont }}
    >
      <Typography component="span" sx={{ color: "primary.main", fontSize: "1.3rem", fontWeight: 500 }}>
        {latencyMs.toLocaleString()}
      </Typography>
      <Typography component="span" sx={{ color: "primary.main", fontSize: "0.8rem" }}>
        ms
      </Typography>
      <Typography component="span" color="text.secondary" sx={{ fontSize: "0.75rem", ml: 1 }}>
        end-to-end · run_mode={runMode}
      </Typography>
    </Box>
  );
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <Typography color="text.secondary">No rows returned.</Typography>;
  const cols = Object.keys(rows[0]);
  return (
    <Box sx={{ mt: 1 }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ fontFamily: monoFont }}>
          <TableHead>
            <TableRow>
              {cols.map((c) => (
                <TableCell key={c} sx={{ fontFamily: monoFont, color: "text.secondary" }}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 50).map((row, i) => (
              <TableRow key={i}>
                {cols.map((c) => (
                  <TableCell key={c} sx={{ fontFamily: monoFont }}>
                    {formatCell(row[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > 50 && (
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Showing 50 of {rows.length} rows.
        </Typography>
      )}
    </Box>
  );
}

function formatCell(v: unknown): string {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(4);
  if (Array.isArray(v)) return v.join(", ");
  return String(v ?? "");
}

export function ResultsPanel({
  prediction,
  evaluation,
  error,
}: {
  prediction: PredictResponse | null;
  evaluation: EvaluateResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <Paper component="section" sx={{ p: 2.25, borderColor: "error.main" }} role="alert">
        <Typography
          variant="overline"
          color="error"
          sx={{ fontWeight: 700, letterSpacing: "0.14em", display: "block", mb: 1 }}
        >
          Run failed
        </Typography>
        <Alert severity="error" variant="outlined" sx={{ fontFamily: monoFont }}>
          {error}
        </Alert>
      </Paper>
    );
  }
  if (!prediction && !evaluation) {
    return (
      <Paper component="section" sx={{ p: 2.25 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: "0.14em", display: "block", mb: 1 }}
        >
          Results
        </Typography>
        <Typography color="text.secondary">
          Pick a template or write a PQL query, then run a prediction. The needle points at the
          table you're predicting for.
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper component="section" aria-live="polite" sx={{ p: 2.25 }}>
      {prediction && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 1.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.14em" }}>
              Prediction
            </Typography>
            <Readout latencyMs={prediction.latency_ms} runMode={prediction.run_mode} />
          </Box>
          <DataTable rows={prediction.rows} />
          {prediction.explanation && (
            <Accordion defaultExpanded sx={{ mt: 1.75, background: "transparent", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.14em" }}>
                  Why the model thinks so
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography component="pre" color="text.secondary" sx={{ fontFamily: monoFont, fontSize: "0.82rem", whiteSpace: "pre-wrap", m: 0 }}>
                  {prediction.explanation}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
      {evaluation && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 1.5, mt: prediction ? 2.5 : 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.14em" }}>
              Holdout evaluation
            </Typography>
            <Readout latencyMs={evaluation.latency_ms} runMode={evaluation.run_mode} />
          </Box>
          <DataTable rows={evaluation.metrics} />
        </>
      )}
    </Paper>
  );
}
