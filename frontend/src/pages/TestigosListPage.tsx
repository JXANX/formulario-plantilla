import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, TablePagination, CircularProgress, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import { useWebSocket } from '../hooks/useWebSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

  const [testigos, setTestigos] = useState<Testigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');
  const [selectedMesa, setSelectedMesa] = useState('');

  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestigoForDelete, setSelectedTestigoForDelete] = useState<Testigo | null>(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedTestigoForMove, setSelectedTestigoForMove] = useState<Testigo | null>(null);

  // Move location states
  const [moveDepto, setMoveDepto] = useState('');
  const [moveMpio, setMoveMpio] = useState('');
  const [movePuesto, setMovePuesto] = useState('');
  const [moveMesa, setMoveMesa] = useState('');

  const [moveDeptosList, setMoveDeptosList] = useState<any[]>([]);
  const [moveMpiosList, setMoveMpiosList] = useState<any[]>([]);
  const [movePuestosList, setMovePuestosList] = useState<any[]>([]);
  const [moveMesasList, setMoveMesasList] = useState<any[]>([]);
  const [moveError, setMoveError] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchTestigos();
    fetchFilterCatalog();
  }, [dashboardUpdates]);

  const fetchTestigos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTestigos(data.data);
      } else {
        setError(data.message || 'Error al cargar los testigos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterCatalog = async () => {
    try {
      const token = localStorage.getItem('token');
      const deptosRes = await fetch(`${API_URL}/api/catalogo/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptosData = await deptosRes.json();
      if (deptosData.success && deptosData.data.length > 0) {
        const firstDeptoId = deptosData.data[0].id;
        const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${firstDeptoId}/municipios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) {
          setMunicipios(mpiosData.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMunicipioChange = async (e: any) => {
    const mpioId = e.target.value;
    setSelectedMunicipio(mpioId);
    setSelectedPuesto('');
    setSelectedMesa('');
    setPuestos([]);
    setMesas([]);

    if (!mpioId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setSelectedPuesto(puestoId);
    setSelectedMesa('');
    setMesas([]);

    if (!puestoId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMesas(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Action handlers
  const handleOpenDelete = (testigo: Testigo) => {
    setSelectedTestigoForDelete(testigo);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTestigoForDelete) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Testigo eliminado correctamente');
        fetchTestigos();
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTestigoForDelete(null);
    }
  };

  // Move Action handlers
  const handleOpenMove = async (testigo: Testigo) => {
    setSelectedTestigoForMove(testigo);
    setMoveError('');
    setMoveDepto('');
    setMoveMpio('');
    setMovePuesto('');
    setMoveMesa('');
    setMoveMpiosList([]);
    setMovePuestosList([]);
    setMoveMesasList([]);

    setMoveDialogOpen(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMoveDeptosList(data.data);

        if (testigo.departamentoId) {
          setMoveDepto(String(testigo.departamentoId));

          const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${testigo.departamentoId}/municipios`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const mpiosData = await mpiosRes.json();
          if (mpiosData.success) {
            setMoveMpiosList(mpiosData.data);
            if (testigo.municipioId) {
              setMoveMpio(String(testigo.municipioId));

              const puestosRes = await fetch(`${API_URL}/api/catalogo/municipios/${testigo.municipioId}/puestos`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const puestosData = await puestosRes.json();
              if (puestosData.success) {
                setMovePuestosList(puestosData.data);
                if (testigo.puestoId) {
                  setMovePuesto(String(testigo.puestoId));

                  const mesasRes = await fetch(`${API_URL}/api/catalogo/puestos/${testigo.puestoId}/mesas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const mesasData = await mesasRes.json();
                  if (mesasData.success) {
                    setMoveMesasList(mesasData.data);
                    if (testigo.mesaId) {
                      setMoveMesa(String(testigo.mesaId));
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveDeptoChange = async (e: any) => {
    const deptoId = e.target.value;
    setMoveDepto(deptoId);
    setMoveMpio('');
    setMovePuesto('');
    setMoveMesa('');
    setMoveMpiosList([]);
    setMovePuestosList([]);
    setMoveMesasList([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMoveMpiosList(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveMpioChange = async (e: any) => {
    const mpioId = e.target.value;
    setMoveMpio(mpioId);
    setMovePuesto('');
    setMoveMesa('');
    setMovePuestosList([]);
    setMoveMesasList([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMovePuestosList(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMovePuestoChange = async (e: any) => {
    const puestoId = e.target.value;
    setMovePuesto(puestoId);
    setMoveMesa('');
    setMoveMesasList([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMoveMesasList(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmMove = async () => {
    if (!selectedTestigoForMove || !moveMesa) {
      setMoveError('Por favor selecciona una mesa de destino');
      return;
    }

    setMoveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/${selectedTestigoForMove.id}/mover?nuevaMesaId=${moveMesa}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Testigo trasladado de mesa correctamente');
        setMoveDialogOpen(false);
        fetchTestigos();
      } else {
        setMoveError(data.message || 'Error al trasladar');
      }
    } catch (err) {
      setMoveError('Error de conexión');
    }
  };

  // Filter clientside witnesses
  const filteredTestigos = testigos.filter(t => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' ||
      t.documento.toLowerCase().includes(query) ||
      t.nombreCompleto.toLowerCase().includes(query);

    const matchesMpio = selectedMunicipio === '' || String(t.municipioId) === String(selectedMunicipio);
    const matchesPuesto = selectedPuesto === '' || String(t.puestoId) === String(selectedPuesto);
    const matchesMesa = selectedMesa === '' || String(t.mesaId) === String(selectedMesa);

    return matchesSearch && matchesMpio && matchesPuesto && matchesMesa;
  });

  const handleChangePage = (_event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary.main">
          Listado de Testigos Electorales
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 'medium' }}>
          Total registrados: <strong>{testigos.length}</strong> | Filtrados: <strong>{filteredTestigos.length}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* FILTROS Y BÚSQUEDA */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por Nombre o Documento"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2.6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Municipio</InputLabel>
                <Select
                  value={selectedMunicipio}
                  label="Municipio"
                  onChange={(e) => { handleMunicipioChange(e); setPage(0); }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...municipios]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((m: any) => (
                      <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                <InputLabel>Puesto</InputLabel>
                <Select
                  value={selectedPuesto}
                  label="Puesto"
                  onChange={(e) => { handlePuestoChange(e); setPage(0); }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...puestos]
                    .sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es'))
                    .map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>{p.nombrePuesto}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small" disabled={!selectedPuesto}>
                <InputLabel>Mesa</InputLabel>
                <Select
                  value={selectedMesa}
                  label="Mesa"
                  onChange={(e) => { setSelectedMesa(e.target.value as string); setPage(0); }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {[...mesas]
                    .sort((a: any, b: any) => a.numeroMesa - b.numeroMesa)
                    .map((m: any) => (
                      <MenuItem key={m.id} value={m.id}>Mesa {m.numeroMesa}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* TABLA DE RESULTADOS */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0d1b3e' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Completo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Celular</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Municipio</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Puesto</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mesa</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Registrado por</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTestigos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No se encontraron testigos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestigos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t.documento}</TableCell>
                      <TableCell>{t.nombreCompleto}</TableCell>
                      <TableCell>{t.celular}</TableCell>
                      <TableCell>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: t.tipoTestigo === 'PRINCIPAL' ? '#e3f2fd' : '#fff3e0',
                          color: t.tipoTestigo === 'PRINCIPAL' ? '#1976d2' : '#f57c00'
                        }}>
                          {t.tipoTestigo}
                        </span>
                      </TableCell>
                      <TableCell>{t.nombreMunicipio}</TableCell>
                      <TableCell>{t.nombrePuesto}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mesa {t.numeroMesa}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{t.registradoPor}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Mover de Mesa">
                            <IconButton color="primary" onClick={() => handleOpenMove(t)}>
                              <SwapHorizIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar Testigo">
                            <IconButton color="error" onClick={() => handleOpenDelete(t)}>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>
      )}

      {/* DIÁLOGO ELIMINAR */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          ¿Eliminar Testigo?
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al testigo{' '}
            <strong>{selectedTestigoForDelete?.nombreCompleto}</strong> con documento{' '}
            <strong>{selectedTestigoForDelete?.documento}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Confirmar Eliminación
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO MOVER DE MESA */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Trasladar Testigo Electoral
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Selecciona la nueva ubicación electoral para el testigo{' '}
            <strong>{selectedTestigoForMove?.nombreCompleto}</strong> (Documento: {selectedTestigoForMove?.documento}).
          </Typography>

          {moveError && <Alert severity="error" sx={{ mb: 2 }}>{moveError}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={moveDepto}
                  label="Departamento"
                  onChange={handleMoveDeptoChange}
                >
                  {[...moveDeptosList]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveDepto}>
                <InputLabel>Municipio</InputLabel>
                <Select
                  value={moveMpio}
                  label="Municipio"
                  onChange={handleMoveMpioChange}
                >
                  {[...moveMpiosList]
                    .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map((m: any) => (
                      <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!moveMpio}>
                <InputLabel>Puesto</InputLabel>
                <Select
                  value={movePuesto}
                  label="Puesto"
                  onChange={handleMovePuestoChange}
                >
                  {[...movePuestosList]
                    .sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es'))
                    .map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>{p.nombrePuesto}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled={!movePuesto}>
                <InputLabel>Mesa</InputLabel>
                <Select
                  value={moveMesa}
                  label="Mesa"
                  onChange={(e) => setMoveMesa(e.target.value as string)}
                >
                  {[...moveMesasList]
                    .sort((a: any, b: any) => a.numeroMesa - b.numeroMesa)
                    .map((m: any) => {
                      const isAvailable = m.ocupados < m.capacidad;
                      const isCurrent = selectedTestigoForMove?.mesaId === m.id;
                      return (
                        <MenuItem
                          key={m.id}
                          value={m.id}
                          disabled={!isAvailable && !isCurrent}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: isCurrent ? 'primary.main' : (!isAvailable ? 'text.disabled' : 'inherit'),
                            fontWeight: isCurrent ? 'bold' : 'normal'
                          }}
                        >
                          <span>Mesa {m.numeroMesa} {isCurrent ? '(Actual)' : ''}</span>
                          <span>({m.ocupados}/{m.capacidad} ocupados)</span>
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmMove}
            color="primary"
            variant="contained"
            disabled={!moveMesa || moveMesa === String(selectedTestigoForMove?.mesaId)}
          >
            Guardar Traslado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}