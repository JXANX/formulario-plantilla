import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, TablePagination, CircularProgress, Tooltip
} from '@mui/material';
import DeleteIcon    from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon    from '@mui/icons-material/Search';
import { useWebSocket } from '../hooks/useWebSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink:     '#1A1F2E',
  blue:    '#2952CC',
  gold:    '#C9973A',
  border:  '#E2DDD6',
  surface: '#F8F7F4',
  muted:   '#F0EEE9',
  textMuted:'#7A7A7A',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger:  '#B83232',
};

interface Testigo {
  id: number;
  documento: string;
  nombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreCompleto: string;
  celular: string;
  correo: string;
  nombreOrganizacion: string;
  tipoTestigo: string;
  fechaRegistro: string;
  mesaId: number;
  numeroMesa: number;
  puestoId: number;
  nombrePuesto: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  registradoPor: string;
}

export default function TestigosListPage() {
  const { dashboardUpdates } = useWebSocket();

  const [testigos,  setTestigos]  = useState<Testigo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto,    setSelectedPuesto]    = useState('');
  const [selectedMesa,      setSelectedMesa]      = useState('');

  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos,    setPuestos]    = useState<any[]>([]);
  const [mesas,      setMesas]      = useState<any[]>([]);

  const [deleteDialogOpen,          setDeleteDialogOpen]          = useState(false);
  const [selectedTestigoForDelete,  setSelectedTestigoForDelete]  = useState<Testigo | null>(null);
  const [moveDialogOpen,            setMoveDialogOpen]            = useState(false);
  const [selectedTestigoForMove,    setSelectedTestigoForMove]    = useState<Testigo | null>(null);

  const [moveDepto,      setMoveDepto]      = useState('');
  const [moveMpio,       setMoveMpio]       = useState('');
  const [movePuesto,     setMovePuesto]     = useState('');
  const [moveMesa,       setMoveMesa]       = useState('');
  const [moveDeptosList, setMoveDeptosList] = useState<any[]>([]);
  const [moveMpiosList,  setMoveMpiosList]  = useState<any[]>([]);
  const [movePuestosList,setMovePuestosList]= useState<any[]>([]);
  const [moveMesasList,  setMoveMesasList]  = useState<any[]>([]);
  const [moveError,      setMoveError]      = useState('');

  const [page,         setPage]         = useState(0);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  useEffect(() => { fetchTestigos(); fetchFilterCatalog(); }, [dashboardUpdates]);

  /* ── Data fetching (unchanged logic) ───────────── */
  const fetchTestigos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/testigos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setTestigos(data.data);
      else              setError(data.message || 'Error al cargar los testigos');
    } catch { setError('Error de conexión con el servidor'); }
    finally  { setLoading(false); }
  };

  const fetchFilterCatalog = async () => {
    try {
      const token    = localStorage.getItem('token');
      const deptosRes  = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const deptosData = await deptosRes.json();
      if (deptosData.success && deptosData.data.length > 0) {
        const firstId = deptosData.data[0].id;
        const mpiosRes  = await fetch(`${API_URL}/api/catalogo/departamentos/${firstId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) setMunicipios(mpiosData.data);
      }
    } catch (e) { console.error(e); }
  };

  const handleMunicipioChange = async (e: any) => {
    const mpioId = e.target.value;
    setSelectedMunicipio(mpioId); setSelectedPuesto(''); setSelectedMesa(''); setPuestos([]); setMesas([]);
    if (!mpioId) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const handlePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setSelectedPuesto(puestoId); setSelectedMesa(''); setMesas([]);
    if (!puestoId) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMesas(data.data);
    } catch (e) { console.error(e); }
  };

  const handleOpenDelete = (t: Testigo) => { setSelectedTestigoForDelete(t); setDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!selectedTestigoForDelete) return;
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/testigos/${selectedTestigoForDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) { setSuccess('Testigo eliminado correctamente'); fetchTestigos(); }
      else               setError(data.message || 'Error al eliminar');
    } catch { setError('Error de conexión'); }
    finally  { setDeleteDialogOpen(false); setSelectedTestigoForDelete(null); }
  };

  const handleOpenMove = async (testigo: Testigo) => {
    setSelectedTestigoForMove(testigo);
    setMoveError(''); setMoveDepto(''); setMoveMpio(''); setMovePuesto(''); setMoveMesa('');
    setMoveMpiosList([]); setMovePuestosList([]); setMoveMesasList([]);
    setMoveDialogOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) {
        setMoveDeptosList(data.data);
        if (testigo.departamentoId) {
          setMoveDepto(String(testigo.departamentoId));
          const mpiosRes  = await fetch(`${API_URL}/api/catalogo/departamentos/${testigo.departamentoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
          const mpiosData = await mpiosRes.json();
          if (mpiosData.success) {
            setMoveMpiosList(mpiosData.data);
            if (testigo.municipioId) {
              setMoveMpio(String(testigo.municipioId));
              const puestosRes  = await fetch(`${API_URL}/api/catalogo/municipios/${testigo.municipioId}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
              const puestosData = await puestosRes.json();
              if (puestosData.success) {
                setMovePuestosList(puestosData.data);
                if (testigo.puestoId) {
                  setMovePuesto(String(testigo.puestoId));
                  const mesasRes  = await fetch(`${API_URL}/api/catalogo/puestos/${testigo.puestoId}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
                  const mesasData = await mesasRes.json();
                  if (mesasData.success) { setMoveMesasList(mesasData.data); if (testigo.mesaId) setMoveMesa(String(testigo.mesaId)); }
                }
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
      const res   = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMoveMpiosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMoveMpioChange = async (e: any) => {
    const mpioId = e.target.value;
    setMoveMpio(mpioId); setMovePuesto(''); setMoveMesa(''); setMovePuestosList([]); setMoveMesasList([]);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMovePuestosList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleMovePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setMovePuesto(puestoId); setMoveMesa(''); setMoveMesasList([]);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMoveMesasList(data.data);
    } catch (e) { console.error(e); }
  };

  const handleConfirmMove = async () => {
    if (!selectedTestigoForMove || !moveMesa) { setMoveError('Por favor selecciona una mesa de destino'); return; }
    setMoveError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/testigos/${selectedTestigoForMove.id}/mover?nuevaMesaId=${moveMesa}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) { setSuccess('Testigo trasladado de mesa correctamente'); setMoveDialogOpen(false); fetchTestigos(); }
      else               setMoveError(data.message || 'Error al trasladar');
    } catch { setMoveError('Error de conexión'); }
  };

  const filteredTestigos = testigos.filter(t => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' || t.documento.toLowerCase().includes(q) || t.nombreCompleto.toLowerCase().includes(q);
    return matchesSearch
      && (selectedMunicipio === '' || String(t.municipioId) === String(selectedMunicipio))
      && (selectedPuesto    === '' || String(t.puestoId)    === String(selectedPuesto))
      && (selectedMesa      === '' || String(t.mesaId)      === String(selectedMesa));
  });

  /* ── Render ─────────────────────────────────────── */
  return (
    <Box>
      {/* Page heading */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
            Registro Institucional
          </Typography>
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: '28px', color: J.ink }}>
            Listado de Testigos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: J.textMuted }}>
            Total: <strong style={{ color: J.ink }}>{testigos.length}</strong>
            &nbsp;·&nbsp;
            Filtrados: <strong style={{ color: J.blue }}>{filteredTestigos.length}</strong>
          </Typography>
        </Box>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2.5, borderRadius: 0 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 0 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Filters ── */}
      <Card sx={{ mb: 3, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2 }}>
            Filtros de búsqueda
          </Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth size="small"
                label="Buscar por Nombre o Documento"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: J.textMuted, mr: 1, fontSize: 18 }} /> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Municipio</InputLabel>
                <Select value={selectedMunicipio} label="Municipio" onChange={(e) => { handleMunicipioChange(e); setPage(0); }}>
                  <MenuItem value="">Todos</MenuItem>
                  {[...municipios].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => (
                    <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                <InputLabel>Puesto</InputLabel>
                <Select value={selectedPuesto} label="Puesto" onChange={(e) => { handlePuestoChange(e); setPage(0); }}>
                  <MenuItem value="">Todos</MenuItem>
                  {[...puestos].sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>{p.nombrePuesto}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedPuesto}>
                <InputLabel>Mesa</InputLabel>
                <Select value={selectedMesa} label="Mesa" onChange={(e) => { setSelectedMesa(e.target.value as string); setPage(0); }}>
                  <MenuItem value="">Todas</MenuItem>
                  {[...mesas].sort((a: any, b: any) => a.numeroMesa - b.numeroMesa).map((m: any) => (
                    <MenuItem key={m.id} value={m.id}>Mesa {m.numeroMesa}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress size={32} sx={{ color: J.blue }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: J.ink }}>
              <TableRow>
                {['Documento','Nombre Completo','Celular','Tipo','Municipio','Puesto','Mesa','Registrado por','Acciones'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderBottom: 'none', py: 1.5, whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTestigos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: J.textMuted, fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', letterSpacing: '0.1em' }}>
                    No se encontraron testigos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestigos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
                  <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                    <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 600, color: J.ink }}>{t.documento}</TableCell>
                    <TableCell sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13.5px' }}>{t.nombreCompleto}</TableCell>
                    <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }}>{t.celular}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1, py: 0.3,
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          bgcolor: t.tipoTestigo === 'PRINCIPAL' ? 'rgba(41,82,204,0.09)' : 'rgba(185,125,26,0.1)',
                          color:   t.tipoTestigo === 'PRINCIPAL' ? J.blue : J.warning,
                          border:  t.tipoTestigo === 'PRINCIPAL' ? `1px solid rgba(41,82,204,0.22)` : `1px solid rgba(185,125,26,0.22)`,
                        }}
                      >
                        {t.tipoTestigo}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{t.nombreMunicipio}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{t.nombrePuesto}</TableCell>
                    <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 600 }}>Mesa {t.numeroMesa}</TableCell>
                    <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', color: J.textMuted }}>{t.registradoPor}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Mover de Mesa">
                          <IconButton size="small" onClick={() => handleOpenMove(t)} sx={{ color: J.blue, '&:hover': { bgcolor: 'rgba(41,82,204,0.08)' } }}>
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Testigo">
                          <IconButton size="small" onClick={() => handleOpenDelete(t)} sx={{ color: J.danger, '&:hover': { bgcolor: 'rgba(184,50,50,0.08)' } }}>
                            <DeleteIcon fontSize="small" />
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
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
            sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', borderTop: `1px solid ${J.border}` }}
          />
        </TableContainer>
      )}

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${J.border}` } } }}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, color: J.danger, fontSize: '18px', borderBottom: `1px solid ${J.border}` }}>
          ¿Eliminar Testigo?
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '14px', color: J.ink }}>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{selectedTestigoForDelete?.nombreCompleto}</strong> con documento{' '}
            <strong>{selectedTestigoForDelete?.documento}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 0, color: J.textMuted, fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.1em' }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} sx={{ bgcolor: J.danger, color: '#fff', borderRadius: 0, px: 3, fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', '&:hover': { bgcolor: '#8f2020' } }}>
            Confirmar Eliminación
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Move Dialog ── */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${J.border}` } } }}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, color: J.ink, fontSize: '18px', borderBottom: `1px solid ${J.border}` }}>
          Trasladar Testigo Electoral
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: J.border }}>
          <Typography sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', color: J.textMuted, mb: 3 }}>
            Selecciona la nueva ubicación para <strong style={{ color: J.ink }}>{selectedTestigoForMove?.nombreCompleto}</strong> (Doc: {selectedTestigoForMove?.documento}).
          </Typography>
          {moveError && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{moveError}</Alert>}
          <Grid container spacing={2}>
            {[
              { label: 'Departamento', value: moveDepto, handler: handleMoveDeptoChange, items: moveDeptosList, disabled: false,     nameKey: 'nombre' },
              { label: 'Municipio',    value: moveMpio,  handler: handleMoveMpioChange,  items: moveMpiosList,  disabled: !moveDepto, nameKey: 'nombre' },
              { label: 'Puesto',       value: movePuesto,handler: handleMovePuestoChange,items: movePuestosList,disabled: !moveMpio,  nameKey: 'nombrePuesto' },
            ].map(({ label, value, handler, items, disabled, nameKey }) => (
              <Grid key={label} size={{ xs: 12 }}>
                <FormControl fullWidth size="small" disabled={disabled}>
                  <InputLabel>{label}</InputLabel>
                  <Select value={value} label={label} onChange={handler}>
                    {[...items].sort((a: any, b: any) => (a[nameKey] || '').localeCompare(b[nameKey] || '', 'es')).map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>{d[nameKey]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!movePuesto}>
                <InputLabel>Mesa</InputLabel>
                <Select value={moveMesa} label="Mesa" onChange={(e) => setMoveMesa(e.target.value as string)}>
                  {[...moveMesasList].sort((a: any, b: any) => a.numeroMesa - b.numeroMesa).map((m: any) => {
                    const isAvailable = m.ocupados < m.capacidad;
                    const isCurrent   = selectedTestigoForMove?.mesaId === m.id;
                    return (
                      <MenuItem key={m.id} value={m.id} disabled={!isAvailable && !isCurrent}
                        sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', color: isCurrent ? J.blue : (!isAvailable ? J.textMuted : 'inherit'), fontWeight: isCurrent ? 700 : 400 }}>
                        <span>Mesa {m.numeroMesa}{isCurrent ? ' (Actual)' : ''}</span>
                        <span style={{ opacity: 0.65 }}>({m.ocupados}/{m.capacidad} ocupados)</span>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setMoveDialogOpen(false)} sx={{ borderRadius: 0, color: J.textMuted, fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.1em' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmMove}
            disabled={!moveMesa || moveMesa === String(selectedTestigoForMove?.mesaId)}
            sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, px: 3, fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', '&:hover': { bgcolor: J.blue }, '&:disabled': { bgcolor: 'rgba(26,31,46,0.35)', color: '#fff' } }}
          >
            Guardar Traslado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}