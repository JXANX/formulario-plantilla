import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, FormControl,
  InputLabel, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Tabs, Tab, Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon     from '@mui/icons-material/Warning';
import CancelIcon      from '@mui/icons-material/Cancel';
import DownloadIcon    from '@mui/icons-material/Download';
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

interface Witness { id: number; documento: string; nombreCompleto: string; celular: string; tipoTestigo: string; mesaId: number; }
interface Mesa    { id: number; numeroMesa: number; capacidad: number; ocupados: number; estadoSemaforo: string; }
interface CoberturaMunicipio { municipioId: number; municipioNombre: string; codigoMunicipio: string; departamentoId: number; departamentoNombre: string; totalMesas: number; mesasConTestigo: number; mesasSinTestigo: number; porcentajeCobertura: number; }

/* ── Mini stat card ───────────────────────────────── */
function StatMini({ title, value, color }: { title: string; value: number | string; color: string }) {
  return (
    <Card sx={{ border: `1px solid ${J.border}`, borderTop: `4px solid ${color}`, borderRadius: 0, boxShadow: 'none', bgcolor: '#fff' }}>
      <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: J.textMuted, mb: 1.5, display: 'block' }}>
          {title}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '2.6rem', color, lineHeight: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

/* ── Coverage badge ───────────────────────────────── */
function CoverageBadge({ occupied, capacity }: { occupied: number; capacity: number }) {
  if (occupied >= capacity) return <Chip icon={<CheckCircleIcon />} label="Completa"     size="small" sx={{ bgcolor: 'rgba(45,125,78,0.1)', color: J.success, border: `1px solid rgba(45,125,78,0.25)`, fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
  if (occupied === 1)       return <Chip icon={<WarningIcon />}     label="Parcial"      size="small" sx={{ bgcolor: 'rgba(185,125,26,0.1)', color: J.warning, border: `1px solid rgba(185,125,26,0.25)`, fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
  return                           <Chip icon={<CancelIcon />}      label="Sin Cobertura" size="small" sx={{ bgcolor: 'rgba(184,50,50,0.1)',  color: J.danger,  border: `1px solid rgba(184,50,50,0.25)`,  fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
}

export default function MesasReportPage() {
  const { dashboardUpdates } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);

  const [departamentos,      setDepartamentos]      = useState<any[]>([]);
  const [municipios,         setMunicipios]         = useState<any[]>([]);
  const [puestos,            setPuestos]            = useState<any[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedMunicipio,    setSelectedMunicipio]    = useState('');
  const [selectedPuesto,       setSelectedPuesto]       = useState('');

  const [mesas,             setMesas]             = useState<Mesa[]>([]);
  const [allWitnesses,      setAllWitnesses]      = useState<Witness[]>([]);
  const [municipioCoberturas, setMunicipioCoberturas] = useState<CoberturaMunicipio[]>([]);

  const [loadingMesas,     setLoadingMesas]     = useState(false);
  const [loadingWitnesses, setLoadingWitnesses] = useState(true);
  const [loadingCoberturas,setLoadingCoberturas]= useState(false);
  const [exportingCoberturas, setExportingCoberturas] = useState(false);
  const [error,            setError]            = useState('');

  const [stats, setStats] = useState({ total: 0, verdes: 0, amarillas: 0, rojas: 0, porcentaje: 0 });

  useEffect(() => { fetchInitialData(); },                                 [dashboardUpdates]);
  useEffect(() => { if (selectedPuesto) fetchMesas(selectedPuesto); else setMesas([]); }, [selectedPuesto, allWitnesses]);
  useEffect(() => { if (activeTab === 1 && selectedDepartamento) fetchMunicipioCoberturas(selectedDepartamento); }, [activeTab, selectedDepartamento]);

  /* ── Data logic (unchanged) ───────────────────── */
  const fetchInitialData = async () => {
    try {
      const token    = localStorage.getItem('token');
      const witRes   = await fetch(`${API_URL}/api/testigos`,                { headers: { 'Authorization': `Bearer ${token}` } });
      const witData  = await witRes.json();
      if (witData.success) setAllWitnesses(witData.data);
      setLoadingWitnesses(false);

      const deptosRes  = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const deptosData = await deptosRes.json();
      if (deptosData.success && deptosData.data.length > 0) {
        setDepartamentos(deptosData.data);
        let deptoId = selectedDepartamento;
        if (!deptoId) { deptoId = deptosData.data[0].id.toString(); setSelectedDepartamento(deptoId); }
        const mpiosRes  = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) setMunicipios(mpiosData.data);
        fetchMunicipioCoberturas(deptoId);
      }
    } catch { setError('Error al obtener datos iniciales'); setLoadingWitnesses(false); }
  };

  const handleDepartamentoChange = async (e: any) => {
    const deptoId = e.target.value;
    setSelectedDepartamento(deptoId); setSelectedMunicipio(''); setSelectedPuesto('');
    setMunicipios([]); setPuestos([]); setMesas([]);
    if (!deptoId) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMunicipios(data.data);
      fetchMunicipioCoberturas(deptoId);
    } catch (e) { console.error(e); }
  };

  const handleMunicipioChange = async (e: any) => {
    const mpioId = e.target.value;
    setSelectedMunicipio(mpioId); setSelectedPuesto(''); setPuestos([]); setMesas([]);
    if (!mpioId) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchMesas = async (puestoId: string) => {
    setLoadingMesas(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) {
        const fetched: Mesa[] = data.data;
        setMesas(fetched);
        let v = 0, a = 0, r = 0;
        fetched.forEach(m => { if (m.ocupados === 0) r++; else if (m.ocupados === 1) a++; else v++; });
        const total = fetched.length;
        setStats({ total, verdes: v, amarillas: a, rojas: r, porcentaje: total > 0 ? Math.round(((v + a) / total) * 100) : 0 });
      }
    } catch (e) { console.error(e); }
    finally    { setLoadingMesas(false); }
  };

  const fetchMunicipioCoberturas = async (deptoId: string) => {
    if (!deptoId) return;
    setLoadingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/dashboard/cobertura-municipios?departamentoId=${deptoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setMunicipioCoberturas(data.data);
    } catch { setError('Error al obtener coberturas de municipios'); }
    finally  { setLoadingCoberturas(false); }
  };

  const handleExportMunicipioExcel = async () => {
    setExportingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const url   = selectedDepartamento
        ? `${API_URL}/api/excel/export-cobertura?departamentoId=${selectedDepartamento}`
        : `${API_URL}/api/excel/export-cobertura`;
      const res   = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const a    = document.createElement('a');
        a.href = window.URL.createObjectURL(blob); a.download = 'Cobertura_Municipios_Export.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
      } else setError('Error al generar la exportación');
    } catch { setError('Error al conectar con el servidor para exportar'); }
    finally  { setExportingCoberturas(false); }
  };

  /* ── Shared table head style ──────────────────── */
  const thSx = { color: '#fff', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 600, borderBottom: 'none', py: 2 };

  /* ── Render ───────────────────────────────────── */
  return (
    <Box>
      {/* Page heading */}
      <Box sx={{ mb: 5 }}>
        <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
          Monitoreo
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '36px', color: J.ink }}>
          Reportes de Cobertura
        </Typography>
        <Typography sx={{ fontSize: '16px', color: J.textMuted, mt: 0.5 }}>
          Consulta y exportación del estado de mesas y cobertura de testigos electorales.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 4, borderBottom: `1px solid ${J.border}`, '& .MuiTabs-indicator': { bgcolor: J.gold, height: 2 } }}
      >
        <Tab label="Cobertura por Puesto"    sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Cobertura por Municipio" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
      </Tabs>

      {/* ══ TAB 0: por Puesto ══════════════════════════ */}
      {activeTab === 0 && (
        <Box>
          {/* Filter card */}
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2.5 }}>
                Seleccionar ubicación
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Departamento</InputLabel>
                    <Select value={selectedDepartamento} label="Departamento" onChange={handleDepartamentoChange}>
                      <MenuItem value="">Selecciona Departamento…</MenuItem>
                      {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedDepartamento}>
                    <InputLabel>Municipio</InputLabel>
                    <Select value={selectedMunicipio} label="Municipio" onChange={handleMunicipioChange}>
                      <MenuItem value="">Selecciona Municipio…</MenuItem>
                      {[...municipios].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => <MenuItem key={m.id} value={m.id.toString()}>{m.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                    <InputLabel>Puesto de Votación</InputLabel>
                    <Select value={selectedPuesto} label="Puesto de Votación" onChange={(e) => setSelectedPuesto(e.target.value as string)}>
                      <MenuItem value="">Selecciona Puesto…</MenuItem>
                      {[...puestos].sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map((p: any) => <MenuItem key={p.id} value={p.id.toString()}>{p.nombrePuesto} (Zona: {p.zona})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {selectedPuesto ? (
            loadingMesas || loadingWitnesses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress size={32} sx={{ color: J.blue }} /></Box>
            ) : (
              <Box>
                {/* Stats */}
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Total Mesas"        value={stats.total}      color={J.ink}    /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Cubiertas (Verde)"  value={stats.verdes}     color={J.success}/></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Parciales (Amarillo)"value={stats.amarillas} color={J.warning}/></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Faltantes (Rojo)"   value={stats.rojas}      color={J.danger} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="% Cobertura"        value={`${stats.porcentaje}%`} color={J.blue}/></Grid>
                </Grid>

                {/* Table */}
                <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: J.ink }}>
                      <TableRow>
                        <TableCell sx={{ ...thSx, width: '12%' }}>Mesa</TableCell>
                        <TableCell sx={{ ...thSx, width: '20%' }}>Estado</TableCell>
                        <TableCell sx={{ ...thSx, width: '34%' }}>Testigo Principal</TableCell>
                        <TableCell sx={{ ...thSx, width: '34%' }}>Testigo Suplente</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mesas.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: J.textMuted, fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px' }}>No hay mesas registradas en este puesto.</TableCell></TableRow>
                      ) : (
                        [...mesas].sort((a, b) => a.numeroMesa - b.numeroMesa).map((m) => {
                          const witnesses = allWitnesses.filter(w => w.mesaId === m.id).sort((a, b) => a.id - b.id);
                          const t1 = witnesses[0] || null;
                          const t2 = witnesses[1] || null;
                          return (
                            <TableRow key={m.id} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '16px', color: J.ink }}>
                                {m.numeroMesa}
                              </TableCell>
                              <TableCell><CoverageBadge occupied={m.ocupados} capacity={m.capacidad} /></TableCell>
                              <TableCell>
                                {t1 ? (
                                  <Box>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t1.nombreCompleto}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 0.3 }}>
                                      C.C: {t1.documento} · {t1.celular}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '13px', letterSpacing: '0.08em', color: J.danger, fontStyle: 'italic' }}>
                                    Pendiente asignar
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {t2 ? (
                                  <Box>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t2.nombreCompleto}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 0.3 }}>
                                      C.C: {t2.documento} · {t2.celular}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '13px', letterSpacing: '0.08em', color: J.textMuted, fontStyle: 'italic' }}>
                                    Sin asignar
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
            <Paper sx={{ p: 6, textAlign: 'center', border: `1px dashed ${J.border}`, borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' }}>
              <Typography sx={{ fontSize: '13px', letterSpacing: '0.12em', color: J.textMuted, textTransform: 'uppercase' }}>
                Selecciona Departamento → Municipio → Puesto para ver el reporte de cobertura en tiempo real.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ══ TAB 1: por Municipio ══════════════════════ */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Departamento</InputLabel>
                    <Select value={selectedDepartamento} label="Departamento" onChange={handleDepartamentoChange}>
                      <MenuItem value="">Selecciona Departamento…</MenuItem>
                      {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={handleExportMunicipioExcel}
                    disabled={exportingCoberturas || !selectedDepartamento}
                    sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, fontFamily: '"IBM Plex Mono", monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: 'none', '&:hover': { bgcolor: J.blue, boxShadow: 'none' } }}
                  >
                    {exportingCoberturas ? 'Exportando…' : 'Exportar a Excel'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {selectedDepartamento ? (
            loadingCoberturas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress size={32} sx={{ color: J.blue }} /></Box>
            ) : (
              <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: J.ink }}>
                    <TableRow>
                      {['Municipio','Total Mesas','Cubiertas','Vacías','% Cobertura'].map(h => (
                        <TableCell key={h} sx={thSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {municipioCoberturas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>No hay municipios registrados para este departamento.</TableCell></TableRow>
                    ) : (
                      municipioCoberturas.map((item) => {
                        const pct = item.porcentajeCobertura;
                        const pctColor = pct >= 80 ? J.success : pct >= 40 ? J.warning : J.danger;
                        return (
                          <TableRow key={item.municipioId} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '15.5px', color: J.ink }}>{item.municipioNombre}</TableCell>
                            <TableCell sx={{ fontSize: '14px' }}>{item.totalMesas}</TableCell>
                            <TableCell sx={{ fontSize: '14px', color: J.success, fontWeight: 700 }}>{item.mesasConTestigo}</TableCell>
                            <TableCell sx={{ fontSize: '14px', color: J.danger,  fontWeight: 700 }}>{item.mesasSinTestigo}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ flex: 1, height: 4, bgcolor: J.border, position: 'relative' }}>
                                  <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: pctColor, transition: 'width 0.4s ease' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: pctColor, minWidth: 36 }}>
                                  {pct}%
                                </Typography>
                              </Box>
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
            <Paper sx={{ p: 6, textAlign: 'center', border: `1px dashed ${J.border}`, borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' }}>
              <Typography sx={{ fontSize: '13px', letterSpacing: '0.12em', color: J.textMuted, textTransform: 'uppercase' }}>
                Selecciona un Departamento para cargar el reporte de cobertura por municipio.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}