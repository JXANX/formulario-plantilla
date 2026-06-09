import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  FormControl, InputLabel, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, TextField, CircularProgress, Autocomplete
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import GuardedSelect from '../components/GuardedSelect';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  muted: '#F0EEE9',
  surface: '#F8F7F4',
  textMuted: '#7A7A7A',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger: '#B83232',
};

const sxSelect = {
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

interface Testigo {
  id: number;
  documento: string;
  nombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  nombreCompleto: string;
  celular: string;
  correo?: string;
  nombreOrganizacion?: string;
  tipoTestigo: string;
  mesaId?: number;
  numeroMesa?: number;
  puestoId?: number;
  nombrePuesto?: string;
  municipioId?: number;
}

interface Puesto {
  id: number;
  codigoPuesto: string;
  nombrePuesto: string;
  zona: string;
  coordinador?: Testigo | null;
}

interface Departamento {
  id: number;
  codigoDepartamento: string;
  nombre: string;
}

interface Municipio {
  id: number;
  codigoMunicipio: string;
  nombre: string;
}

export default function CoordinadoresPage() {
  const toast = useToast();
  const token = localStorage.getItem('token');

  // Catalogs
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedDepto, setSelectedDepto] = useState<string>('');
  const [selectedMpio, setSelectedMpio] = useState<string>('');
  
  // Data lists
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loadingPuestos, setLoadingPuestos] = useState<boolean>(false);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  
  // Witnesses inside active puesto
  const [testigosPuesto, setTestigosPuesto] = useState<Testigo[]>([]);
  const [loadingTestigos, setLoadingTestigos] = useState<boolean>(false);

  // Dialog State for Assignment
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [allTestigos, setAllTestigos] = useState<Testigo[]>([]);
  const [selectedTestigoForCoord, setSelectedTestigoForCoord] = useState<Testigo | null>(null);
  const [submittingCoord, setSubmittingCoord] = useState<boolean>(false);

  // 1. Initial Load: Departamentos
  useEffect(() => {
    fetch(`${API_URL}/api/catalogo/departamentos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartamentos(data.data);
          // Auto-select Quindío
          const quindio = data.data.find((d: Departamento) => 
            d.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("quindio")
          );
          if (quindio) {
            setSelectedDepto(String(quindio.id));
            loadMunicipios(quindio.id);
          }
        }
      })
      .catch(() => toast.error('Error al cargar departamentos'));
  }, []);

  // 2. Load Municipios
  const loadMunicipios = (deptoId: number) => {
    fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMunicipios(data.data);
          // Auto-select Armenia
          const armenia = data.data.find((m: Municipio) => 
            m.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("armenia")
          );
          if (armenia) {
            setSelectedMpio(String(armenia.id));
            loadPuestos(armenia.id);
          } else if (data.data.length > 0) {
            setSelectedMpio(String(data.data[0].id));
            loadPuestos(data.data[0].id);
          }
        }
      })
      .catch(() => toast.error('Error al cargar municipios'));
  };

  // 3. Load Puestos
  const loadPuestos = (mpioId: number) => {
    setLoadingPuestos(true);
    fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPuestos(data.data);
          // Auto-select the first puesto if any exists
          if (data.data.length > 0) {
            handleSelectPuesto(data.data[0]);
          } else {
            setSelectedPuesto(null);
            setTestigosPuesto([]);
          }
        }
        setLoadingPuestos(false);
      })
      .catch(() => {
        toast.error('Error al cargar puestos');
        setLoadingPuestos(false);
      });
  };

  // 4. Select Puesto and fetch its witnesses
  const handleSelectPuesto = (puesto: Puesto) => {
    setSelectedPuesto(puesto);
    setLoadingTestigos(true);
    fetch(`${API_URL}/api/catalogo/puestos/${puesto.id}/testigos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestigosPuesto(data.data);
        }
        setLoadingTestigos(false);
      })
      .catch(() => {
        toast.error('Error al cargar los testigos del puesto');
        setLoadingTestigos(false);
      });
  };

  // Handle Depto Change
  const handleDeptoChange = (e: any) => {
    const val = e.target.value;
    setSelectedDepto(val);
    setSelectedMpio('');
    setPuestos([]);
    setSelectedPuesto(null);
    setTestigosPuesto([]);
    loadMunicipios(Number(val));
  };

  // Handle Mpio Change
  const handleMpioChange = (e: any) => {
    const val = e.target.value;
    setSelectedMpio(val);
    setSelectedPuesto(null);
    setTestigosPuesto([]);
    loadPuestos(Number(val));
  };

  // Load all witnesses for coordinator selection
  const handleOpenAssignDialog = (puesto: Puesto) => {
    setSelectedPuesto(puesto);
    setSelectedTestigoForCoord(puesto.coordinador || null);
    setOpenDialog(true);
    
    // Fetch all witnesses in the system to select from
    fetch(`${API_URL}/api/testigos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllTestigos(data.data);
        }
      })
      .catch(() => toast.error('Error al cargar la lista de testigos'));
  };

  // Save coordinator assignment
  const handleSaveCoordinator = () => {
    if (!selectedPuesto) return;
    setSubmittingCoord(true);

    const paramTestigo = selectedTestigoForCoord ? `?testigoId=${selectedTestigoForCoord.id}` : '';
    fetch(`${API_URL}/api/catalogo/puestos/${selectedPuesto.id}/coordinador${paramTestigo}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success(selectedTestigoForCoord 
            ? 'Coordinador asignado correctamente' 
            : 'Coordinador removido correctamente'
          );
          setOpenDialog(false);
          // Reload puestos and select current
          loadPuestos(Number(selectedMpio));
        } else {
          toast.error(data.message || 'Error al guardar el coordinador');
        }
        setSubmittingCoord(false);
      })
      .catch(() => {
        toast.error('Error de red al guardar coordinador');
        setSubmittingCoord(false);
      });
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!selectedMpio) return;
    const mpioName = municipios.find(m => String(m.id) === selectedMpio)?.nombre || 'Municipio';
    
    fetch(`${API_URL}/api/excel/export-coordinadores?municipioId=${selectedMpio}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Coordinadores_${mpioName.replace(/\s+/g, '_')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Excel descargado correctamente');
      })
      .catch(() => {
        toast.error('Error al generar y descargar el reporte de coordinadores');
      });
  };

  return (
    <Box>
      {/* HEADER SECTION */}
      <Card sx={{ mb: 4, borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography sx={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, mb: 0.5 }}>
                Ubicación Electoral
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: J.ink }}>
                Coordinadores de Puesto
              </Typography>
            </Grid>
            
            {/* SELECTORES */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth required size="small">
                <InputLabel id="depto-label" sx={sxLabel}>Departamento</InputLabel>
                <GuardedSelect
                  labelId="depto-label"
                  value={selectedDepto}
                  label="Departamento"
                  onChange={handleDeptoChange}
                  sx={sxSelect}
                >
                  {departamentos.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>
                  ))}
                </GuardedSelect>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth required size="small" disabled={!selectedDepto}>
                <InputLabel id="mpio-label" sx={sxLabel}>Municipio</InputLabel>
                <GuardedSelect
                  labelId="mpio-label"
                  value={selectedMpio}
                  label="Municipio"
                  onChange={handleMpioChange}
                  sx={sxSelect}
                >
                  {municipios.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                  ))}
                </GuardedSelect>
              </FormControl>
            </Grid>

            {/* BOTÓN EXCEL */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                disabled={!selectedMpio}
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
                sx={{
                  borderRadius: 0,
                  borderColor: J.border,
                  color: J.ink,
                  height: 40,
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: J.blue,
                    backgroundColor: 'rgba(41, 82, 204, 0.04)'
                  }
                }}
              >
                Exportar Reporte Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
 
      {/* DETALLE Y TABLAS */}
      <Grid container spacing={4}>
        {/* TABLA DE PUESTOS (IZQUIERDA) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography sx={{ fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: J.ink, mb: 2 }}>
            Puestos de Votación del Municipio
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: J.surface, borderBottom: `2.5px solid ${J.border}` }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Puesto</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Zona</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Coordinador Asignado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPuestos ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} sx={{ color: J.blue }} />
                    </TableCell>
                  </TableRow>
                ) : puestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: J.textMuted }}>
                      Seleccione un municipio para visualizar los puestos.
                    </TableCell>
                  </TableRow>
                ) : (
                  puestos.map(p => {
                    const isSelected = selectedPuesto?.id === p.id;
                    return (
                      <TableRow
                        key={p.id}
                        hover
                        onClick={() => handleSelectPuesto(p)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(41, 82, 204, 0.04)' : 'inherit',
                          borderLeft: isSelected ? `4px solid ${J.blue}` : '4px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <TableCell sx={{ py: 1.8 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: J.ink }}>
                            {p.nombrePuesto}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                            Cód: {p.codigoPuesto}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.8 }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.25, bgcolor: J.muted, fontSize: '11px', fontWeight: 600 }}>
                            Zona {p.zona}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.8 }}>
                          {p.coordinador ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon sx={{ color: J.success, fontSize: '16px' }} />
                              <Box>
                                <Typography sx={{ fontSize: '13px', fontWeight: 550, color: J.ink }}>
                                  {p.coordinador.nombreCompleto}
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                                  CC: {p.coordinador.documento}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '12px', fontStyle: 'italic', color: J.textMuted }}>
                              Sin Coordinador
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.8 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Asignar / Cambiar Coordinador">
                            <IconButton 
                              onClick={() => handleOpenAssignDialog(p)}
                              sx={{ 
                                color: J.blue,
                                borderRadius: 0,
                                border: `1px solid ${J.border}`,
                                p: '6px',
                                '&:hover': {
                                  bgcolor: J.blue,
                                  color: '#fff',
                                  borderColor: J.blue
                                }
                              }}
                            >
                              <EditIcon sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
 
        {/* TESTIGOS COORDINADOS (DERECHA) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography sx={{ fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: J.ink, mb: 2 }}>
            Detalle de Testigos Coordinados
          </Typography>
 
          {selectedPuesto ? (
            <Box>
              {/* CARD DEL COORDINADOR */}
              <Card sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none', mb: 3, bgcolor: '#fff' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      width: 48, height: 48, borderRadius: 0, bgcolor: selectedPuesto.coordinador ? 'rgba(41, 82, 204, 0.1)' : 'rgba(26, 31, 46, 0.05)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${J.border}` 
                    }}>
                      <AssignmentIndIcon sx={{ color: selectedPuesto.coordinador ? J.blue : J.textMuted, fontSize: '24px' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted }}>
                        Coordinador de Puesto
                      </Typography>
                      {selectedPuesto.coordinador ? (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: J.ink }}>
                            {selectedPuesto.coordinador.nombreCompleto}
                          </Typography>
                          <Typography sx={{ fontSize: '13px', color: J.ink, mt: 0.25 }}>
                            Cédula: {selectedPuesto.coordinador.documento}
                          </Typography>
                          
                          {/* Detalles contacto */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1.5, pt: 1.5, borderTop: `1px solid ${J.border}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon sx={{ fontSize: '14px', color: J.textMuted }} />
                              <Typography sx={{ fontSize: '13px', color: J.ink }}>
                                {selectedPuesto.coordinador.celular}
                              </Typography>
                            </Box>
                            {selectedPuesto.coordinador.correo && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ fontSize: '14px', color: J.textMuted }} />
                                <Typography sx={{ fontSize: '13px', color: J.ink, wordBreak: 'break-all' }}>
                                  {selectedPuesto.coordinador.correo}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <Typography sx={{ fontSize: '14px', color: J.textMuted, fontStyle: 'italic' }}>
                            No hay un coordinador asignado a este puesto aún.
                          </Typography>
                          <Button 
                             size="small"
                             onClick={() => handleOpenAssignDialog(selectedPuesto)}
                             sx={{
                               mt: 1, textTransform: 'none', color: J.blue, fontWeight: 600, p: 0,
                               '&:hover': { background: 'transparent', textDecoration: 'underline' }
                             }}
                          >
                            Asignar ahora
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
 
              {/* LISTA DE TESTIGOS */}
              <Box sx={{ border: `1px solid ${J.border}`, bgcolor: '#fff', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: J.ink, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: J.blue }} /> Testigos en {selectedPuesto.nombrePuesto}
                  </Typography>
                  <Box sx={{ px: 1, py: 0.25, bgcolor: J.surface, border: `1px solid ${J.border}`, fontSize: '12px', fontWeight: 700 }}>
                    Total: {testigosPuesto.length}
                  </Box>
                </Box>
 
                {loadingTestigos ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: J.blue }} />
                  </Box>
                ) : testigosPuesto.length === 0 ? (
                  <Typography sx={{ fontSize: '13px', color: J.textMuted, fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                    No hay testigos registrados en este puesto.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '350px', overflowY: 'auto', pr: 0.5 }}>
                    {testigosPuesto.map(t => (
                      <Box 
                        key={t.id} 
                        sx={{ 
                          p: 1.5, 
                          border: `1px solid ${J.border}`, 
                          position: 'relative',
                          '&:hover': { borderColor: J.blue }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '13.5px', color: J.ink }}>
                              {t.nombreCompleto}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                              CC: {t.documento} • Cel: {t.celular}
                            </Typography>
                            {t.nombreOrganizacion && (
                              <Typography sx={{ fontSize: '11px', color: J.gold, fontWeight: 600, mt: 0.25 }}>
                                Org: {t.nombreOrganizacion}
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ textAlign: 'right' }}>
                            <Box sx={{ 
                              display: 'inline-block', px: 1, py: 0.1, bgcolor: J.ink, color: '#fff', 
                              fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' 
                            }}>
                              MESA {t.numeroMesa}
                            </Box>
                            <Typography sx={{ fontSize: '10px', color: J.textMuted, mt: 0.5, fontWeight: 600 }}>
                              {t.tipoTestigo}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Card sx={{ border: `1px dashed ${J.border}`, borderRadius: 0, boxShadow: 'none', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessIcon sx={{ color: J.textMuted, fontSize: '48px', mb: 1.5 }} />
              <Typography sx={{ color: J.textMuted, fontSize: '14px', fontStyle: 'italic' }}>
                Seleccione un puesto de votación para visualizar los detalles.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
 
      {/* DIALOG ASIGNAR COORDINADOR */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${J.border}`, p: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '17px', color: J.ink }}>
            Asignar Coordinador a Puesto
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseIcon sx={{ fontSize: '20px' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {selectedPuesto && (
            <Box sx={{ mb: 3, p: 2, bgcolor: J.surface, border: `1px solid ${J.border}` }}>
              <Typography sx={{ fontSize: '12px', color: J.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>
                Puesto de Votación
              </Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: J.ink }}>
                {selectedPuesto.nombrePuesto}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: J.textMuted }}>
                Código: {selectedPuesto.codigoPuesto} • Zona: {selectedPuesto.zona}
              </Typography>
            </Box>
          )}
 
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink, mb: 1 }}>
            Seleccionar Testigo Coordinador
          </Typography>
          
          <Autocomplete
            options={allTestigos}
            getOptionLabel={(option) => `${option.nombreCompleto} (CC: ${option.documento})`}
            value={selectedTestigoForCoord}
            onChange={(_event, newValue) => {
              setSelectedTestigoForCoord(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar por Nombre o Documento"
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    borderColor: J.border,
                  }
                }}
              />
            )}
            noOptionsText="No se encontraron testigos"
          />

          <Typography sx={{ fontSize: '11px', color: J.textMuted, mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            * Consejo: Se recomienda seleccionar un testigo que esté registrado en este puesto para que coordine de manera presencial.
          </Typography>

          {selectedTestigoForCoord && (
            <Box sx={{ mt: 3, p: 2, border: `1px solid ${J.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.ink }}>
                  {selectedTestigoForCoord.nombreCompleto}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: J.textMuted }}>
                  CC: {selectedTestigoForCoord.documento} • Celular: {selectedTestigoForCoord.celular}
                </Typography>
              </Box>
              <Button 
                size="small" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={() => setSelectedTestigoForCoord(null)}
                sx={{ textTransform: 'none', borderRadius: 0, fontSize: '12px' }}
              >
                Quitar
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${J.border}`, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            sx={{ borderRadius: 0, textTransform: 'none', color: J.textMuted }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveCoordinator} 
            variant="contained"
            disabled={submittingCoord}
            sx={{ 
              borderRadius: 0, 
              textTransform: 'none', 
              bgcolor: J.blue,
              '&:hover': { bgcolor: '#1a3fa3' }
            }}
          >
            {submittingCoord ? 'Guardando...' : 'Confirmar Asignación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
