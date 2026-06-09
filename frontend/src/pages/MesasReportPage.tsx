import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Tabs, Tab, Button, useMediaQuery, useTheme
} from '@mui/material';
import GuardedSelect from '../components/GuardedSelect';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LabelList
} from 'recharts';

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

const PIE_COLORS = [
  '#2952CC', '#C9973A', '#2D7D4E', '#B83232', '#7B4FA6',
  '#1A7A8A', '#C45E1A', '#4A7A2D', '#8A2D6E', '#2D5A8A',
  '#A67B2D', '#3D8A6E', '#8A3D3D', '#5A3D8A', '#3D6E8A',
];

// ─── INTERFACES ────────────────────────────────────────────────────────────────

/**
 * Witness incluye municipioId para poder agrupar correctamente
 * las mesas por municipio en el cálculo de cobertura parcial/total.
 */
interface Witness {
  id: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  tipoTestigo: string;
  mesaId: number;
  municipioId: number; // ← nuevo: necesario para filtrar por municipio
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

// ─── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * A partir del arreglo completo de testigos calcula, por municipio:
 *   - mesasTotalmenteCubiertas  → mesas con 2 o más testigos asignados
 *   - mesasParcialmenteCubiertas → mesas con exactamente 1 testigo asignado
 *
 * Cada mesa se contabiliza una única vez (sin duplicados).
 */
function computeExtendedCoverage(
  witnesses: Witness[],
  municipioId: number
): { totalCubiertas: number; parcialCubiertas: number } {
  // Contar testigos por mesaId dentro del municipio indicado
  const mesaCountMap = new Map<number, number>();

  witnesses
    .filter((w) => Number(w.municipioId) === Number(municipioId))
    .forEach((w) => {
      mesaCountMap.set(w.mesaId, (mesaCountMap.get(w.mesaId) ?? 0) + 1);
    });

  let totalCubiertas = 0;
  let parcialCubiertas = 0;

  mesaCountMap.forEach((count) => {
    if (count >= 2) {
      totalCubiertas++;
    } else if (count === 1) {
      parcialCubiertas++;
    }
    // count === 0 no puede ocurrir (el mapa solo almacena mesas con ≥1 testigo)
  });

  return { totalCubiertas, parcialCubiertas };
}

// ─── MINI STAT CARD ────────────────────────────────────────────────────────────
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

// ─── COVERAGE BADGE ────────────────────────────────────────────────────────────
function CoverageBadge({ occupied, capacity }: { occupied: number; capacity: number }) {
  if (occupied >= capacity) return <Chip icon={<CheckCircleIcon />} label="Completa" size="small" sx={{ bgcolor: 'rgba(45,125,78,0.1)', color: J.success, border: `1px solid rgba(45,125,78,0.25)`, fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
  if (occupied === 1) return <Chip icon={<WarningIcon />} label="Parcial" size="small" sx={{ bgcolor: 'rgba(185,125,26,0.1)', color: J.warning, border: `1px solid rgba(185,125,26,0.25)`, fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
  return <Chip icon={<CancelIcon />} label="Sin Cobertura" size="small" sx={{ bgcolor: 'rgba(184,50,50,0.1)', color: J.danger, border: `1px solid rgba(184,50,50,0.25)`, fontSize: '12px', height: 28, letterSpacing: '0.08em' }} />;
}

// ─── CUSTOM TOOLTIPS ──────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: J.ink, color: '#fff', px: 2, py: 1.5, borderRadius: '2px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '13px', mb: 0.5, color: '#fff' }}>{label}</Typography>
      {payload.map((p: any) => (
        <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.fill }} />
          <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{p.name}: <strong>{p.value}</strong></Typography>
        </Box>
      ))}
    </Box>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <Box sx={{ bgcolor: J.ink, color: '#fff', px: 2, py: 1.5, borderRadius: '2px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '13px', mb: 0.3, color: '#fff' }}>{d.name}</Typography>
      <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Mesas cubiertas: <strong>{d.value}</strong></Typography>
      <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Cobertura: <strong>{d.payload.porcentajeCobertura}%</strong></Typography>
    </Box>
  );
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '11px', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── CHART SECTION (sin cambios) ───────────────────────────────────────────────
function ChartSection({ data }: { data: CoberturaMunicipio[] }) {
  const [chartTab, setChartTab] = useState<'bar' | 'pie'>('bar');
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

  if (!data.length) return null;

  const truncate = (name: string, max: number) =>
    name.length > max ? name.slice(0, max) + '…' : name;

  const barData = data.map(d => ({
    name: truncate(d.municipioNombre, isMobile ? 8 : isTablet ? 12 : 16),
    fullName: d.municipioNombre,
    Cubiertas: d.mesasConTestigo,
    Vacías: d.mesasSinTestigo,
  }));

  const pieData = data.map(d => ({
    name: d.municipioNombre,
    value: d.mesasConTestigo,
    porcentajeCobertura: d.porcentajeCobertura,
  }));

  const barHeight = isMobile ? 260 : 340;
  const pieHeight = isMobile ? 280 : 360;

  return (
    <Card sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none', mb: 4, overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${J.border}`, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.gold, mb: 0.3 }}>
            Visualización
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '18px', color: J.ink }}>
            Cobertura por Municipio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', border: `1px solid ${J.border}`, overflow: 'hidden' }}>
          <Button
            startIcon={<BarChartIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => setChartTab('bar')}
            sx={{ borderRadius: 0, px: 2, py: 1, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, boxShadow: 'none', minWidth: 0, bgcolor: chartTab === 'bar' ? J.ink : 'transparent', color: chartTab === 'bar' ? '#fff' : J.textMuted, '&:hover': { bgcolor: chartTab === 'bar' ? J.ink : J.muted, boxShadow: 'none' } }}
          >
            Barras
          </Button>
          <Button
            startIcon={<PieChartIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => setChartTab('pie')}
            sx={{ borderRadius: 0, px: 2, py: 1, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, boxShadow: 'none', minWidth: 0, borderLeft: `1px solid ${J.border}`, bgcolor: chartTab === 'pie' ? J.ink : 'transparent', color: chartTab === 'pie' ? '#fff' : J.textMuted, '&:hover': { bgcolor: chartTab === 'pie' ? J.ink : J.muted, boxShadow: 'none' } }}
          >
            Pastel
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 3 }, py: 3, bgcolor: J.surface }}>
        {chartTab === 'bar' && (
          <Box>
            <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart data={barData} margin={{ top: 10, right: isMobile ? 8 : 20, left: isMobile ? -20 : 0, bottom: isMobile ? 40 : 60 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={J.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11, fill: J.textMuted, fontWeight: 500 }} tickLine={false} axisLine={{ stroke: J.border }} angle={isMobile ? -45 : -35} textAnchor="end" interval={0} height={isMobile ? 55 : 70} />
                <YAxis tick={{ fontSize: 11, fill: J.textMuted }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(41,82,204,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: J.textMuted }} iconType="circle" iconSize={8} />
                <Bar dataKey="Cubiertas" name="Cubiertas" fill={J.success} radius={[2, 2, 0, 0]}>
                  {!isMobile && <LabelList dataKey="Cubiertas" position="top" style={{ fontSize: '10px', fill: J.success, fontWeight: 700 }} />}
                </Bar>
                <Bar dataKey="Vacías" name="Vacías" fill={J.danger} radius={[2, 2, 0, 0]}>
                  {!isMobile && <LabelList dataKey="Vacías" position="top" style={{ fontSize: '10px', fill: J.danger, fontWeight: 700 }} />}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, px: 1 }}>
              {data.map(d => (
                <Box key={d.municipioId} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: d.porcentajeCobertura >= 80 ? J.success : d.porcentajeCobertura >= 40 ? J.warning : J.danger }} />
                  <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                    {d.municipioNombre}: <strong style={{ color: J.ink }}>{d.porcentajeCobertura}%</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {chartTab === 'pie' && (
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <ResponsiveContainer width="100%" height={pieHeight}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={isMobile ? 100 : 130} dataKey="value" labelLine={false} label={renderPieLabel} strokeWidth={2} stroke={J.surface}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: J.textMuted, mb: 2 }}>
                Mesas cubiertas por municipio
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: pieHeight - 40, overflowY: 'auto', pr: 0.5 }}>
                {pieData.map((d, i) => {
                  const total = data[i]?.totalMesas || 1;
                  const pct = data[i]?.porcentajeCobertura ?? 0;
                  const pctColor = pct >= 80 ? J.success : pct >= 40 ? J.warning : J.danger;
                  return (
                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '2px', flexShrink: 0, bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: J.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</Typography>
                        <Typography sx={{ fontSize: '11px', color: J.textMuted }}>{d.value} / {total} mesas</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: pctColor, flexShrink: 0 }}>{pct}%</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Card>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function MesasReportPage() {
  const { dashboardUpdates } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [allWitnesses, setAllWitnesses] = useState<Witness[]>([]);
  const [municipioCoberturas, setMunicipioCoberturas] = useState<CoberturaMunicipio[]>([]);

  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingWitnesses, setLoadingWitnesses] = useState(true);
  const [loadingCoberturas, setLoadingCoberturas] = useState(false);
  const [exportingCoberturas, setExportingCoberturas] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({ total: 0, verdes: 0, amarillas: 0, rojas: 0, porcentaje: 0 });

  useEffect(() => { fetchInitialData(); }, [dashboardUpdates]);
  useEffect(() => { if (selectedPuesto) fetchMesas(selectedPuesto); else setMesas([]); }, [selectedPuesto, allWitnesses]);
  useEffect(() => { if (activeTab === 1 && selectedDepartamento) fetchMunicipioCoberturas(selectedDepartamento); }, [activeTab, selectedDepartamento]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const witRes = await fetch(`${API_URL}/api/testigos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const witData = await witRes.json();
      if (witData.success) setAllWitnesses(witData.data);
      setLoadingWitnesses(false);

      const deptosRes = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const deptosData = await deptosRes.json();
      if (deptosData.success && deptosData.data.length > 0) {
        setDepartamentos(deptosData.data);
        let deptoId = selectedDepartamento;
        if (!deptoId) { deptoId = deptosData.data[0].id.toString(); setSelectedDepartamento(deptoId); }
        const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
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
      const res = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${mpioId}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchMesas = async (puestoId: string) => {
    setLoadingMesas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${puestoId}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const fetched: Mesa[] = data.data;
        setMesas(fetched);
        let v = 0, a = 0, r = 0;
        fetched.forEach(m => { if (m.ocupados === 0) r++; else if (m.ocupados === 1) a++; else v++; });
        const total = fetched.length;
        setStats({ total, verdes: v, amarillas: a, rojas: r, porcentaje: total > 0 ? Math.round(((v + a) / total) * 100) : 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoadingMesas(false); }
  };

  const fetchMunicipioCoberturas = async (deptoId: string) => {
    if (!deptoId) return;
    setLoadingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/cobertura-municipios?departamentoId=${deptoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMunicipioCoberturas(data.data);
    } catch { setError('Error al obtener coberturas de municipios'); }
    finally { setLoadingCoberturas(false); }
  };

  const handleExportMunicipioExcel = async () => {
    setExportingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedDepartamento
        ? `${API_URL}/api/excel/export-cobertura?departamentoId=${selectedDepartamento}`
        : `${API_URL}/api/excel/export-cobertura`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob); a.download = 'Cobertura_Municipios_Export.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
      } else setError('Error al generar la exportación');
    } catch { setError('Error al conectar con el servidor para exportar'); }
    finally { setExportingCoberturas(false); }
  };

  // ── Estilos de cabecera de tabla ────────────────────────────────────────────
  const thSx = {
    color: '#fff',
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    borderBottom: 'none',
    py: 2,
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Encabezado de página */}
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
        <Tab label="Cobertura por Puesto" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Cobertura por Municipio" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
      </Tabs>

      {/* ══ TAB 0: por Puesto ══════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2.5 }}>
                Seleccionar ubicación
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Departamento</InputLabel>
                    <GuardedSelect value={selectedDepartamento} label="Departamento" onChange={handleDepartamentoChange}>
                      <MenuItem value="">Selecciona Departamento…</MenuItem>
                      {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>)}
                    </GuardedSelect>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedDepartamento}>
                    <InputLabel>Municipio</InputLabel>
                    <GuardedSelect value={selectedMunicipio} label="Municipio" onChange={handleMunicipioChange}>
                      <MenuItem value="">Selecciona Municipio…</MenuItem>
                      {[...municipios].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => <MenuItem key={m.id} value={m.id.toString()}>{m.nombre}</MenuItem>)}
                    </GuardedSelect>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                    <InputLabel>Puesto de Votación</InputLabel>
                    <GuardedSelect value={selectedPuesto} label="Puesto de Votación" onChange={(e) => setSelectedPuesto(e.target.value as string)}>
                      <MenuItem value="">Selecciona Puesto…</MenuItem>
                      {[...puestos].sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map((p: any) => <MenuItem key={p.id} value={p.id.toString()}>{p.nombrePuesto} (Zona: {p.zona})</MenuItem>)}
                    </GuardedSelect>
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
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Total Mesas"        value={stats.total}            color={J.ink}     /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Cubiertas (Verde)"  value={stats.verdes}           color={J.success} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Parciales (Amarillo)" value={stats.amarillas}      color={J.warning} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Faltantes (Rojo)"   value={stats.rojas}            color={J.danger}  /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="% Cobertura"        value={`${stats.porcentaje}%`} color={J.blue}    /></Grid>
                </Grid>

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
                              <TableCell sx={{ fontWeight: 700, fontSize: '16px', color: J.ink }}>{m.numeroMesa}</TableCell>
                              <TableCell><CoverageBadge occupied={m.ocupados} capacity={m.capacidad} /></TableCell>
                              <TableCell>
                                {t1 ? (
                                  <Box>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t1.nombreCompleto}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 0.3 }}>C.C: {t1.documento} · {t1.celular}</Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '13px', letterSpacing: '0.08em', color: J.danger, fontStyle: 'italic' }}>Pendiente asignar</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {t2 ? (
                                  <Box>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t2.nombreCompleto}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 0.3 }}>C.C: {t2.documento} · {t2.celular}</Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '13px', letterSpacing: '0.08em', color: J.textMuted, fontStyle: 'italic' }}>Sin asignar</Typography>
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

      {/* ══ TAB 1: por Municipio ═══════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <Box>
          {/* Filtro + exportar */}
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
              <Box>
                {/* Gráficas (sin cambios) */}
                <ChartSection data={municipioCoberturas} />

                {/* ── Tabla inferior con las dos nuevas columnas ── */}
                <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: J.ink }}>
                      <TableRow>
                        {/* Columnas originales */}
                        <TableCell sx={thSx}>Municipio</TableCell>
                        <TableCell sx={thSx}>Total Mesas</TableCell>
                        {/*
                         * ── NUEVAS COLUMNAS ──────────────────────────────────
                         * Se ubican entre "Total Mesas" y las columnas originales
                         * de Cubiertas / Vacías para mantener una lectura lógica:
                         * Total → Totalmente cubiertas → Parcialmente → Vacías → %
                         */}
                        <TableCell sx={{ ...thSx, color: '#A8F0C6' }}>
                          Tot. Cubiertas
                          {/* Subtítulo visual */}
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              opacity: 0.7,
                              fontWeight: 400,
                              textTransform: 'none',
                              mt: 0.2,
                            }}
                          >
                            (2+ testigos)
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...thSx, color: '#FFE08A' }}>
                          Parc. Cubiertas
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              opacity: 0.7,
                              fontWeight: 400,
                              textTransform: 'none',
                              mt: 0.2,
                            }}
                          >
                            (1 testigo)
                          </Typography>
                        </TableCell>
                        {/* Columnas originales restantes */}
                        <TableCell sx={thSx}>Vacías</TableCell>
                        <TableCell sx={thSx}>% Cobertura</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {municipioCoberturas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>
                            No hay municipios registrados para este departamento.
                          </TableCell>
                        </TableRow>
                      ) : (
                        municipioCoberturas.map((item) => {
                          const pct = item.porcentajeCobertura;
                          const pctColor = pct >= 80 ? J.success : pct >= 40 ? J.warning : J.danger;

                          /*
                           * ── CÁLCULO DE NUEVAS MÉTRICAS ──────────────────────
                           *
                           * Se agrupa por mesaId el subconjunto de testigos cuyo
                           * municipioId coincide con el municipio actual.
                           * Cada mesaId se cuenta una única vez:
                           *   count >= 2  → Totalmente Cubierta
                           *   count === 1 → Parcialmente Cubierta
                           *
                           * Nota: allWitnesses ya está cargado desde /api/testigos
                           * y la API devuelve municipioId en cada registro.
                           */
                          const { totalCubiertas, parcialCubiertas } =
                            computeExtendedCoverage(allWitnesses, item.municipioId);

                          return (
                            <TableRow key={item.municipioId} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                              {/* Municipio */}
                              <TableCell sx={{ fontWeight: 600, fontSize: '15.5px', color: J.ink }}>
                                {item.municipioNombre}
                              </TableCell>

                              {/* Total Mesas */}
                              <TableCell sx={{ fontSize: '14px' }}>
                                {item.totalMesas}
                              </TableCell>

                              {/* ── Totalmente Cubiertas (2+) ── */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: J.success, flexShrink: 0 }} />
                                  <Typography sx={{ fontSize: '14px', color: J.success, fontWeight: 700 }}>
                                    {totalCubiertas}
                                  </Typography>
                                </Box>
                              </TableCell>

                              {/* ── Parcialmente Cubiertas (1) ── */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningIcon sx={{ fontSize: 16, color: J.warning, flexShrink: 0 }} />
                                  <Typography sx={{ fontSize: '14px', color: J.warning, fontWeight: 700 }}>
                                    {parcialCubiertas}
                                  </Typography>
                                </Box>
                              </TableCell>

                              {/* Vacías */}
                              <TableCell sx={{ fontSize: '14px', color: J.danger, fontWeight: 700 }}>
                                {item.mesasSinTestigo}
                              </TableCell>

                              {/* % Cobertura con barra visual */}
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

                {/*
                 * ── NOTA AL PIE DE LA TABLA ─────────────────────────────────
                 * Aclara la diferencia entre "Cubiertas" (original del backend)
                 * y las dos nuevas columnas calculadas en el frontend.
                 */}
                <Box sx={{ mt: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap', px: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: J.success }} />
                    <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                      <strong style={{ color: J.ink }}>Tot. Cubiertas</strong> = mesas con 2 o más testigos asignados
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <WarningIcon sx={{ fontSize: 14, color: J.warning }} />
                    <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                      <strong style={{ color: J.ink }}>Parc. Cubiertas</strong> = mesas con exactamente 1 testigo asignado
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <CancelIcon sx={{ fontSize: 14, color: J.danger }} />
                    <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                      <strong style={{ color: J.ink }}>Vacías</strong> = mesas sin testigos
                    </Typography>
                  </Box>
                </Box>
              </Box>
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