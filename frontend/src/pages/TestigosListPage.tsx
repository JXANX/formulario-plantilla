import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  TablePagination, CircularProgress, Tooltip, Chip, ListSubheader,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import CircleIcon from '@mui/icons-material/Circle';
import TableBarIcon from '@mui/icons-material/TableBar';
import { useWebSocket } from '../hooks/useWebSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  surface: '#F8F7F4',
  muted: '#F0EEE9',
  textMuted: '#7A7A7A',
  success: '#2D7D4E',
  successBg: 'rgba(45,125,78,0.08)',
  successBorder: 'rgba(45,125,78,0.25)',
  warning: '#B97D1A',
  warningBg: 'rgba(185,125,26,0.08)',
  warningBorder: 'rgba(185,125,26,0.25)',
  danger: '#B83232',
  dangerBg: 'rgba(184,50,50,0.08)',
  dangerBorder: 'rgba(184,50,50,0.22)',
};

interface Testigo {
  id: number; documento: string; nombre: string; segundoNombre: string;
  primerApellido: string; segundoApellido: string; nombreCompleto: string;
  celular: string; correo: string; nombreOrganizacion: string;
  tipoTestigo: string; fechaRegistro: string;
  mesaId: number; numeroMesa: number;
  puestoId: number; nombrePuesto: string;
  municipioId: number; nombreMunicipio: string;
  departamentoId: number; nombreDepartamento: string;
  registradoPor: string;
}

/* ── Mesa status helpers ─────────────────────────── */
type MesaStatus = 'available' | 'warning' | 'full';

function getMesaStatus(ocupados: number, capacidad: number): MesaStatus {
  const pct = capacidad > 0 ? ocupados / capacidad : 0;
  if (pct >= 1) return 'full';
  if (pct >= 0.75) return 'warning';
  return 'available';
}

const STATUS_CONFIG = {
  available: { color: J.success, bg: J.successBg, border: J.successBorder, label: 'Disponible' },
  warning: { color: J.warning, bg: J.warningBg, border: J.warningBorder, label: 'Casi llena' },
  full: { color: J.danger, bg: J.dangerBg, border: J.dangerBorder, label: 'Llena' },
};

/* ── MesaDot — tiny colored indicator ───────────── */
function MesaDot({ status }: { status: MesaStatus }) {
  return (
    <CircleIcon sx={{ fontSize: 10, color: STATUS_CONFIG[status].color, flexShrink: 0 }} />
  );
}

/* ── MesaChip — badge used in the table cell ─────── */
function MesaChip({ numeroMesa, ocupados, capacidad }: { numeroMesa: number; ocupados?: number; capacidad?: number }) {
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
function MesaMenuItem({ mesa, isCurrent }: { mesa: any; isCurrent?: boolean }) {
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

/* ── Reusable sxSelect for filter dropdowns ─────── */
const sxSelect = {
  '& .MuiOutlinedInput-notchedOutline': { borderColor: J.border },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: J.blue },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: J.blue, borderWidth: '1.5px' },
  '&.Mui-disabled': { opacity: 0.5 },
};

const sxLabel = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontWeight: 600,
  color: J.textMuted,
  '&.Mui-focused': { color: J.blue },
  '&.MuiFormLabel-filled': { color: J.ink },
};

/* ── Shared MenuProps ────────────────────────────── */
const MENU_PROPS = {
  slotProps: {
    paper: {
      sx: {
        borderRadius: 0,
        border: `1px solid ${J.border}`,
        boxShadow: '0 8px 24px rgba(26,31,46,0.12)',
        mt: 0.5,
        maxHeight: 320,
      },
    },
  },
};

