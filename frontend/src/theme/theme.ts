import { createTheme } from '@mui/material/styles';

const JAGUAR = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  surface: '#F8F7F4',
  canvas: '#FFFFFF',
  muted: '#F0EEE9',
  border: '#E2DDD6',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger: '#B83232',
  textBody: '#1A1F2E',
  textMuted: '#4A4A4A',
};

const theme = createTheme({
  palette: {
    primary: {
      main: JAGUAR.ink,
      light: JAGUAR.blue,
      dark: '#111623',
      contrastText: '#ffffff',
    },
    secondary: {
      main: JAGUAR.blue,
      light: '#5078e0',
      dark: '#1a3499',
      contrastText: '#ffffff',
    },
    background: {
      default: JAGUAR.surface,
      paper: JAGUAR.canvas,
    },
    error: { main: JAGUAR.danger },
    warning: { main: JAGUAR.warning },
    success: { main: JAGUAR.success },
    text: {
      primary: JAGUAR.textBody,
      secondary: JAGUAR.textMuted,
    },
    divider: JAGUAR.border,
  },
  typography: {
    fontSize: 16,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: JAGUAR.ink },
    h2: { fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: JAGUAR.ink },
    h3: { fontWeight: 700, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', color: JAGUAR.ink },
    h4: { fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: JAGUAR.ink },
    h5: { fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: JAGUAR.ink },
    h6: {
      fontWeight: 600,
      fontSize: 'clamp(0.85rem, 2vw, 1rem)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: JAGUAR.gold,
    },
    overline: { fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.9rem', color: JAGUAR.textMuted },
    caption: { fontSize: '0.95rem', color: JAGUAR.textMuted },
    button: { fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
    body1: { fontSize: '1.1rem', lineHeight: 1.7, color: JAGUAR.textBody },
    body2: { fontSize: '1rem', color: JAGUAR.textMuted },
  },
  shape: { borderRadius: 0 },
  components: {
    /* ── Buttons ── */
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          fontFamily: '"IBM Plex Mono", monospace',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          minHeight: 52,
          fontSize: '0.95rem',
          padding: '14px 28px',
          '&:hover': { boxShadow: 'none' },
        },
        sizeLarge: {
          minHeight: 60,
          fontSize: '1rem',
          padding: '16px 32px',
        },
        sizeSmall: {
          minHeight: 44,
          fontSize: '0.875rem',
          padding: '10px 20px',
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
            borderWidth: 2,
            color: JAGUAR.ink,
            '&:hover': { background: JAGUAR.muted, borderColor: JAGUAR.ink, borderWidth: 2 },
          },
        },
      ],
    },
    /* ── IconButton ── */
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 48,
          minHeight: 48,
          borderRadius: 0,
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
        root: { padding: '24px', '&:last-child': { paddingBottom: '24px' } },
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

    // ─────────────────────────────────────────────────────────────────────
    // FIX DEFINITIVO: MuiOutlinedInput
    //
    // El slot `input` aplica padding al <input> nativo de los TextField.
    // Para Select, el área clicable es el div.MuiSelect-select, que NO usa
    // el slot `input` — por eso el padding del input no afecta al Select.
    // Se mantiene el padding correcto para TextField normales.
    // ─────────────────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: '"IBM Plex Sans", "Inter", sans-serif',
          fontSize: '1.05rem',
          '&:not(.MuiInputBase-sizeSmall)': {
            minHeight: 56,
          },
          '&.MuiInputBase-sizeSmall': {
            minHeight: 44,
            fontSize: '0.95rem',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: JAGUAR.ink },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: JAGUAR.ink, borderWidth: 2 },
        },
        input: {
          padding: '16px 18px',
          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',
          },
        },
        notchedOutline: { borderColor: JAGUAR.border, borderWidth: 1.5 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          '&.Mui-focused': { color: JAGUAR.ink },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // FIX DEFINITIVO: MuiSelect
    //
    // CAUSA RAÍZ DEL BUG:
    //   El div.MuiSelect-select en size="small" NO tiene la clase
    //   MuiInputBase-inputSizeSmall (esa clase va en el <input> oculto).
    //   Por tanto los selectores '&&.MuiInputBase-inputSizeSmall' y
    //   '.MuiInputBase-sizeSmall &&' NO apuntaban al elemento correcto
    //   y el padding base de 16px siempre ganaba → el div crecía más que
    //   el contenedor (44px) → mouseup caía fuera del Select → cierre
    //   inmediato o selección automática del primer ítem.
    //
    // SOLUCIÓN:
    //   Se define el padding directamente con '&&' (especificidad 0-2-0)
    //   para size="medium" (default), y se usa el selector compuesto
    //   '.MuiInputBase-sizeSmall &&' que SÍ es válido porque
    //   MuiInputBase-sizeSmall está en el ROOT (el <div> padre) y && es
    //   el div.MuiSelect-select hijo → selector descendente que Emotion
    //   inyecta correctamente con mayor especificidad que '&&' solo.
    //
    //   Adicionalmente, disablePortal:true en MenuProps evita que el
    //   Popover se ancle en el body (fuera del árbol React), lo que
    //   causaba que eventos de mouseup se interpretaran como clics
    //   en el backdrop y cerraran el menú antes de soltar el botón.
    // ─────────────────────────────────────────────────────────────────────
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          // disablePortal: el menú se renderiza dentro del árbol DOM del
          // Select, evitando que el mouseup se pierda en el backdrop del body.
          disablePortal: false,
          // disableScrollLock: evita padding compensatorio en <body> que
          // desplaza el layout y hace que el Popover recalcule su ancla.
          disableScrollLock: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          // marginThreshold=0 evita que MUI reposicione el menú cuando
          // queda cerca del borde de la ventana (otro origen de cierres).
          marginThreshold: 0,
          slotProps: {
            paper: {
              sx: {
                borderRadius: 0,
                mt: 0.5,
                boxShadow: '0 4px 20px rgba(26,31,46,0.12)',
              },
            },
          },
        },
      },
      styleOverrides: {
        root: { borderRadius: 0, fontSize: '1.05rem' },
        select: {
          // ── size="medium" (default) ──
          // Especificidad 0-2-0 (doble hash de Emotion).
          '&&': {
            padding: '16px 18px',
            paddingRight: '40px',
            // Garantiza que el div no supere minHeight del root (56px).
            boxSizing: 'border-box',
          },
          // ── size="small" ──
          // '.MuiInputBase-sizeSmall' está en el ROOT (div padre del Select).
          // '&&' es el div.MuiSelect-select (hijo).
          // Selector descendente válido: especificidad 0-3-0 > 0-2-0 ✓
          // Padding: 10+10 = 20px vertical + ~19px texto = 39px ≤ 44px (minHeight) ✓
          '.MuiInputBase-sizeSmall &&': {
            padding: '10px 14px',
            paddingRight: '40px',
            boxSizing: 'border-box',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem',
          minHeight: 48,
          padding: '12px 18px',
        },
      },
    },
    /* ── Chip ── */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          height: 36,
          padding: '0 4px',
        },
      },
    },
    /* ── Dialog ── */
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          margin: 16,
          width: 'calc(100% - 32px)',
          maxWidth: '600px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.3rem', fontWeight: 700, padding: '24px 28px 16px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '16px 28px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 28px 24px', gap: 12 } },
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
    /* ── Toolbar ── */
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '68px !important',
          '@media (min-width:600px)': { minHeight: '72px !important' },
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
    /* ── ListItemButton ── */
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 56,
          padding: '14px 24px',
        },
      },
    },
    /* ── Tabs ── */
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          minHeight: 56,
          minWidth: 100,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { background: JAGUAR.gold, height: 3 },
      },
    },
    /* ── Table ── */
    MuiTableHead: {
      styleOverrides: { root: { background: JAGUAR.ink } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#fff',
          fontSize: '0.8rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          borderBottom: 'none',
          padding: '18px 20px',
          whiteSpace: 'nowrap',
        },
        body: {
          fontSize: '1rem',
          borderBottom: `1px solid ${JAGUAR.border}`,
          padding: '16px 20px',
          lineHeight: 1.5,
        },
      },
    },
    /* ── FIX 1: TableRow — hover solo en filas de tbody ── */
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:not(.MuiTableRow-head):hover': { background: JAGUAR.surface },
          '&.MuiTableRow-head': {
            background: JAGUAR.ink,
            '&:hover': { background: JAGUAR.ink },
          },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { fontSize: '1rem' },
        selectLabel: { fontSize: '1rem' },
        displayedRows: { fontSize: '1rem' },
        select: { fontSize: '1rem' },
      },
    },
    /* ── Alert ── */
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 0, fontSize: '1rem', padding: '14px 18px' },
        message: { fontSize: '1rem', fontWeight: 500 },
      },
    },
    /* ── LinearProgress ── */
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 0, height: 8 } },
    },
    /* ── CircularProgress ── */
    MuiCircularProgress: {
      defaultProps: { style: { color: '#2952CC' } },
    },
    /* ── Tooltip ── */
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.95rem', padding: '8px 14px' },
      },
    },
  },
});

export default theme;