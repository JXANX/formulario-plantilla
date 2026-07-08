import { Box, Typography, Chip } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import TableBarIcon from '@mui/icons-material/TableBar';
import { J } from '../theme/theme';

/* ── Mesa status helpers ─────────────────────────── */
export type MesaStatus = 'available' | 'warning' | 'full';

export function getMesaStatus(ocupados: number, capacidad: number): MesaStatus {
  const pct = capacidad > 0 ? ocupados / capacidad : 0;
  if (pct >= 1) return 'full';
  if (pct >= 0.75) return 'warning';
  return 'available';
}

export const STATUS_CONFIG = {
  available: { color: J.success, bg: J.successBg, border: J.successBorder, label: 'Disponible' },
  warning:   { color: J.warning, bg: J.warningBg, border: J.warningBorder, label: 'Casi llena' },
  full:      { color: J.danger,  bg: J.dangerBg,  border: J.dangerBorder,  label: 'Llena' },
};

/* ── MesaDot — tiny colored indicator ───────────── */
export function MesaDot({ status }: { status: MesaStatus }) {
  return (
    <CircleIcon sx={{ fontSize: 10, color: STATUS_CONFIG[status].color, flexShrink: 0 }} />
  );
}

/* ── MesaChip — badge used in the table cell ─────── */
export function MesaChip({ numeroMesa, ocupados, capacidad }: { numeroMesa: number; ocupados?: number; capacidad?: number }) {
  if (ocupados === undefined || capacidad === undefined) {
    return (
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5,
        border: `1px solid ${J.border}`, bgcolor: J.surface
      }}>
        <TableBarIcon sx={{ fontSize: 14, color: J.textMuted }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink }}>
          Mesa {numeroMesa}
        </Typography>
      </Box>
    );
  }
  const status = getMesaStatus(ocupados, capacidad);
  const cfg = STATUS_CONFIG[status];
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5,
      border: `1px solid ${cfg.border}`, bgcolor: cfg.bg
    }}>
      <MesaDot status={status} />
      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink }}>
        Mesa {numeroMesa}
      </Typography>
    </Box>
  );
}

/* ── MesaMenuItem — rich option inside Select ───── */
export function MesaMenuItem({ mesa, isCurrent }: { mesa: any; isCurrent?: boolean }) {
  const status = getMesaStatus(mesa.ocupados, mesa.capacidad);
  const cfg = STATUS_CONFIG[status];
  const pct = mesa.capacidad > 0 ? Math.round((mesa.ocupados / mesa.capacidad) * 100) : 0;

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
      {/* Status dot */}
      <MesaDot status={status} />

      {/* Mesa number */}
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: J.ink, minWidth: 70 }}>
        Mesa {mesa.numeroMesa}
      </Typography>

      {/* Capacity bar */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Box sx={{ height: 5, bgcolor: J.muted, overflow: 'hidden', borderRadius: 0 }}>
          <Box sx={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            bgcolor: cfg.color,
            transition: 'width 0.3s ease',
          }} />
        </Box>
        <Typography sx={{ fontSize: '11px', color: J.textMuted, lineHeight: 1 }}>
          {mesa.ocupados}/{mesa.capacidad} · {pct}%
        </Typography>
      </Box>

      {/* Status badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isCurrent && (
          <Chip label="actual" size="small" sx={{
            height: 20, fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
            bgcolor: 'rgba(41,82,204,0.1)', color: J.blue, borderRadius: 0, border: `1px solid rgba(41,82,204,0.2)`,
          }} />
        )}
        <Typography sx={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: cfg.color,
        }}>
          {cfg.label}
        </Typography>
      </Box>
    </Box>
  );
}