/* ─────────────────────────────────────────────────── */
export default function TestigosListPage() {
  const { dashboardUpdates } = useWebSocket();

  const [testigos, setTestigos] = useState<Testigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');
  const [selectedMesa, setSelectedMesa] = useState('');

  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestigoForDelete, setSelectedTestigoForDelete] = useState<Testigo | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedTestigoForMove, setSelectedTestigoForMove] = useState<Testigo | null>(null);

  const [moveDepto, setMoveDepto] = useState('');
  const [moveMpio, setMoveMpio] = useState('');
  const [movePuesto, setMovePuesto] = useState('');
  const [moveMesa, setMoveMesa] = useState('');
  const [moveDeptosList, setMoveDeptosList] = useState<any[]>([]);
  const [moveMpiosList, setMoveMpiosList] = useState<any[]>([]);
  const [movePuestosList, setMovePuestosList] = useState<any[]>([]);
  const [moveMesasList, setMoveMesasList] = useState<any[]>([]);
  const [moveError, setMoveError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchTestigos(); fetchFilterCatalog(); }, [dashboardUpdates]);

  /* ── Fetches ─────────────────────────────────────── */
  const fetchTestigos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTestigos(data.data);
      else setError(data.message || 'Error al cargar los testigos');
    } catch { setError('Error de conexión con el servidor'); }
    finally { setLoading(false); }
  };

  const fetchFilterCatalog = async () => {
    try {
      const token = localStorage.getItem('token');
      const dRes = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { Authorization: `Bearer ${token}` } });
      const dData = await dRes.json();
      if (dData.success && dData.data.length > 0) {
        const firstId = dData.data[0].id;
        const mRes = await fetch(`${API_URL}/api/catalogo/departamentos/${firstId}/municipios`, { headers: { Authorization: `Bearer ${token}` } });
        const mData = await mRes.json();
        if (mData.success) setMunicipios(mData.data);
      }
    } catch (e) { console.error(e); }
  };

  const handleMunicipioChange = async (val: string) => {
    setSelectedMunicipio(val); setSelectedPuesto(''); setSelectedMesa(''); setPuestos([]); setMesas([]);
    setPage(0);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${val}/puestos`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const handlePuestoChange = async (val: string) => {
    setSelectedPuesto(val); setSelectedMesa(''); setMesas([]);
    setPage(0);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${val}/mesas`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMesas(data.data);
    } catch (e) { console.error(e); }
  };

  /* ── Delete ─────────────────────────────────────── */
  const handleOpenDelete = (t: Testigo) => { setSelectedTestigoForDelete(t); setDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!selectedTestigoForDelete) return;
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForDelete.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setSuccess('Testigo eliminado correctamente'); fetchTestigos(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('Error de conexión'); }
    finally { setDeleteDialogOpen(false); setSelectedTestigoForDelete(null); }
  };

  /* ── Move ────────────────────────────────────────── */
  const handleOpenMove = async (testigo: Testigo) => {
    setSelectedTestigoForMove(testigo);
    setMoveError(''); setMoveDepto(''); setMoveMpio(''); setMovePuesto(''); setMoveMesa('');
    setMoveMpiosList([]); setMovePuestosList([]); setMoveMesasList([]);
    setMoveDialogOpen(true);
    try {
      const token = localStorage.getItem('token');
      const dRes = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { Authorization: `Bearer ${token}` } });
      const dData = await dRes.json();
      if (!dData.success) return;
      setMoveDeptosList(dData.data);
      if (testigo.departamentoId) {
        setMoveDepto(String(testigo.departamentoId));
        const mRes = await fetch(`${API_URL}/api/catalogo/departamentos/${testigo.departamentoId}/municipios`, { headers: { Authorization: `Bearer ${token}` } });
        const mData = await mRes.json();
        if (mData.success) {
          setMoveMpiosList(mData.data);
          if (testigo.municipioId) {
            setMoveMpio(String(testigo.municipioId));
            const pRes = await fetch(`${API_URL}/api/catalogo/municipios/${testigo.municipioId}/puestos`, { headers: { Authorization: `Bearer ${token}` } });
            const pData = await pRes.json();
            if (pData.success) {
              setMovePuestosList(pData.data);
              if (testigo.puestoId) {
                setMovePuesto(String(testigo.puestoId));
                const mesRes = await fetch(`${API_URL}/api/catalogo/puestos/${testigo.puestoId}/mesas`, { headers: { Authorization: `Bearer ${token}` } });
                const mesData = await mesRes.json();
                if (mesData.success) {
                  setMoveMesasList(mesData.data);
                  if (testigo.mesaId) setMoveMesa(String(testigo.mesaId));
                }
              }
            }
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleMoveDeptoChange = async (val: string) => {
    setMoveDepto(val); setMoveMpio(''); setMovePuesto(''); setMoveMesa('');
    setMoveMpiosList([]); setMovePuestosList([]); setMoveMesasList([]);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/departamentos/${val}/municipios`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMoveMpiosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMoveMpioChange = async (val: string) => {
    setMoveMpio(val); setMovePuesto(''); setMoveMesa(''); setMovePuestosList([]); setMoveMesasList([]);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${val}/puestos`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMovePuestosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMovePuestoChange = async (val: string) => {
    setMovePuesto(val); setMoveMesa(''); setMoveMesasList([]);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${val}/mesas`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMoveMesasList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleConfirmMove = async () => {
    if (!selectedTestigoForMove || !moveMesa) { setMoveError('Por favor selecciona una mesa de destino'); return; }
    setMoveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForMove.id}/mover?nuevaMesaId=${moveMesa}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Testigo trasladado de mesa correctamente');
        setMoveDialogOpen(false); fetchTestigos();
      } else setMoveError(data.message || 'Error al trasladar');
    } catch { setMoveError('Error de conexión'); }
  };

  const filteredTestigos = testigos.filter(t => {
    const q = searchQuery.trim().toLowerCase();
    return (q === '' || t.documento.toLowerCase().includes(q) || t.nombreCompleto.toLowerCase().includes(q))
      && (selectedMunicipio === '' || String(t.municipioId) === String(selectedMunicipio))
      && (selectedPuesto === '' || String(t.puestoId) === String(selectedPuesto))
      && (selectedMesa === '' || String(t.mesaId) === String(selectedMesa));
  });

  /* ── Mesa groups for Move dialog ────────────────── */
  const moveMesasSorted = [...moveMesasList].sort((a, b) => a.numeroMesa - b.numeroMesa);
  const moveMesasAvail = moveMesasSorted.filter(m => m.ocupados < m.capacidad);
  const moveMesasFull = moveMesasSorted.filter(m => m.ocupados >= m.capacidad);

  /* ── Mesa groups for filter ─────────────────────── */
  const mesasSorted = [...mesas].sort((a, b) => a.numeroMesa - b.numeroMesa);

  /* ── Selected mesa display value (filter) ────────── */
  const selectedMesaObj = mesas.find(m => String(m.id) === String(selectedMesa));

  /* ── Selected mesa display value (move) ─────────── */
  const selectedMoveMesaObj = moveMesasList.find(m => String(m.id) === String(moveMesa));

  /* ── Render ─────────────────────────────────────── */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
            Registro Institucional
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '36px', color: J.ink }}>
            Listado de Testigos
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '14px', letterSpacing: '0.1em', color: J.textMuted }}>
          Total: <strong style={{ color: J.ink }}>{testigos.length}</strong>
          &nbsp;·&nbsp;
          Filtrados: <strong style={{ color: J.blue }}>{filteredTestigos.length}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 0 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 0 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Filters ──────────────────────────────────── */}
      <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: 3.5 }}>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2.5 }}>
            Filtros de búsqueda
          </Typography>
          <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>

            {/* Search */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Buscar por Nombre o Documento"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: J.textMuted, mr: 1, fontSize: 20 }} /> } }}
              />
            </Grid>

            {/* Municipio */}
            <Grid size={{ xs: 12, sm: 4, md: 2.6 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink sx={sxLabel}>Municipio</InputLabel>
                <Select
                  value={selectedMunicipio}
                  label="Municipio"
                  displayEmpty
                  onChange={e => handleMunicipioChange(e.target.value as string)}
                  sx={sxSelect}
                  MenuProps={MENU_PROPS}
                  renderValue={val =>
                    val
                      ? municipios.find(m => String(m.id) === String(val))?.nombre ?? 'Todos'
                      : <span style={{ color: J.textMuted }}>Todos</span>
                  }
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todos los municipios</em></MenuItem>
                  {[...municipios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(m => (
                    <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Puesto */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                <InputLabel shrink sx={sxLabel}>Puesto</InputLabel>
                <Select
                  value={selectedPuesto}
                  label="Puesto"
                  displayEmpty
                  onChange={e => handlePuestoChange(e.target.value as string)}
                  sx={sxSelect}
                  MenuProps={MENU_PROPS}
                  renderValue={val =>
                    val
                      ? puestos.find(p => String(p.id) === String(val))?.nombrePuesto ?? 'Todos'
                      : <span style={{ color: J.textMuted }}>Todos</span>
                  }
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todos los puestos</em></MenuItem>
                  {[...puestos].sort((a, b) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map(p => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.nombrePuesto}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mesa — filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedPuesto}>
                <InputLabel shrink sx={sxLabel}>Mesa</InputLabel>
                <Select
                  value={selectedMesa}
                  label="Mesa"
                  displayEmpty
                  onChange={e => { setSelectedMesa(e.target.value as string); setPage(0); }}
                  sx={sxSelect}
                  MenuProps={{
                    ...MENU_PROPS,
                    slotProps: { paper: { sx: { ...MENU_PROPS.slotProps.paper.sx, maxHeight: 380 } } },
                  }}
                  renderValue={val => {
                    if (!val) return <span style={{ color: J.textMuted }}>Todas</span>;
                    if (selectedMesaObj) {
                      const s = getMesaStatus(selectedMesaObj.ocupados, selectedMesaObj.capacidad);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <MesaDot status={s} />
                          <span>Mesa {selectedMesaObj.numeroMesa}</span>
                        </Box>
                      );
                    }
                    return `Mesa ${val}`;
                  }}
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todas las mesas</em></MenuItem>
                  {mesasSorted.map(m => {
                    const status = getMesaStatus(m.ocupados, m.capacidad);
                    const cfg = STATUS_CONFIG[status];
                    const pct = m.capacidad > 0 ? Math.round((m.ocupados / m.capacidad) * 100) : 0;
                    return (
                      <MenuItem key={m.id} value={String(m.id)} sx={{ py: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
                          <MesaDot status={status} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 62 }}>
                            Mesa {m.numeroMesa}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ height: 4, bgcolor: J.muted }}>
                              <Box sx={{ height: '100%', width: `${Math.min(pct, 100)}%`, bgcolor: cfg.color }} />
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: J.textMuted, minWidth: 52, textAlign: 'right' }}>
                            {m.ocupados}/{m.capacidad}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </CardContent>
      </Card>

      {/* ── Table ──────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress size={32} sx={{ color: J.blue }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: J.ink }}>
              <TableRow>
                {['Documento', 'Nombre Completo', 'Celular', 'Tipo', 'Municipio', 'Puesto', 'Mesa', 'Registrado por', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderBottom: 'none', py: 2, whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTestigos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: J.textMuted, fontSize: '13px', letterSpacing: '0.1em' }}>
                    No se encontraron testigos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestigos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(t => (
                  <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                    <TableCell sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t.documento}</TableCell>
                    <TableCell sx={{ fontSize: '16px' }}>{t.nombreCompleto}</TableCell>
                    <TableCell sx={{ fontSize: '15px' }}>{t.celular}</TableCell>
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block', px: 1.5, py: 0.5,
                        fontSize: '12px', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase',
                        bgcolor: t.tipoTestigo === 'PRINCIPAL' ? 'rgba(41,82,204,0.09)' : 'rgba(185,125,26,0.1)',
                        color: t.tipoTestigo === 'PRINCIPAL' ? J.blue : J.warning,
                        border: t.tipoTestigo === 'PRINCIPAL' ? '1px solid rgba(41,82,204,0.22)' : '1px solid rgba(185,125,26,0.22)',
                      }}>
                        {t.tipoTestigo}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '15.5px' }}>{t.nombreMunicipio}</TableCell>
                    <TableCell sx={{ fontSize: '15.5px' }}>{t.nombrePuesto}</TableCell>
                    <TableCell>
                      <MesaChip numeroMesa={t.numeroMesa} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '14px', color: J.textMuted }}>{t.registradoPor}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Mover de Mesa">
                          <IconButton onClick={() => handleOpenMove(t)} sx={{ color: J.blue, '&:hover': { bgcolor: 'rgba(41,82,204,0.08)' } }}>
                            <SwapHorizIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Testigo">
                          <IconButton onClick={() => handleOpenDelete(t)} sx={{ color: J.danger, '&:hover': { bgcolor: 'rgba(184,50,50,0.08)' } }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTestigos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
            sx={{ fontSize: '13px', borderTop: `1px solid ${J.border}` }}
          />
        </TableContainer>
      )}

      {/* ── Delete Dialog ────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${J.border}` } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: J.danger, fontSize: '20px', borderBottom: `1px solid ${J.border}` }}>
          ¿Eliminar Testigo?
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ fontSize: '16px', color: J.ink }}>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{selectedTestigoForDelete?.nombreCompleto}</strong> con documento{' '}
            <strong>{selectedTestigoForDelete?.documento}</strong>?
            Esta acción no se puede deshacer y quedará registrada en el historial de auditoría.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 0, color: J.textMuted, fontSize: '13px', letterSpacing: '0.1em' }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} sx={{ bgcolor: J.danger, color: '#fff', borderRadius: 0, px: 3, fontSize: '13px', letterSpacing: '0.1em', '&:hover': { bgcolor: '#8f2020' } }}>
            Confirmar Eliminación
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Move Dialog ──────────────────────────────── */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${J.border}` } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: J.ink, fontSize: '20px', borderBottom: `1px solid ${J.border}` }}>
          Trasladar Testigo Electoral
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: J.border, p: '20px 28px 24px' }}>
          <Typography sx={{ fontSize: '15px', color: J.textMuted, mb: 3 }}>
            Nueva ubicación para{' '}
            <strong style={{ color: J.ink }}>{selectedTestigoForMove?.nombreCompleto}</strong>
            {' '}(Doc: {selectedTestigoForMove?.documento}).
          </Typography>

          {moveError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 0 }}>{moveError}</Alert>}

          <Grid container spacing={2.5}>

            {/* Departamento */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink sx={sxLabel}>Departamento</InputLabel>
                <Select
                  value={moveDepto}
                  label="Departamento"
                  displayEmpty
                  onChange={e => handleMoveDeptoChange(e.target.value as string)}
                  sx={sxSelect}
                  MenuProps={MENU_PROPS}
                  renderValue={val =>
                    val
                      ? moveDeptosList.find(d => String(d.id) === String(val))?.nombre ?? 'Seleccione...'
                      : <span style={{ color: J.textMuted }}>Seleccione departamento</span>
                  }
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Seleccione departamento</em></MenuItem>
                  {[...moveDeptosList].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(d => (
                    <MenuItem key={d.id} value={String(d.id)}>{d.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Municipio */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveDepto}>
                <InputLabel shrink sx={sxLabel}>Municipio</InputLabel>
                <Select
                  value={moveMpio}
                  label="Municipio"
                  displayEmpty
                  onChange={e => handleMoveMpioChange(e.target.value as string)}
                  sx={sxSelect}
                  MenuProps={MENU_PROPS}
                  renderValue={val =>
                    val
                      ? moveMpiosList.find(m => String(m.id) === String(val))?.nombre ?? 'Seleccione...'
                      : <span style={{ color: J.textMuted }}>Seleccione municipio</span>
                  }
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Seleccione municipio</em></MenuItem>
                  {[...moveMpiosList].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(m => (
                    <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Puesto */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveMpio}>
                <InputLabel shrink sx={sxLabel}>Puesto de votación</InputLabel>
                <Select
                  value={movePuesto}
                  label="Puesto de votación"
                  displayEmpty
                  onChange={e => handleMovePuestoChange(e.target.value as string)}
                  sx={sxSelect}
                  MenuProps={MENU_PROPS}
                  renderValue={val =>
                    val
                      ? movePuestosList.find(p => String(p.id) === String(val))?.nombrePuesto ?? 'Seleccione...'
                      : <span style={{ color: J.textMuted }}>Seleccione puesto</span>
                  }
                >
                  <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Seleccione puesto</em></MenuItem>
                  {[...movePuestosList].sort((a, b) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map(p => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.nombrePuesto}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mesa ── el más importante ─────────────── */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!movePuesto}>
                <InputLabel shrink sx={sxLabel}>Mesa de votación</InputLabel>
                <Select
                  value={moveMesa}
                  label="Mesa de votación"
                  displayEmpty
                  onChange={e => setMoveMesa(e.target.value as string)}
                  sx={{
                    ...sxSelect,
                    '& .MuiSelect-select': { py: '10px' },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          borderRadius: 0,
                          border: `1px solid ${J.border}`,
                          boxShadow: '0 8px 32px rgba(26,31,46,0.14)',
                          mt: 0.5,
                          maxHeight: 420,
                        },
                      },
                    },
                  }}
                  renderValue={val => {
                    if (!val) return <span style={{ color: J.textMuted }}>Seleccione mesa</span>;
                    if (selectedMoveMesaObj) {
                      const s = getMesaStatus(selectedMoveMesaObj.ocupados, selectedMoveMesaObj.capacidad);
                      const cfg = STATUS_CONFIG[s];
                      const isCurrent = selectedTestigoForMove?.mesaId === selectedMoveMesaObj.id;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MesaDot status={s} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: J.ink }}>
                            Mesa {selectedMoveMesaObj.numeroMesa}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: cfg.color, fontWeight: 600 }}>
                            {selectedMoveMesaObj.ocupados}/{selectedMoveMesaObj.capacidad}
                          </Typography>
                          {isCurrent && (
                            <Chip label="actual" size="small" sx={{
                              height: 18, fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                              bgcolor: 'rgba(41,82,204,0.1)', color: J.blue, borderRadius: 0,
                            }} />
                          )}
                        </Box>
                      );
                    }
                    return `Mesa ${val}`;
                  }}
                >
                  <MenuItem value="" disabled={moveMesasList.length > 0}>
                    <em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Seleccione una mesa</em>
                  </MenuItem>

                  {/* Leyenda de estados */}
                  {moveMesasList.length > 0 && (
                    <Box sx={{ px: 2, py: 1.25, bgcolor: J.surface, borderBottom: `1px solid ${J.border}` }}>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {(['available', 'warning', 'full'] as MesaStatus[]).map(s => (
                          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <MesaDot status={s} />
                            <Typography sx={{ fontSize: '11px', color: J.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {STATUS_CONFIG[s].label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Disponibles */}
                  {moveMesasAvail.length > 0 && (
                    <ListSubheader sx={{
                      fontSize: '10px', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase',
                      color: J.textMuted, bgcolor: '#fff', lineHeight: '32px', px: 2,
                    }}>
                      Disponibles · {moveMesasAvail.length}
                    </ListSubheader>
                  )}
                  {moveMesasAvail.map(m => {
                    const isCurrent = selectedTestigoForMove?.mesaId === m.id;
                    return (
                      <MenuItem
                        key={m.id}
                        value={String(m.id)}
                        sx={{
                          py: 1.5, px: 2,
                          borderLeft: isCurrent ? `3px solid ${J.blue}` : '3px solid transparent',
                          '&:hover': { bgcolor: J.surface },
                          '&.Mui-selected': { bgcolor: 'rgba(41,82,204,0.06)', '&:hover': { bgcolor: 'rgba(41,82,204,0.1)' } },
                        }}
                      >
                        <MesaMenuItem mesa={m} isCurrent={isCurrent} />
                      </MenuItem>
                    );
                  })}

                  {/* Divider between groups */}
                  {moveMesasAvail.length > 0 && moveMesasFull.length > 0 && (
                    <Divider sx={{ my: 0.5, borderColor: J.border }} />
                  )}

                  {/* Llenas */}
                  {moveMesasFull.length > 0 && (
                    <ListSubheader sx={{
                      fontSize: '10px', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase',
                      color: J.textMuted, bgcolor: '#fff', lineHeight: '32px', px: 2,
                    }}>
                      Llenas · {moveMesasFull.length}
                    </ListSubheader>
                  )}
                  {moveMesasFull.map(m => {
                    const isCurrent = selectedTestigoForMove?.mesaId === m.id;
                    return (
                      <MenuItem
                        key={m.id}
                        value={String(m.id)}
                        disabled={!isCurrent}
                        sx={{
                          py: 1.5, px: 2,
                          opacity: isCurrent ? 1 : 0.45,
                          borderLeft: isCurrent ? `3px solid ${J.blue}` : '3px solid transparent',
                          '&.Mui-disabled': { opacity: 0.45 },
                        }}
                      >
                        <MesaMenuItem mesa={m} isCurrent={isCurrent} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Capacidad summary del seleccionado */}
              {selectedMoveMesaObj && (() => {
                const s = getMesaStatus(selectedMoveMesaObj.ocupados, selectedMoveMesaObj.capacidad);
                const cfg = STATUS_CONFIG[s];
                const pct = selectedMoveMesaObj.capacidad > 0
                  ? Math.round((selectedMoveMesaObj.ocupados / selectedMoveMesaObj.capacidad) * 100) : 0;
                const remaining = selectedMoveMesaObj.capacidad - selectedMoveMesaObj.ocupados;
                return (
                  <Box sx={{ mt: 1.5, p: 1.75, bgcolor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <MesaDot status={s} />
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink }}>
                          Mesa {selectedMoveMesaObj.numeroMesa} — {cfg.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: cfg.color }}>
                        {pct}% ocupada
                      </Typography>
                    </Box>
                    <Box sx={{ height: 6, bgcolor: 'rgba(0,0,0,0.06)', mb: 1 }}>
                      <Box sx={{ height: '100%', width: `${Math.min(pct, 100)}%`, bgcolor: cfg.color, transition: 'width 0.3s ease' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: J.textMuted }}>
                      {selectedMoveMesaObj.ocupados} de {selectedMoveMesaObj.capacidad} lugares ocupados
                      {remaining > 0 && ` · ${remaining} disponible${remaining !== 1 ? 's' : ''}`}
                    </Typography>
                  </Box>
                );
              })()}
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setMoveDialogOpen(false)} sx={{ borderRadius: 0, color: J.textMuted, fontSize: '13px', letterSpacing: '0.1em' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmMove}
            disabled={!moveMesa || moveMesa === String(selectedTestigoForMove?.mesaId)}
            sx={{
              bgcolor: J.ink, color: '#fff', borderRadius: 0, px: 3, fontSize: '13px', letterSpacing: '0.1em',
              '&:hover': { bgcolor: J.blue },
              '&:disabled': { bgcolor: 'rgba(26,31,46,0.3)', color: 'rgba(255,255,255,0.5)' },
            }}
          >
            Guardar Traslado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}