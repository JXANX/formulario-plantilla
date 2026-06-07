import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, FormControl,
  InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
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

export default function MesasReportPage() {
  const { dashboardUpdates } = useWebSocket();
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [allWitnesses, setAllWitnesses] = useState<Witness[]>([]);

  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');

  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingWitnesses, setLoadingWitnesses] = useState(true);
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

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const witRes = await fetch(`${API_URL}/api/testigos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const witData = await witRes.json();
      if (witData.success) {
        setAllWitnesses(witData.data);
      }
      setLoadingWitnesses(false);

      const deptosRes = await fetch(`${API_URL}/api/catalogo/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptosData = await deptosRes.json();
      if (deptosData.success && deptosData.data.length > 0) {
        const deptoId = deptosData.data[0].id;
        const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) {
          setMunicipios(mpiosData.data);
        }
      }
    } catch (e) {
      setError('Error al obtener datos iniciales');
      setLoadingWitnesses(false);
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
          Reporte de Cobertura por Puesto
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Consulta detallada del estado de las mesas y asignación de testigos.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* FILTER PANEL */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
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
                      <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
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
                      <MenuItem key={p.id} value={p.id}>{p.nombrePuesto} (Zona: {p.zona})</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* RENDER REPORT */}
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
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '32.5%' }}>Testigo Principal</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '32.5%' }}>Testigo Suplente</TableCell>
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
                        const witnessesInMesa = allWitnesses.filter(w => w.mesaId === m.id);
                        const principal = witnessesInMesa.find(w => w.tipoTestigo === 'PRINCIPAL');
                        const suplente = witnessesInMesa.find(w => w.tipoTestigo === 'SUPLENTE');

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
                              {principal ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 'medium' }}>{principal.nombreCompleto}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    C.C: {principal.documento} | Cel: {principal.celular}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="error" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                  🔴 Pendiente asignar Principal
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {suplente ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 'medium' }}>{suplente.nombreCompleto}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    C.C: {suplente.documento} | Cel: {suplente.celular}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                  ⚪ Pendiente asignar Suplente
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
          Selecciona un Municipio y un Puesto de Votación arriba para generar el reporte de cobertura de las mesas en tiempo real.
        </Paper>
      )}
    </Box>
  );
}