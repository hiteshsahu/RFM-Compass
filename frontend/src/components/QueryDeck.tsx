import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";
import { monoFont } from "../theme";

const TEMPLATES: { label: string; query: string; hint: string }[] = [
  {
    label: "Churn",
    query: "PREDICT COUNT(orders.*, 0, 90, days)=0 FOR users.user_id IN (1, 2, 3)",
    hint: "Will these users place zero orders in the next 90 days?",
  },
  {
    label: "Demand",
    query: "PREDICT SUM(orders.price, 0, 30, days) FOR items.item_id IN (1, 2, 3)",
    hint: "Revenue per item over the next 30 days.",
  },
  {
    label: "Recommend",
    query: "PREDICT LIST_DISTINCT(orders.item_id, 0, 30, days) RANK TOP 10 FOR users.user_id=1",
    hint: "Top 10 items this user is most likely to order next.",
  },
];

export function QueryDeck({
  query,
  setQuery,
  explain,
  setExplain,
  busy,
  onPredict,
  onEvaluate,
  kumoVersion,
}: {
  query: string;
  setQuery: (q: string) => void;
  explain: boolean;
  setExplain: (v: boolean) => void;
  busy: boolean;
  onPredict: () => void;
  onEvaluate: () => void;
  kumoVersion?: string | null;
}) {
  return (
    <Paper component="section" aria-label="Predictive query" sx={{ p: 2.25 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: "0.14em" }}
        >
          Predictive query
        </Typography>
        {kumoVersion && (
          <Chip
            size="small"
            variant="outlined"
            color="secondary"
            label={`kumoai v${kumoVersion}`}
            sx={{ fontFamily: monoFont, fontWeight: 400 }}
          />
        )}
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1.5 }}>
        {TEMPLATES.map((t) => (
          <Chip
            key={t.label}
            label={t.label}
            title={t.hint}
            onClick={() => setQuery(t.query)}
            disabled={busy}
            variant="outlined"
            color="secondary"
            clickable
          />
        ))}
      </Stack>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        multiline
        minRows={3}
        fullWidth
        spellCheck={false}
        aria-label="PQL query editor"
        slotProps={{ htmlInput: { style: { fontFamily: monoFont, fontSize: "0.88rem" } } }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1.5,
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={explain}
              onChange={(e) => setExplain(e.target.checked)}
              disabled={busy}
              color="primary"
            />
          }
          label="Explain prediction"
          slotProps={{ typography: { color: "text.secondary", variant: "body2" } }}
        />
        <Stack direction="row" spacing={1.25}>
          <Button variant="outlined" onClick={onEvaluate} disabled={busy || !query}>
            Evaluate
          </Button>
          <Button variant="contained" color="primary" onClick={onPredict} disabled={busy || !query}>
            {busy ? "Running…" : "Run prediction"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
