import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, FormControl,
  InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Tabs, Tab, Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import { useWebSocket } from '../hooks/useWebSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Witness {
  id: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  tipoTestigo: string;
  mesaId: number;
}

interface Mesa {
  id: number;
  numeroMesa: number;
  capacidad: number;
  ocupados: number;
  estadoSemaforo: string;
}

interface CoberturaMunicipio {
  municipioId: number;
  municipioNombre: string;
  codigoMunicipio: string;
  departamentoId: number;
  departamentoNombre: string;
  totalMesas: number;
  mesasConTestigo: number;
  mesasSinTestigo: number;
  porcentajeCobertura: number;
}

export default function MesasReportPage() {
  const { dashboardUpdates } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);

  // Catalog states
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  
  // Selection states
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');

  // Report data states
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [allWitnesses, setAllWitnesses] = useState<Witness[]>([]);
  const [municipioCoberturas, setMunicipioCoberturas] = useState<CoberturaMunicipio[]>([]);

  // Loading states
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingWitnesses, setLoadingWitnesses] = useState(true);
  const [loadingCoberturas, setLoadingCoberturas] = useState(false);
  const [exportingCoberturas, setExportingCoberturas] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    verdes: 0,
    amarillas: 0,
    rojas: 0,
    porcentaje: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, [dashboardUpdates]);

  useEffect(() => {
    if (selectedPuesto) {
      fetchMesas(selectedPuesto);
    } else {
      setMesas([]);
    }
  }, [selectedPuesto, allWitnesses]);

  useEffect(() => {
    if (activeTab === 1 && selectedDepartamento) {
      fetchMunicipioCoberturas(selectedDepartamento);
    }
  }, [activeTab, selectedDepartamento]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch witnesses
      const witRes = await fetch(`${API_URL}/api/testigos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const witData = await witRes.json();
      if (witData.success) {
        setAllWitnesses(witData.data);
      }
      setLoadingWitnesses(false);

      // Fetch departments
      const deptosRes = await fetch(`${API_URL}/api/catalogo/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptosData = await deptosRes.json();
      
      if (deptosData.success && deptosData.data.length > 0) {
        setDepartamentos(deptosData.data);
        
        // Select first department by default if none selected yet
        let deptoId = selectedDepartamento;
        if (!deptoId) {
          deptoId = deptosData.data[0].id.toString();
          setSelectedDepartamento(deptoId);
        }

        // Fetch municipios of that department
        const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) {
          setMunicipios(mpiosData.data);
        }

        // Fetch municipality coverages
        fetchMunicipioCoberturas(deptoId);
      }
    } catch (e) {
      setError('Error al obtener datos iniciales');
      setLoadingWitnesses(false);
    }
  };

  const handleDepartamentoChange = async (e: any) => {
    const deptoId = e.target.value;
    setSelectedDepartamento(deptoId);
    setSelectedMunicipio('');
    setSelectedPuesto('');
    setMunicipios([]);
    setPuestos([]);
    setMesas([]);

    if (!deptoId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMunicipios(data.data);
      }
      
      // Load coverage report for this department
      fetchMunicipioCoberturas(deptoId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMunicipioChange = async (e: any) => {
    const mpioId = e.target.value;
    setSelectedMunicipio(mpioId);
    setSelectedPuesto('');
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

  const fetchMesas = async (puestoId: string) => {
    setLoadingMesas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const fetchedMesas: Mesa[] = data.data;
        setMesas(fetchedMesas);

        let verdes = 0;
        let amarillas = 0;
        let rojas = 0;
        fetchedMesas.forEach(m => {
          if (m.ocupados === 0) rojas++;
          else if (m.ocupados === 1) amarillas++;
          else verdes++;
        });
        const total = fetchedMesas.length;
        const porcentaje = total > 0 ? Math.round(((verdes + amarillas) / total) * 100) : 0;
        setStats({ total, verdes, amarillas, rojas, porcentaje });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMesas(false);
    }
  };

  const fetchMunicipioCoberturas = async (deptoId: string) => {
    if (!deptoId) return;
    setLoadingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/cobertura-municipios?departamentoId=${deptoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMunicipioCoberturas(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Error al obtener coberturas de municipios');
    } finally {
      setLoadingCoberturas(false);
    }
  };

  const handleExportMunicipioExcel = async () => {
    setExportingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedDepartamento
        ? `${API_URL}/api/excel/export-cobertura?departamentoId=${selectedDepartamento}`
        : `${API_URL}/api/excel/export-cobertura`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Cobertura_Municipios_Export.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        setError('Error al generar la exportación');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor para exportar');
    } finally {
      setExportingCoberturas(false);
    }
  };

  const StatMiniCard = ({ title, value, color }: { title: string; value: number | string; color: string }) => (
    <Card sx={{ bgcolor: `${color}10`, borderLeft: `5px solid ${color}`, height: '100%' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 'bold' }}>{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary.main">
          Reportes de Cobertura
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Consulta y exportación detallada del estado de las mesas y cobertura de testigos electorales.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs Selector */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Cobertura por Puesto" sx={{ fontWeight: 'bold' }} />
        <Tab label="Cobertura por Municipio" sx={{ fontWeight: 'bold' }} />
      </Tabs>

      {/* TAB 0: COBERTURA POR PUESTO */}
      {activeTab === 0 && (
        <Box>
          {/* FILTER PANEL */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      value={selectedDepartamento}
                      label="Departamento"
                      onChange={handleDepartamentoChange}
                    >
                      <MenuItem value="">Selecciona Departamento...</MenuItem>
                      {departamentos.map((d: any) => (
                        <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedDepartamento}>
                    <InputLabel>Municipio</InputLabel>
                    <Select
                      value={selectedMunicipio}
                      label="Municipio"
                      onChange={handleMunicipioChange}
                    >
                      <MenuItem value="">Selecciona Municipio...</MenuItem>
                      {[...municipios]
                        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))
                        .map((m: any) => (
                          <MenuItem key={m.id} value={m.id.toString()}>{m.nombre}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                    <InputLabel>Puesto de Votación</InputLabel>
                    <Select
                      value={selectedPuesto}
                      label="Puesto de Votación"
                      onChange={(e) => setSelectedPuesto(e.target.value as string)}
                    >
                      <MenuItem value="">Selecciona Puesto...</MenuItem>
                      {[...puestos]
                        .sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es'))
                        .map((p: any) => (
                          <MenuItem key={p.id} value={p.id.toString()}>{p.nombrePuesto} (Zona: {p.zona})</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* RENDER REPORT MESAS */}
          {selectedPuesto ? (
            loadingMesas || loadingWitnesses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* STATS PANEL */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <StatMiniCard title="Total Mesas" value={stats.total} color="#0d1b3e" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <StatMiniCard title="Cubiertas (Verde)" value={stats.verdes} color="#43a047" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <StatMiniCard title="Parciales (Amarillo)" value={stats.amarillas} color="#ffb300" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <StatMiniCard title="Faltantes (Rojo)" value={stats.rojas} color="#e53935" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <StatMiniCard title="Cobertura" value={`${stats.porcentaje}%`} color="#1976d2" />
                  </Grid>
                </Grid>

                {/* DETAILED TABLES */}
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#0d1b3e' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '15%' }}>Mesa</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '20%' }}>Estado Cobertura</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '32.5%' }}>Testigo 1</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '32.5%' }}>Testigo 2</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mesas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No hay mesas registradas en este puesto.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...mesas]
                          .sort((a, b) => a.numeroMesa - b.numeroMesa)
                          .map((m) => {
                            const witnessesInMesa = allWitnesses
                              .filter(w => w.mesaId === m.id)
                              .sort((a, b) => a.id - b.id);
                            
                            const testigo1 = witnessesInMesa[0] || null;
                            const testigo2 = witnessesInMesa[1] || null;

                            let statusChip = <Chip icon={<CancelIcon />} label="Sin Cobertura" color="error" size="small" variant="outlined" />;
                            if (m.ocupados === 1) {
                              statusChip = <Chip icon={<WarningIcon />} label="Parcial" color="warning" size="small" variant="outlined" sx={{ borderColor: '#ffb300', color: '#b8860b' }} />;
                            } else if (m.ocupados >= m.capacidad) {
                              statusChip = <Chip icon={<CheckCircleIcon />} label="Completa" color="success" size="small" variant="outlined" />;
                            }

                            return (
                              <TableRow key={m.id} hover>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                  Mesa {m.numeroMesa}
                                </TableCell>
                                <TableCell>
                                  {statusChip}
                                </TableCell>
                                <TableCell>
                                  {testigo1 ? (
                                    <Box>
                                      <Typography sx={{ fontWeight: 'medium' }}>{testigo1.nombreCompleto}</Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        C.C: {testigo1.documento} | Cel: {testigo1.celular}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography color="error" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                      🔴 Pendiente asignar
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {testigo2 ? (
                                    <Box>
                                      <Typography sx={{ fontWeight: 'medium' }}>{testigo2.nombreCompleto}</Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        C.C: {testigo2.documento} | Cel: {testigo2.celular}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                      ⚪ Sin asignar
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center', color: 'text.secondary', border: '1px dashed #ccc' }}>
              Selecciona Departamento, Municipio y Puesto de Votación arriba para generar el reporte de cobertura de las mesas en tiempo real.
            </Paper>
          )}
        </Box>
      )}

      {/* TAB 1: COBERTURA POR MUNICIPIO */}
      {activeTab === 1 && (
        <Box>
          {/* FILTER PANEL */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      value={selectedDepartamento}
                      label="Departamento"
                      onChange={handleDepartamentoChange}
                    >
                      <MenuItem value="">Selecciona Departamento...</MenuItem>
                      {departamentos.map((d: any) => (
                        <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportMunicipioExcel}
                    disabled={exportingCoberturas || !selectedDepartamento}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {exportingCoberturas ? 'Exportando...' : 'Exportar a Excel'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* RENDER TABLE */}
          {selectedDepartamento ? (
            loadingCoberturas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#0d1b3e' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Municipio</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Mesas</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mesas con Testigo (Cubiertas)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mesas sin Testigo (Vacías)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>% Cobertura</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {municipioCoberturas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No hay municipios registrados para este departamento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      municipioCoberturas.map((item) => {
                        let pctColor = 'error.main';
                        if (item.porcentajeCobertura >= 80) pctColor = 'success.main';
                        else if (item.porcentajeCobertura >= 40) pctColor = 'warning.main';

                        return (
                          <TableRow key={item.municipioId} hover>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {item.municipioNombre}
                            </TableCell>
                            <TableCell>{item.totalMesas}</TableCell>
                            <TableCell sx={{ color: '#2e7d32', fontWeight: 'medium' }}>{item.mesasConTestigo}</TableCell>
                            <TableCell sx={{ color: '#d32f2f', fontWeight: 'medium' }}>{item.mesasSinTestigo}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: pctColor }}>
                              {item.porcentajeCobertura}%
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center', color: 'text.secondary', border: '1px dashed #ccc' }}>
              Selecciona un Departamento arriba para cargar el reporte de cobertura por municipio en tiempo real.
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}