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
  textBody:'#1A1F2E', // Much darker ink color for better legibility
  textMuted:'#4A4A4A', // Darker gray for muted text
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
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: JAGUAR.ink,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      color: JAGUAR.ink,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      color: JAGUAR.ink,
    },
    h4: {
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: '1.5rem',
      color: JAGUAR.ink,
    },
    h5: {
      fontStyle: 'italic',
      fontWeight: 700,
      fontSize: '1.25rem',
      color: JAGUAR.ink,
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.95rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: JAGUAR.gold,
    },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.1em',
      fontSize: '0.84rem',
      color: JAGUAR.textMuted,
    },
    caption: {
      fontSize: '0.875rem',
      color: JAGUAR.textMuted,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
    body1: {
      fontSize: '1.05rem',
      lineHeight: 1.65,
      color: JAGUAR.textBody,
    },
    body2: {
      fontSize: '0.975rem',
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
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: JAGUAR.ink,
            color: '#fff',
            '&:hover': { background: JAGUAR.blue },
          },
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            borderColor: JAGUAR.border,
            color: JAGUAR.ink,
            '&:hover': { background: JAGUAR.muted, borderColor: JAGUAR.border },
          },
        },
      ],
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
        root: { padding: 32, '&:last-child': { paddingBottom: 32 } },
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
      defaultProps: { variant: 'outlined', size: 'medium' },
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
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          height: 28,
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
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          minHeight: 52,
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
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          borderBottom: 'none',
          padding: '16px 20px',
        },
        body: {
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '0.975rem',
          borderBottom: `1px solid ${JAGUAR.border}`,
          padding: '14px 20px',
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
