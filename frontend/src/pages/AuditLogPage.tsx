import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TablePagination,
  CircularProgress, Alert, TextField, MenuItem, IconButton, Tooltip,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  surface: '#F8F7F4',
  textMuted: '#7A7A7A',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger: '#B83232',
};

interface AuditEntry {
  id: number;
  accion: string;
  detalle: string;
  entidad: string;
  entidadId: number;
  fecha: string;
  usuario: string;
  ip: string;
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  REGISTRO_TESTIGO: { label: 'Registro', color: J.success, bg: 'rgba(45,125,78,0.1)', icon: <PersonAddIcon sx={{ fontSize: 15 }} /> },
  ELIMINACION_TESTIGO: { label: 'Eliminación', color: J.danger, bg: 'rgba(184,50,50,0.09)', icon: <DeleteIcon sx={{ fontSize: 15 }} /> },
  TRASLADO_TESTIGO: { label: 'Traslado', color: J.blue, bg: 'rgba(41,82,204,0.09)', icon: <SwapHorizIcon sx={{ fontSize: 15 }} /> },
  EDICION_TESTIGO: { label: 'Edición', color: J.gold, bg: 'rgba(201,151,58,0.1)', icon: <EditIcon sx={{ fontSize: 15 }} /> },
  LOGIN: { label: 'Ingreso', color: '#3A7AB8', bg: 'rgba(58,122,184,0.08)', icon: <LoginIcon sx={{ fontSize: 15 }} /> },
  LOGOUT: { label: 'Salida', color: J.textMuted, bg: 'rgba(122,122,122,0.08)', icon: <LogoutIcon sx={{ fontSize: 15 }} /> },
  EXPORTACION_EXCEL: { label: 'Exportación', color: '#2D7D4E', bg: 'rgba(45,125,78,0.07)', icon: <DownloadIcon sx={{ fontSize: 15 }} /> },
  IMPORTACION_EXCEL: { label: 'Importación', color: '#4A6B2D', bg: 'rgba(74,107,45,0.08)', icon: <UploadIcon sx={{ fontSize: 15 }} /> },
  DUPLICADO_DETECTADO: { label: 'Duplicado', color: J.warning, bg: 'rgba(185,125,26,0.1)', icon: <WarningIcon sx={{ fontSize: 15 }} /> },
  CREACION_USUARIO: { label: 'Usr. creado', color: '#5555BB', bg: 'rgba(85,85,187,0.08)', icon: <PersonIcon sx={{ fontSize: 15 }} /> },
  EDICION_USUARIO: { label: 'Usr. editado', color: '#5555BB', bg: 'rgba(85,85,187,0.06)', icon: <EditIcon sx={{ fontSize: 15 }} /> },
  ELIMINACION_USUARIO: { label: 'Usr. elim.', color: J.danger, bg: 'rgba(184,50,50,0.07)', icon: <DeleteIcon sx={{ fontSize: 15 }} /> },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'REGISTRO_TESTIGO', label: 'Registro de testigo' },
  { value: 'ELIMINACION_TESTIGO', label: 'Eliminación de testigo' },
  { value: 'TRASLADO_TESTIGO', label: 'Traslado de testigo' },
  { value: 'EDICION_TESTIGO', label: 'Edición de testigo' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'EXPORTACION_EXCEL', label: 'Exportación Excel' },
  { value: 'IMPORTACION_EXCEL', label: 'Importación Excel' },
  { value: 'DUPLICADO_DETECTADO', label: 'Duplicado detectado' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPP, setRowsPP] = useState(25);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/audit-logs?page=0&size=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLogs(data.data);
      else setError(data.message || 'Error al cargar el historial');
    } catch { setError('Error de conexión con el servidor'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const q = search.trim().toLowerCase();
    const matchesSearch = q === '' ||
      l.detalle?.toLowerCase().includes(q) ||
      l.usuario?.toLowerCase().includes(q) ||
      l.ip?.toLowerCase().includes(q);
    const matchesFilter = filter === '' || l.accion === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
            Auditoría del Sistema
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '36px', color: J.ink }}>
            Historial de Acciones
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '14px', color: J.textMuted }}>
            Total: <strong style={{ color: J.ink }}>{logs.length}</strong>
            {filtered.length !== logs.length && (
              <> · Filtrados: <strong style={{ color: J.blue }}>{filtered.length}</strong></>
            )}
          </Typography>
          <Tooltip title="Recargar">
            <IconButton onClick={fetchLogs} sx={{ color: J.blue, border: `1px solid ${J.border}`, borderRadius: 0 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: 3.5 }}>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2.5 }}>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar en detalles, usuario o IP"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 320, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: J.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              label="Tipo de acción"
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              {FILTER_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={32} sx={{ color: J.blue }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: J.ink }}>
              <TableRow>
                {['Fecha y Hora', 'Acción', 'Detalle', 'Usuario', 'IP'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderBottom: 'none', py: 1.75, whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: J.textMuted, fontSize: '13px', letterSpacing: '0.1em' }}>
                    No se encontraron registros con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(page * rowsPP, page * rowsPP + rowsPP).map(log => {
                  const meta = ACTION_META[log.accion] ?? {
                    label: log.accion, color: J.textMuted, bg: 'rgba(122,122,122,0.07)', icon: null,
                  };
                  return (
                    <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                      <TableCell sx={{ fontSize: '13px', color: J.textMuted, whiteSpace: 'nowrap', py: 1.5 }}>
                        {formatDate(log.fecha)}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 0.7,
                          px: 1.2, py: 0.45,
                          bgcolor: meta.bg,
                          color: meta.color,
                          fontSize: '11.5px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          border: `1px solid ${meta.color}33`,
                          whiteSpace: 'nowrap',
                        }}>
                          {meta.icon}
                          {meta.label}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13.5px', color: J.ink, maxWidth: 520, py: 1.5 }}>
                        {log.detalle || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13.5px', fontWeight: 600, color: J.ink, whiteSpace: 'nowrap', py: 1.5 }}>
                        {log.usuario || 'Sistema'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: J.textMuted, fontFamily: 'monospace', py: 1.5 }}>
                        {log.ip || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filtered.length}
            rowsPerPage={rowsPP}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPP(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
            sx={{ fontSize: '13px', borderTop: `1px solid ${J.border}` }}
          />
        </TableContainer>
      )}
    </Box>
  );
}