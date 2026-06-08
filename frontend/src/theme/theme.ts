import { createTheme } from '@mui/material/styles';

const JAGUAR = {
  ink:     '#1A1F2E',
  blue:    '#2952CC',
  gold:    '#C9973A',
  surface: '#F8F7F4',
  canvas:  '#FFFFFF',
  muted:   '#F0EEE9',
  border:  '#E2DDD6',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger:  '#B83232',
  textBody:'#2C2C2C',
  textMuted:'#7A7A7A',
};

const theme = createTheme({
  palette: {
    primary: {
      main:          JAGUAR.ink,
      light:         JAGUAR.blue,
      dark:          '#111623',
      contrastText:  '#ffffff',
    },
    secondary: {
      main:          JAGUAR.blue,
      light:         '#5078e0',
      dark:          '#1a3499',
      contrastText:  '#ffffff',
    },
    background: {
      default: JAGUAR.surface,
      paper:   JAGUAR.canvas,
    },
    error: {
      main: JAGUAR.danger,
    },
    warning: {
      main: JAGUAR.warning,
    },
    success: {
      main: JAGUAR.success,
    },
    text: {
      primary:   JAGUAR.textBody,
      secondary: JAGUAR.textMuted,
    },
    divider: JAGUAR.border,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", Roboto, Arial, sans-serif',
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      color: JAGUAR.ink,
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      fontSize: '2rem',
      color: JAGUAR.ink,
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      fontSize: '1.75rem',
      color: JAGUAR.ink,
    },
    h4: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: '1.5rem',
      color: JAGUAR.ink,
    },
    h5: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: '1.25rem',
      color: JAGUAR.ink,
    },
    h6: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontWeight: 600,
      fontSize: '0.7rem',
      letterSpacing: '0.18em',
      textTransform: 'uppercase' as const,
      color: JAGUAR.gold,
    },
    overline: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontWeight: 600,
      letterSpacing: '0.15em',
      fontSize: '0.65rem',
      color: JAGUAR.textMuted,
    },
    caption: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '0.7rem',
      color: JAGUAR.textMuted,
    },
    button: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      color: JAGUAR.textBody,
    },
    body2: {
      fontSize: '0.875rem',
      color: JAGUAR.textMuted,
    },
  },
  shape: {
    borderRadius: 0,   // JAGUAR is sharp — no rounded corners
  },
  components: {
    /* ── Buttons ── */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          fontFamily: '"IBM Plex Mono", monospace',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: JAGUAR.ink,
          color: '#fff',
          '&:hover': { background: JAGUAR.blue },
        },
        outlinedPrimary: {
          borderColor: JAGUAR.border,
          color: JAGUAR.ink,
          '&:hover': { background: JAGUAR.muted, borderColor: JAGUAR.border },
        },
      },
    },
    /* ── Cards ── */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${JAGUAR.border}`,
          background: JAGUAR.canvas,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 24, '&:last-child': { paddingBottom: 24 } },
      },
    },
    /* ── Paper ── */
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${JAGUAR.border}`,
        },
      },
    },
    /* ── Inputs ── */
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: '"IBM Plex Sans", sans-serif',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: JAGUAR.ink,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: JAGUAR.ink,
            borderWidth: 1.5,
          },
        },
        notchedOutline: { borderColor: JAGUAR.border },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          '&.Mui-focused': { color: JAGUAR.ink },
        },
      },
    },
    /* ── Select ── */
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
    /* ── Chip ── */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          height: 22,
        },
      },
    },
    /* ── Dialog ── */
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    /* ── AppBar ── */
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${JAGUAR.border}`,
        },
      },
    },
    /* ── Drawer ── */
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid rgba(226,221,214,0.08)`,
          background: JAGUAR.ink,
        },
      },
    },
    /* ── Tabs ── */
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { background: JAGUAR.gold, height: 2 },
      },
    },
    /* ── Table ── */
    MuiTableHead: {
      styleOverrides: {
        root: { background: JAGUAR.ink },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#fff',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          borderBottom: 'none',
          padding: '12px 16px',
        },
        body: {
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '0.875rem',
          borderBottom: `1px solid ${JAGUAR.border}`,
          padding: '10px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: JAGUAR.surface },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    /* ── Snackbar / Alert ── */
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
    /* ── LinearProgress ── */
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
    /* ── CircularProgress ── */
    MuiCircularProgress: {
      defaultProps: { style: { color: '#2952CC' } },
    },
  },
});

export default theme;
