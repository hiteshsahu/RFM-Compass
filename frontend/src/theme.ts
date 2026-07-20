import { createTheme } from "@mui/material/styles";

/** Charcoal / gold / teal instrument palette, carried over from the original hand-built CSS. */
export const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#16181d", paper: "#1f232b" },
    primary: { main: "#d9a441" },
    secondary: { main: "#3fa8a0" },
    error: { main: "#e2654f" },
    text: { primary: "#edeff3", secondary: "#aeb4c0" },
    divider: "#2b303b",
  },
  typography: {
    fontFamily: '"Archivo", system-ui, sans-serif',
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid #2b303b" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export const monoFont = '"IBM Plex Mono", ui-monospace, monospace';
