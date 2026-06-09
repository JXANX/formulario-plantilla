import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, TablePagination, CircularProgress, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
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
  warning: '#B97D1A',
  danger: '#B83232',
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



/* ─── sx reutilizable para todos los Select native ── */
const sxSelect = {
  '& select': {
    fontFamily: '"IBM Plex Sans", sans-serif',
    fontSize: '14px',
    color: J.ink,
    backgroundColor: J.surface,
    paddingLeft: '12px',
    cursor: 'pointer',
  },
  '& select:focus': { backgroundColor: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: J.border,
    transition: 'border-color 0.15s ease',
  },
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

  const handleMunicipioChange = async (e: any) => {
    const mpioId = e.target.value;
    setSelectedMunicipio(mpioId); setSelectedPuesto(''); setSelectedMesa(''); setPuestos([]); setMesas([]);
    if (!mpioId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const handlePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setSelectedPuesto(puestoId); setSelectedMesa(''); setMesas([]);
    if (!puestoId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMesas(data.data);
    } catch (e) { console.error(e); }
  };

  /* ── Delete ────────────────────────────────────── */
  const handleOpenDelete = (t: Testigo) => { setSelectedTestigoForDelete(t); setDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!selectedTestigoForDelete) return;
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setSuccess('Testigo eliminado correctamente'); fetchTestigos(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('Error de conexión'); }
    finally { setDeleteDialogOpen(false); setSelectedTestigoForDelete(null); }
  };

  /* ── Move ──────────────────────────────────────── */
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
                if (mesData.success) { setMoveMesasList(mesData.data); if (testigo.mesaId) setMoveMesa(String(testigo.mesaId)); }
              }
            }
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleMoveDeptoChange = async (e: any) => {
    const deptoId = e.target.value;
    setMoveDepto(deptoId); setMoveMpio(''); setMovePuesto(''); setMoveMesa('');
    setMoveMpiosList([]); setMovePuestosList([]); setMoveMesasList([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMoveMpiosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMoveMpioChange = async (e: any) => {
    const mpioId = e.target.value;
    setMoveMpio(mpioId); setMovePuesto(''); setMoveMesa(''); setMovePuestosList([]); setMoveMesasList([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMovePuestosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMovePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setMovePuesto(puestoId); setMoveMesa(''); setMoveMesasList([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMoveMesasList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleConfirmMove = async () => {
    if (!selectedTestigoForMove || !moveMesa) { setMoveError('Por favor selecciona una mesa de destino'); return; }
    setMoveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForMove.id}/mover?nuevaMesaId=${moveMesa}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setSuccess('Testigo trasladado de mesa correctamente'); setMoveDialogOpen(false); fetchTestigos(); }
      else setMoveError(data.message || 'Error al trasladar');
    } catch { setMoveError('Error de conexión'); }
  };

  const filteredTestigos = testigos.filter(t => {
    const q = searchQuery.trim().toLowerCase();
    return (q === '' || t.documento.toLowerCase().includes(q) || t.nombreCompleto.toLowerCase().includes(q))
      && (selectedMunicipio === '' || String(t.municipioId) === String(selectedMunicipio))
      && (selectedPuesto === '' || String(t.puestoId) === String(selectedPuesto))
      && (selectedMesa === '' || String(t.mesaId) === String(selectedMesa));
  });


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
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth label="Buscar por Nombre o Documento"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: J.textMuted, mr: 1, fontSize: 20 }} /> } }}
              />
            </Grid>

            {/* Municipio */}
            <Grid size={{ xs: 12, sm: 4, md: 2.6 }}>
              <FormControl fullWidth>
                <InputLabel shrink sx={sxLabel}>Municipio</InputLabel>
                <Select native value={selectedMunicipio} label="Municipio" onChange={(e) => { handleMunicipioChange(e); setPage(0); }}>
                  <option value="">Todos</option>
                  {[...municipios]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Puesto */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth disabled={!selectedMunicipio}>
                <InputLabel shrink sx={sxLabel}>Puesto</InputLabel>
                <Select native value={selectedPuesto} label="Puesto" onChange={(e) => { handlePuestoChange(e); setPage(0); }}>
                  <option value="">Todos</option>
                  {[...puestos]
                    .sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es'))
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombrePuesto}</option>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mesa */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth disabled={!selectedPuesto}>
                <InputLabel shrink sx={sxLabel}>Mesa</InputLabel>
                <Select native value={selectedMesa} label="Mesa" onChange={(e) => { setSelectedMesa(e.target.value as string); setPage(0); }}>
                  <option value="">Todas</option>
                  {[...mesas]
                    .sort((a: any, b: any) => a.numeroMesa - b.numeroMesa)
                    .map((m: any) => {
                      const pct = m.capacidad > 0 ? m.ocupados / m.capacidad : 0;
                      const estado = pct >= 1 ? '🔴' : pct >= 0.75 ? '🟡' : '🟢';
                      return (
                        <option key={m.id} value={m.id}>
                          {estado} Mesa {m.numeroMesa} ({m.ocupados}/{m.capacidad})
                        </option>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Table ──────────────────────────────────── */}
      {
        loading ? (
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
                      <TableCell sx={{ fontSize: '15px', fontWeight: 600 }}>Mesa {t.numeroMesa}</TableCell>
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
        )
      }

      {/* ── Delete Dialog ─────────────────────────── */}
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

      {/* ── Move Dialog ───────────────────────────── */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${J.border}` } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: J.ink, fontSize: '20px', borderBottom: `1px solid ${J.border}` }}>
          Trasladar Testigo Electoral
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: J.border }}>
          <Typography sx={{ fontSize: '15px', color: J.textMuted, mb: 3 }}>
            Selecciona la nueva ubicación para{' '}
            <strong style={{ color: J.ink }}>{selectedTestigoForMove?.nombreCompleto}</strong>{' '}
            (Doc: {selectedTestigoForMove?.documento}).
          </Typography>
          {moveError && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{moveError}</Alert>}

          <Grid container spacing={2}>

            {/* Departamento */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink sx={sxLabel}>Departamento</InputLabel>
                <Select native value={moveDepto} label="Departamento" onChange={handleMoveDeptoChange} sx={sxSelect}>
                  <option value="">Seleccione...</option>
                  {[...moveDeptosList]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((d: any) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Municipio */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveDepto}>
                <InputLabel shrink sx={sxLabel}>Municipio</InputLabel>
                <Select native value={moveMpio} label="Municipio" onChange={handleMoveMpioChange} sx={sxSelect}>
                  <option value="">Seleccione...</option>
                  {[...moveMpiosList]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Puesto */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveMpio}>
                <InputLabel shrink sx={sxLabel}>Puesto de votación</InputLabel>
                <Select native value={movePuesto} label="Puesto de votación" onChange={handleMovePuestoChange} sx={sxSelect}>
                  <option value="">Seleccione...</option>
                  {[...movePuestosList]
                    .sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es'))
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombrePuesto}</option>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mesa — con indicadores de capacidad y grupo "Disponibles / Llenas" */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!movePuesto}>
                <InputLabel shrink sx={sxLabel}>Mesa de votación</InputLabel>
                <Select native value={moveMesa} label="Mesa de votación" onChange={(e) => setMoveMesa(e.target.value as string)}>
                  <option value="">Seleccione...</option>
                  {(() => {
                    const sorted = [...moveMesasList].sort((a: any, b: any) => a.numeroMesa - b.numeroMesa);
                    const available = sorted.filter((m: any) => m.ocupados < m.capacidad);
                    const full = sorted.filter((m: any) => m.ocupados >= m.capacidad);
                    return [
                      available.length > 0 && <option key="avail-hdr" disabled>── Disponibles ({available.length}) ──</option>,
                      ...available.map((m: any) => {
                        const isCurrent = selectedTestigoForMove?.mesaId === m.id;
                        const pct = m.capacidad > 0 ? m.ocupados / m.capacidad : 0;
                        const estado = pct >= 0.75 ? '🟡' : '🟢';
                        return (
                          <option key={m.id} value={m.id}>
                            {estado} Mesa {m.numeroMesa} — {m.ocupados}/{m.capacidad}{isCurrent ? ' ← actual' : ''}
                          </option>
                        );
                      }),
                      full.length > 0 && <option key="full-hdr" disabled>── Llenas ({full.length}) ──</option>,
                      ...full.map((m: any) => {
                        const isCurrent = selectedTestigoForMove?.mesaId === m.id;
                        return (
                          <option key={m.id} value={m.id} disabled={!isCurrent}>
                            🔴 Mesa {m.numeroMesa} — {m.ocupados}/{m.capacidad}{isCurrent ? ' ← actual' : ''}
                          </option>
                        );
                      }),
                    ].filter(Boolean);
                  })()}
                </Select>
              </FormControl>
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
            sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, px: 3, fontSize: '13px', letterSpacing: '0.1em', '&:hover': { bgcolor: J.blue }, '&:disabled': { bgcolor: 'rgba(26,31,46,0.35)', color: '#fff' } }}
          >
            Guardar Traslado
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}