import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, IconButton, Tabs, Tab, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import GavelIcon from '@mui/icons-material/Gavel';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useToast } from '../context/ToastContext';
import { J, sxSelect } from '../theme/theme';
import { votosService } from '../services/votos.service';
import type { VotosResumen, VotosDetalleMesa } from '../services/votos.service';
import { catalogService } from '../services/catalog.service';
import { usuariosService } from '../services/usuarios.service';
import type { Usuario } from '../services/usuarios.service';
import { authService } from '../services/auth.service';

export default function DashboardVotosPage() {
  const toast = useToast();
  
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.rol === 'SUPER_ADMIN' || currentUser?.rol === 'ADMIN';
  const hasTabsAccess = isAdmin || currentUser?.rol === 'ABOGADO';

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<VotosResumen | null>(null);
  const [discrepancias, setDiscrepancias] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);

  // Assignment section states
  const [operarios, setOperarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  
  const [selectedOperarioId, setSelectedOperarioId] = useState<string>('');
  const [selectedDeptoId, setSelectedDeptoId] = useState<string>('');
  const [selectedMpioId, setSelectedMpioId] = useState<string>('');
  const [selectedPuestoId, setSelectedPuestoId] = useState<string>('');
  const [selectedMesaId, setSelectedMesaId] = useState<string>('');
  const [submittingAsig, setSubmittingAsig] = useState(false);

  // Discrepancy comparison dialog states
  const [openComparisonDialog, setOpenComparisonDialog] = useState(false);
  const [comparingMesaId, setComparingMesaId] = useState<number | null>(null);
  const [detalleMesa, setDetalleMesa] = useState<VotosDetalleMesa | null>(null);
  const [editCounts, setEditCounts] = useState<Record<string, { reg: number; test: number }>>({});
  const [savingResolution, setSavingResolution] = useState(false);
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadCatalogs();
  }, [tabIndex]);

  const loadData = () => {
    setLoading(true);
    if (tabIndex === 0) {
      votosService.obtenerResumen()
        .then(res => {
          if (res.success) setResumen(res.data);
          else toast.error('Error al cargar resumen');
        })
        .catch(() => toast.error('Error al cargar resumen'))
        .finally(() => setLoading(false));
    } else if (tabIndex === 1 && hasTabsAccess) {
      votosService.obtenerDiscrepancias()
        .then(res => {
          if (res.success) setDiscrepancias(res.data);
          else toast.error('Error al cargar discrepancias');
        })
        .catch(() => toast.error('Error al cargar discrepancias'))
        .finally(() => setLoading(false));
    } else if (tabIndex === 2 && isAdmin) {
      votosService.obtenerTodasAsignaciones()
        .then(res => {
          if (res.success) setAsignaciones(res.data);
          else toast.error('Error al cargar asignaciones');
        })
        .catch(() => toast.error('Error al cargar asignaciones'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  const loadCatalogs = () => {
    // Load operarios
    usuariosService.listar()
      .then(res => {
        if (res.success) {
          setOperarios(res.data.filter((u: Usuario) => u.rol === 'OPERARIO' && u.activo));
        }
      });

    // Load Deptos
    catalogService.getDepartamentos()
      .then(res => {
        if (res.success) setDepartamentos(res.data);
      });
  };

  useEffect(() => {
    if (selectedDeptoId) {
      catalogService.getMunicipios(Number(selectedDeptoId)).then(res => { if (res.success) setMunicipios(res.data); });
      setMunicipios([]); setPuestos([]); setMesas([]);
      setSelectedMpioId(''); setSelectedPuestoId(''); setSelectedMesaId('');
    }
  }, [selectedDeptoId]);

  useEffect(() => {
    if (selectedMpioId) {
      catalogService.getPuestos(Number(selectedMpioId)).then(res => { if (res.success) setPuestos(res.data); });
      setPuestos([]); setMesas([]);
      setSelectedPuestoId(''); setSelectedMesaId('');
    }
  }, [selectedMpioId]);

  useEffect(() => {
    if (selectedPuestoId) {
      catalogService.getMesas(Number(selectedPuestoId)).then(res => { if (res.success) setMesas(res.data); });
      setMesas([]);
      setSelectedMesaId('');
    }
  }, [selectedPuestoId]);

  const handleManualAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperarioId || !selectedMesaId) {
      toast.error('Seleccione el operario y la mesa');
      return;
    }
    setSubmittingAsig(true);
    votosService.crearAsignacion(Number(selectedOperarioId), Number(selectedMesaId))
      .then(res => {
        if (res.success) {
          toast.success('Mesa asignada correctamente');
          setSelectedMesaId('');
          loadData();
        } else {
          toast.error(res.message || 'Error al asignar mesa');
        }
      })
      .catch(() => toast.error('Error al asignar mesa'))
      .finally(() => setSubmittingAsig(false));
  };

  const handleDeleteAssignment = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      votosService.eliminarAsignacion(id)
        .then(res => {
          if (res.success) {
            toast.success('Asignación eliminada');
            loadData();
          } else {
            toast.error(res.message || 'Error al eliminar');
          }
        });
    }
  };

  const handleAutoBalance = () => {
    if (window.confirm('¿Está seguro de que desea realizar el balanceo automático? Esto borrará las asignaciones previas.')) {
      setLoading(true);
      votosService.autoBalancear()
        .then(res => {
          if (res.success) {
            toast.success('Mesas distribuidas equitativamente entre los operarios activos');
            loadData();
          } else {
            toast.error(res.message || 'Error al balancear');
          }
        })
        .catch(() => toast.error('Error de red al balancear'))
        .finally(() => setLoading(false));
    }
  };

  const handleClearAssignments = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todas las asignaciones?')) {
      setLoading(true);
      votosService.limpiarAsignaciones()
        .then(res => {
          if (res.success) {
            toast.success('Todas las asignaciones han sido borradas');
            loadData();
          } else {
            toast.error(res.message || 'Error al borrar asignaciones');
          }
        })
        .catch(() => toast.error('Error al borrar asignaciones'))
        .finally(() => setLoading(false));
    }
  };

  // Discrepancy comparison dialog
  const handleOpenComparison = (mesaId: number) => {
    setComparingMesaId(mesaId);
    setDetalleMesa(null);
    setOpenComparisonDialog(true);
    
    votosService.obtenerDetalleMesa(mesaId)
      .then(res => {
        if (res.success) {
          const detail: VotosDetalleMesa = res.data;
          setDetalleMesa(detail);
          
          const map: Record<string, { reg: number; test: number }> = {};
          detail.renglones.forEach(r => {
            const key = `${r.tipoVotoId}_${r.candidatoId || 'null'}`;
            map[key] = { reg: r.votosRegistraduria, test: r.votosTestigo };
          });
          setEditCounts(map);
        } else {
          toast.error('Error al cargar detalle de mesa');
          setOpenComparisonDialog(false);
        }
      })
      .catch(() => {
        toast.error('Error al cargar detalle');
        setOpenComparisonDialog(false);
      });
  };

  const handleDialogCountChange = (key: string, value: string, field: 'reg' | 'test') => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setEditCounts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: num
      }
    }));
  };

  const handleResolveDiscrepancy = async () => {
    if (!comparingMesaId || !detalleMesa) return;
    setSavingResolution(true);
    try {
      for (const r of detalleMesa.renglones) {
        const key = `${r.tipoVotoId}_${r.candidatoId || 'null'}`;
        const counts = editCounts[key] || { reg: 0, test: 0 };
        
        await votosService.registrarVotosRegistraduria(comparingMesaId, r.candidatoId || null, r.tipoVotoId, counts.reg);
        await votosService.registrarVotosTestigo(comparingMesaId, r.candidatoId || null, r.tipoVotoId, counts.test, detalleMesa.testigoId);
      }
      toast.success('Discrepancias resueltas y guardadas');
      setOpenComparisonDialog(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar cambios');
    } finally {
      setSavingResolution(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchZoomImage = (fotoId: number) => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/votos/fotos/ver/${fotoId}/archivo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      setZoomImgUrl(url);
    })
    .catch(() => toast.error('Error al cargar foto'));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '28px', mb: 1 }}>Control Electoral Central</Typography>
          <Typography variant="body2" sx={{ color: J.textMuted }}>
            Monitoreo en tiempo real del conteo de votos de las mesas y resolución de discrepancias jurídicas
          </Typography>
        </Box>
        <IconButton onClick={loadData} sx={{ color: J.blue }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      {hasTabsAccess && (
        <Tabs 
          value={tabIndex} 
          onChange={(_, idx) => setTabIndex(idx)} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 4 }}
        >
          <Tab icon={<BarChartIcon />} label="Estadísticas de Avance" />
          <Tab icon={<GavelIcon />} label="Resolución de Discrepancias" />
          {isAdmin && <Tab icon={<AutoAwesomeIcon />} label="Asignación y Distribución" />}
        </Tabs>
      )}
      {!hasTabsAccess && (
        <Typography variant="h6" sx={{ mb: 4, color: J.ink, borderBottom: `2px solid ${J.gold}`, pb: 1, display: 'inline-block' }}>
           <BarChartIcon sx={{ mr: 1, verticalAlign: 'bottom' }}/> Estadísticas de Avance
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TAB 0: Summary stats, municipios & operarios */}
          {tabIndex === 0 && resumen && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Stat Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr 1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.blue}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Mesas
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700 }}>
                        {resumen.totalMesas}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.success}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Reportadas Registraduría
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.success }}>
                        {resumen.mesasReportadasRegistraduria}
                      </Typography>
                      <Typography variant="caption" sx={{ color: J.textMuted }}>
                        {resumen.totalMesas > 0 ? ((resumen.mesasReportadasRegistraduria / resumen.totalMesas) * 100).toFixed(1) : 0}% de avance
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.gold}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Reportadas Testigo
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.gold }}>
                        {resumen.mesasReportadasTestigo}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.danger}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Mesas con Discrepancia
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.danger }}>
                        {resumen.mesasConDiscrepancias}
                      </Typography>
                      <Typography variant="caption" sx={{ color: J.textMuted }}>
                        {resumen.totalDiscrepanciasActivas} en conflicto
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.blue}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Votos Registraduría
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.blue }}>
                        {resumen.totalVotosRegistraduria?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Card sx={{ borderLeft: `6px solid ${J.gold}` }}>
                    <CardContent>
                      <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Votos Testigo
                      </Typography>
                      <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.gold }}>
                        {resumen.totalVotosTestigo?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Municipios Coverage */}
              <Card>
                <CardContent sx={{ px: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', px: 3, mb: 2 }}>
                    Avance de Cobertura por Municipio
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Municipio</TableCell>
                          <TableCell align="center">Mesas Totales</TableCell>
                          <TableCell align="center">Mesas Digitadas (Registraduría)</TableCell>
                          <TableCell align="center">Mesas Reportadas (Testigo)</TableCell>
                          <TableCell align="center">Mesas con Conflicto</TableCell>
                          <TableCell align="right">Avance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.municipios.map((m) => (
                          <TableRow key={m.municipioId}>
                            <TableCell sx={{ fontWeight: 600 }}>{m.municipioNombre}</TableCell>
                            <TableCell align="center">{m.totalMesas}</TableCell>
                            <TableCell align="center">{m.reportadasRegistraduria}</TableCell>
                            <TableCell align="center">{m.reportadasTestigo}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: m.conDiscrepancias > 0 ? J.danger : J.success }}>
                                {m.conDiscrepancias > 0 ? <ErrorIcon sx={{ fontSize: 16 }} /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.conDiscrepancias}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: J.blue }}>
                              {m.porcentajeAvance.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Operarios Activity */}
              <Card>
                <CardContent sx={{ px: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', px: 3, mb: 2 }}>
                    Carga de Trabajo por Operario
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre Operario</TableCell>
                          <TableCell align="center">Mesas Asignadas</TableCell>
                          <TableCell align="center">Digitadas (Registraduría)</TableCell>
                          <TableCell align="center">Reportadas (Testigo)</TableCell>
                          <TableCell align="center">Mesas con Discrepancia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.operarios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: J.textMuted }}>
                              No hay operarios con mesas asignadas
                            </TableCell>
                          </TableRow>
                        ) : (
                          resumen.operarios.map((o) => (
                            <TableRow key={o.operarioId}>
                              <TableCell sx={{ fontWeight: 600 }}>{o.operarioNombre}</TableCell>
                              <TableCell align="center">{o.mesasAsignadas}</TableCell>
                              <TableCell align="center">{o.reportadasRegistraduria}</TableCell>
                              <TableCell align="center">{o.reportadasTestigo}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: o.conDiscrepancias > 0 ? J.danger : J.success }}>
                                  {o.conDiscrepancias > 0 ? <ErrorIcon sx={{ fontSize: 16 }} /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{o.conDiscrepancias}</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* TAB 1: Resolution of Discrepancies */}
          {tabIndex === 1 && isAdmin && (
            <Card>
              <CardContent sx={{ px: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', px: 3, mb: 2 }}>
                  Mesas con Diferencias entre Registraduría y Testigo
                </Typography>
                <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Municipio</TableCell>
                        <TableCell>Puesto</TableCell>
                        <TableCell align="center">Mesa</TableCell>
                        <TableCell>Candidato / Tipo Voto</TableCell>
                        <TableCell align="center">Registraduría</TableCell>
                        <TableCell align="center">Testigo</TableCell>
                        <TableCell align="center">Diferencia</TableCell>
                        <TableCell align="right">Auditoría</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discrepancias.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: J.textMuted }}>
                            Excelente. No hay discrepancias activas registradas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        discrepancias.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{d.mesa?.puesto?.municipio?.nombre}</TableCell>
                            <TableCell>{d.mesa?.puesto?.nombrePuesto}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Mesa #{d.mesa?.numeroMesa}</TableCell>
                            <TableCell>
                              {d.candidato ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.candidato.nombre}</Typography>
                                  <Typography sx={{ fontSize: '0.8rem', color: J.textMuted }}>#{d.candidato.numeroTarjeton}</Typography>
                                </Box>
                              ) : (
                                <Typography sx={{ fontWeight: 600 }}>{d.tipoVoto?.nombre}</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: J.blue }}>{d.votosRegistraduria}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: J.gold }}>{d.votosTestigo}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ color: J.danger, fontWeight: 700, fontSize: '1rem' }}>
                                {d.diferencia > 0 ? `+${d.diferencia}` : d.diferencia}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenComparison(d.mesa.id)}
                              >
                                Comparar E14
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Work allocation */}
          {tabIndex === 2 && isAdmin && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Balancing actions */}
              <Card>
                <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>Reparto de Trabajo Equitativo</Typography>
                    <Typography variant="body2" sx={{ color: J.textMuted }}>
                      Distribuya automáticamente todas las mesas registradas del departamento entre los operarios activos.
                    </Typography>
                  </Box>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleAutoBalance}
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Balanceo Automático
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleClearAssignments}
                    startIcon={<DeleteIcon />}
                    sx={{ color: J.danger, borderColor: J.border, '&:hover': { borderColor: J.danger, bgcolor: J.dangerBg } }}
                  >
                    Limpiar Asignaciones
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Assignment Form */}
              <Card>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Asignar Mesa Manualmente</Typography>
                  <form onSubmit={handleManualAssignment}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '3fr 2.25fr 2.25fr 2.25fr 2.25fr' }, gap: 3, alignItems: 'center' }}>
                      <Box>
                        <TextField
                          select
                          fullWidth
                          label="Operario"
                          value={selectedOperarioId}
                          onChange={(e) => setSelectedOperarioId(e.target.value)}
                          required
                          sx={sxSelect}
                        >
                          <MenuItem value="">Seleccione...</MenuItem>
                          {operarios.map(op => (
                            <MenuItem key={op.id} value={String(op.id)}>{op.nombre}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box>
                        <TextField
                          select
                          fullWidth
                          label="Departamento"
                          value={selectedDeptoId}
                          onChange={(e) => setSelectedDeptoId(e.target.value)}
                          required
                          sx={sxSelect}
                        >
                          <MenuItem value="">Seleccione...</MenuItem>
                          {departamentos.map(d => (
                            <MenuItem key={d.id} value={String(d.id)}>{d.nombre}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box>
                        <TextField
                          select
                          fullWidth
                          label="Municipio"
                          value={selectedMpioId}
                          onChange={(e) => setSelectedMpioId(e.target.value)}
                          required
                          disabled={!selectedDeptoId}
                          sx={sxSelect}
                        >
                          <MenuItem value="">Seleccione...</MenuItem>
                          {municipios.map(m => (
                            <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box>
                        <TextField
                          select
                          fullWidth
                          label="Puesto"
                          value={selectedPuestoId}
                          onChange={(e) => setSelectedPuestoId(e.target.value)}
                          required
                          disabled={!selectedMpioId}
                          sx={sxSelect}
                        >
                          <MenuItem value="">Seleccione...</MenuItem>
                          {puestos.map(p => (
                            <MenuItem key={p.id} value={String(p.id)}>{p.nombrePuesto}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box>
                        <TextField
                          select
                          fullWidth
                          label="Mesa"
                          value={selectedMesaId}
                          onChange={(e) => setSelectedMesaId(e.target.value)}
                          required
                          disabled={!selectedPuestoId}
                          sx={sxSelect}
                        >
                          <MenuItem value="">Seleccione...</MenuItem>
                          {mesas.map(m => (
                            <MenuItem key={m.id} value={String(m.id)}>Mesa #{m.numeroMesa}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gridColumn: '1 / -1' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={submittingAsig}
                        >
                          Asignar Mesa
                        </Button>
                      </Box>
                    </Box>
                  </form>
                </CardContent>
              </Card>

              {/* Assignments List */}
              <Card>
                <CardContent sx={{ px: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', px: 3, mb: 2 }}>
                    Listado Completo de Reparto
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Operario</TableCell>
                          <TableCell>Municipio</TableCell>
                          <TableCell>Puesto</TableCell>
                          <TableCell align="center">Mesa asignada</TableCell>
                          <TableCell align="right">Eliminar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {asignaciones.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: J.textMuted }}>
                              No hay repartos registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          asignaciones.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell sx={{ fontWeight: 600 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PersonIcon sx={{ color: J.blue, fontSize: 18 }} />
                                  <span>{a.operario?.nombre}</span>
                                </Box>
                              </TableCell>
                              <TableCell>{a.mesa?.puesto?.municipio?.nombre}</TableCell>
                              <TableCell>{a.mesa?.puesto?.nombrePuesto}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Mesa #{a.mesa?.numeroMesa}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDeleteAssignment(a.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      )}

      {/* Comparison and Resolution Dialog */}
      <Dialog open={openComparisonDialog} onClose={() => !savingResolution && setOpenComparisonDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Auditoría de Mesa y Resolución de Discrepancias</span>
          <IconButton onClick={() => setOpenComparisonDialog(false)} disabled={savingResolution}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {detalleMesa ? (
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
                Mesa #{detalleMesa.numeroMesa} — {detalleMesa.puestoNombre}
              </Typography>
              <Typography variant="body2" sx={{ color: J.textMuted }}>
                Compare las fotos de los E14 subidos por Registraduría y por el Testigo, y actualice los valores correctos para resolver la discrepancia.
              </Typography>
            </Box>

            {/* E14 Photo Comparison */}
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>E14 Digitalizados</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
              <Box>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: J.surface }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>E14 Registraduría</Typography>
                  {detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA') ? (
                    <Button 
                      variant="outlined" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => fetchZoomImage(detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA')!.id)}
                    >
                      Ver E14
                    </Button>
                  ) : (
                    <Typography sx={{ color: J.danger, fontSize: '0.9rem', fontWeight: 600 }}>Foto no cargada</Typography>
                  )}
                </Paper>
              </Box>
              <Box>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: J.surface }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>E14 Testigo</Typography>
                  {detalleMesa.fotos.find(f => f.origen === 'TESTIGO') ? (
                    <Button 
                      variant="outlined" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => fetchZoomImage(detalleMesa.fotos.find(f => f.origen === 'TESTIGO')!.id)}
                    >
                      Ver E14
                    </Button>
                  ) : (
                    <Typography sx={{ color: J.danger, fontSize: '0.9rem', fontWeight: 600 }}>Foto no cargada</Typography>
                  )}
                </Paper>
              </Box>
            </Box>

            {/* Resolution Form Table */}
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Conteos Auditados</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidato / Tipo Voto</TableCell>
                    <TableCell>Registraduría</TableCell>
                    <TableCell>Testigo</TableCell>
                    <TableCell align="center">Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalleMesa.renglones.map(r => {
                    const key = `${r.tipoVotoId}_${r.candidatoId || 'null'}`;
                    const counts = editCounts[key] || { reg: 0, test: 0 };
                    const diff = counts.reg - counts.test;
                    
                    return (
                      <TableRow key={key} sx={{ bgcolor: diff !== 0 ? J.dangerBg : 'inherit' }}>
                        <TableCell>
                          {r.candidatoNombre ? (
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.candidatoNombre}</Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: J.textMuted }}>#{r.candidatoNumeroTarjeton}</Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontWeight: 600 }}>{r.tipoVotoNombre}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={counts.reg}
                            onChange={(e) => handleDialogCountChange(key, e.target.value, 'reg')}
                            disabled={savingResolution}
                            slotProps={{ htmlInput: { min: 0, style: { width: 70 } } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={counts.test}
                            onChange={(e) => handleDialogCountChange(key, e.target.value, 'test')}
                            disabled={savingResolution}
                            slotProps={{ htmlInput: { min: 0, style: { width: 70 } } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: diff !== 0 ? J.danger : J.success }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        <DialogActions>
          <Button onClick={() => setOpenComparisonDialog(false)} color="inherit" disabled={savingResolution}>
            Cerrar
          </Button>
          <Button 
            onClick={handleResolveDiscrepancy} 
            variant="contained" 
            color="primary" 
            disabled={savingResolution || !detalleMesa}
          >
            {savingResolution ? 'Guardando...' : 'Aplicar y Resolver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Zoom Image Dialog */}
      <Dialog open={zoomImgUrl !== null} onClose={() => setZoomImgUrl(null)} maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Imagen E14</span>
          <IconButton onClick={() => setZoomImgUrl(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
          {zoomImgUrl && (
            <img 
              src={zoomImgUrl} 
              alt="Zoom E14" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
