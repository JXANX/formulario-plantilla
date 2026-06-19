import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, Select, MenuItem,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Tabs, Tab, Button, TextField, InputAdornment,
  Dialog, DialogContent, LinearProgress, Snackbar, Fade, TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PeopleIcon from '@mui/icons-material/People';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedIcon from '@mui/icons-material/Verified';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useWebSocket } from '../hooks/useWebSocket';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import SearchableSelect from '../components/SearchableSelect';

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

interface Acreditado {
  id: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  correo: string;
  tipoTestigo: string;
  mesaId: number;
  municipioId: number;
  nombrePuesto: string;
  numeroMesa: number;
  nombreMunicipio: string;
}

interface Mesa {
  id: number;
  numeroMesa: number;
  capacidad: number;
  ocupados: number;
  estadoSemaforo: string;
}

interface ComparativaTestigo {
  idTestigo: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  correo: string;
  mesaId: number;
  numeroMesa: number;
  puestoId: number;
  nombrePuesto: string;
  municipioId: number;
  nombreMunicipio: string;
  fueAcreditado: boolean;
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

interface CoberturaPuesto {
  puestoId: number;
  puestoNombre: string;
  zona: string;
  municipioId: number;
  municipioNombre: string;
  totalMesas: number;
  mesasTotalmenteCubiertas: number;
  mesasParcialmenteCubiertas: number;
  mesasSinTestigo: number;
  porcentajeCobertura: number;
}

function computeExtendedCoverage(
  acreditados: Acreditado[],
  municipioId: number
): { totalCubiertas: number; parcialCubiertas: number } {
  const mesaCountMap = new Map<number, number>();

  acreditados
    .filter((a) => Number(a.municipioId) === Number(municipioId))
    .forEach((a) => {
      mesaCountMap.set(a.mesaId, (mesaCountMap.get(a.mesaId) ?? 0) + 1);
    });

  let totalCubiertas = 0;
  let parcialCubiertas = 0;

  mesaCountMap.forEach((count) => {
    if (count >= 2) {
      totalCubiertas++;
    } else if (count === 1) {
      parcialCubiertas++;
    }
  });

  return { totalCubiertas, parcialCubiertas };
}

const sxSelect = {
  '& .MuiOutlinedInput-notchedOutline': { borderColor: J.border, transition: 'border-color 0.15s ease' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: J.blue },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: J.blue, borderWidth: '1.5px' },
};

const sxLabel = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontWeight: 600,
  color: J.textMuted,
  '&.Mui-focused': { color: J.blue },
};

function StatMini({ title, value, color }: { title: string; value: number | string; color: string }) {
  return (
    <Card sx={{ border: `1px solid ${J.border}`, borderTop: `4px solid ${color}`, borderRadius: 0, boxShadow: 'none', bgcolor: '#fff' }}>
      <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: J.textMuted, mb: 1.5, display: 'block' }}>
          {title}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '2.2rem', color, lineHeight: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ComparisonCard({ title, value, icon, color, subtitle }: { title: string; value: number; icon: React.ReactNode; color: string; subtitle: string }) {
  return (
    <Card sx={{ height: '100%', border: `1px solid ${J.border}`, borderLeft: `5px solid ${color}`, borderRadius: 0, boxShadow: 'none', bgcolor: '#fff' }}>
      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: J.textMuted, mb: 0.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '2.5rem', color: J.ink, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: J.textMuted, mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: `${color}12`, color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

function CoverageBadge({ occupied, capacity }: { occupied: number; capacity: number }) {
  if (occupied >= capacity) return <Chip icon={<CheckCircleIcon />} label="Completa" size="small" sx={{ bgcolor: 'rgba(45,125,78,0.1)', color: J.success, border: `1px solid rgba(45,125,78,0.25)`, fontSize: '12px', height: 28 }} />;
  if (occupied === 1) return <Chip icon={<WarningIcon />} label="Parcial" size="small" sx={{ bgcolor: 'rgba(185,125,26,0.1)', color: J.warning, border: `1px solid rgba(185,125,26,0.25)`, fontSize: '12px', height: 28 }} />;
  return <Chip icon={<CancelIcon />} label="Sin Cobertura" size="small" sx={{ bgcolor: 'rgba(184,50,50,0.1)', color: J.danger, border: `1px solid rgba(184,50,50,0.25)`, fontSize: '12px', height: 28 }} />;
}

export default function AcreditacionesPage() {
  const { dashboardUpdates, importProgress, clearImportProgress } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);

  // Combos
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');

  // Report states
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [allAcreditados, setAllAcreditados] = useState<Acreditado[]>([]);
  const [comparativa, setComparativa] = useState<ComparativaTestigo[]>([]);
  const [municipioCoberturas, setMunicipioCoberturas] = useState<CoberturaMunicipio[]>([]);
  const [puestoCoberturas, setPuestoCoberturas] = useState<CoberturaPuesto[]>([]);
  
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingAcreditados, setLoadingAcreditados] = useState(true);
  const [loadingCoberturas, setLoadingCoberturas] = useState(false);
  
  // Tab 2 Puestos
  const [loadingPuestoCoberturas, setLoadingPuestoCoberturas] = useState(false);
  const [selectedDeptoPuestos, setSelectedDeptoPuestos] = useState('');
  const [selectedMunicipioPuestos, setSelectedMunicipioPuestos] = useState('');
  const [municipiosPuestos, setMunicipiosPuestos] = useState<any[]>([]);
  const [searchTermPuestos, setSearchTermPuestos] = useState('');

  // Tab 3 Acreditados Listado & Buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListMunicipio, setSelectedListMunicipio] = useState('');
  const [selectedListPuesto, setSelectedListPuesto] = useState('');
  const [selectedListMesa, setSelectedListMesa] = useState('');
  
  const [listMunicipios, setListMunicipios] = useState<any[]>([]);
  const [listPuestos, setListPuestos] = useState<any[]>([]);
  const [listMesas, setListMesas] = useState<any[]>([]);
  const [exportingTestigosMunicipio, setExportingTestigosMunicipio] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Tab 4 Comparativa
  const [searchComparativa, setSearchComparativa] = useState('');
  const [filterAcreditado, setFilterAcreditado] = useState<'ALL'|'ACREDITADO'|'NO_ACREDITADO'>('ALL');
  const [pageComparativa, setPageComparativa] = useState(0);
  const [rowsPerPageComparativa, setRowsPerPageComparativa] = useState(10);

  // Global states
  const [error, setError] = useState('');
  const [exportingCoberturas, setExportingCoberturas] = useState(false);
  const [stats, setStats] = useState({
    totalAcreditados: 0, totalMesas: 0,
    mesasVerdes: 0, mesasAmarillas: 0, mesasRojas: 0,
    porcentajeCobertura: 0,
    mesasGanadas: 0, mesasPerdidas: 0, mesasConfirmadas: 0,
    totalTestigosManuales: 0
  });

  // Table local stats
  const [mesaStats, setMesaStats] = useState({ total: 0, verdes: 0, amarillas: 0, rojas: 0, porcentaje: 0 });

  // Upload stats dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [importFileName, setImportFileName] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success'|'error'|'info' }>({ open: false, message: '', severity: 'info' });
  const [clearing, setClearing] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => { fetchInitialData(); fetchGeneralStats(); }, [dashboardUpdates]);
  useEffect(() => { if (selectedPuesto) fetchMesas(selectedPuesto); else setMesas([]); }, [selectedPuesto, allAcreditados]);
  useEffect(() => { if (activeTab === 1 && selectedDepartamento) fetchMunicipioCoberturas(selectedDepartamento); }, [activeTab, selectedDepartamento]);
  
  useEffect(() => {
    if (activeTab === 2 && selectedDeptoPuestos) {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/api/catalogo/departamentos/${selectedDeptoPuestos}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setMunicipiosPuestos(d.data); });
    }
  }, [activeTab, selectedDeptoPuestos]);
  
  useEffect(() => {
    if (activeTab === 2 && selectedMunicipioPuestos) fetchPuestoCoberturas(selectedMunicipioPuestos);
  }, [activeTab, selectedMunicipioPuestos]);

  useEffect(() => {
    if (activeTab === 3 && departamentos.length > 0) {
      const token = localStorage.getItem('token');
      const firstDeptoId = departamentos[0].id;
      fetch(`${API_URL}/api/catalogo/departamentos/${firstDeptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setListMunicipios(d.data); });
    }
  }, [activeTab, departamentos]);

  useEffect(() => {
    if (importProgress && importStatus === 'processing') {
      if (importProgress.procesados >= importProgress.total && importProgress.total > 0) {
        setTimeout(() => {
          setImportStatus('done');
          fetchGeneralStats();
          fetchInitialData();
        }, 500);
      }
    }
  }, [importProgress]);

  const fetchGeneralStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const r = await res.json();
        setStats(r.data);
      }
    } catch (e) {
      console.error('Error cargando estadísticas', e);
    }
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const acRes = await fetch(`${API_URL}/api/acreditados`, { headers: { 'Authorization': `Bearer ${token}` } });
      const acData = await acRes.json();
      if (acData.success) setAllAcreditados(acData.data);
      setLoadingAcreditados(false);
      const deptosRes = await fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const deptosData = await deptosRes.json();
      if (deptosData.success) setDepartamentos(deptosData.data);
      
      const compRes = await fetch(`${API_URL}/api/acreditados/comparativa`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.success) setComparativa(compData.data);
      }

      if (deptosData.success && deptosData.data.length > 0) {
        let deptoId = selectedDepartamento;
        if (!deptoId) { deptoId = deptosData.data[0].id.toString(); setSelectedDepartamento(deptoId); }
        const mpiosRes = await fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } });
        const mpiosData = await mpiosRes.json();
        if (mpiosData.success) setMunicipios(mpiosData.data);
        fetchMunicipioCoberturas(deptoId);
      }
    } catch {
      setError('Error al obtener datos iniciales');
      setLoadingAcreditados(false);
    }
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

  const handleListMunicipioChange = async (val: string) => {
    setSelectedListMunicipio(val); setSelectedListPuesto(''); setSelectedListMesa('');
    setListPuestos([]); setListMesas([]);
    setPage(0);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/municipios/${val}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setListPuestos(data.data);
    } catch (e) { console.error(e); }
  };

  const handleListPuestoChange = async (val: string) => {
    setSelectedListPuesto(val); setSelectedListMesa('');
    setListMesas([]);
    setPage(0);
    if (!val) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/catalogo/puestos/${val}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setListMesas(data.data);
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
        fetched.forEach(m => {
          const count = allAcreditados.filter(w => w.mesaId === m.id).length;
          if (count === 0) r++; else if (count === 1) a++; else v++;
        });
        const total = fetched.length;
        setMesaStats({ total, verdes: v, amarillas: a, rojas: r, porcentaje: total > 0 ? Math.round(((v + a) / total) * 100) : 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoadingMesas(false); }
  };

  const fetchMunicipioCoberturas = async (deptoId: string) => {
    if (!deptoId) return;
    setLoadingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/cobertura-municipios?departamentoId=${deptoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMunicipioCoberturas(data.data);
    } catch { setError('Error al obtener coberturas de municipios'); }
    finally { setLoadingCoberturas(false); }
  };

  const fetchPuestoCoberturas = async (mpioId: string) => {
    if (!mpioId) return;
    setLoadingPuestoCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/cobertura-puestos?municipioId=${mpioId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPuestoCoberturas(data.data);
    } catch { setError('Error al obtener coberturas de puestos'); }
    finally { setLoadingPuestoCoberturas(false); }
  };

  const handleExportMunicipioExcel = async () => {
    setExportingCoberturas(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedDepartamento
        ? `${API_URL}/api/acreditados/export-cobertura?departamentoId=${selectedDepartamento}`
        : `${API_URL}/api/acreditados/export-cobertura`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob); a.download = 'Cobertura_Acreditados_Municipios.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
      } else setError('Error al generar la exportación');
    } catch { setError('Error al conectar con el servidor para exportar'); }
    finally { setExportingCoberturas(false); }
  };

  const handleExportTestigosMunicipio = async () => {
    if (!selectedListMunicipio) return;
    setExportingTestigosMunicipio(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/export-testigos-municipio?municipioId=${selectedListMunicipio}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        const mpioNombre = listMunicipios.find((m: any) => String(m.id) === String(selectedListMunicipio))?.nombre || 'municipio';
        a.download = `Acreditados_${mpioNombre}.xlsx`;
        document.body.appendChild(a); a.click(); a.remove();
      } else setError('Error al generar el Excel de acreditados');
    } catch { setError('Error de conexión al exportar'); }
    finally { setExportingTestigosMunicipio(false); }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/export`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob); a.download = 'Listado_Completo_Acreditados.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
        setSnackbar({ open: true, message: '✅ Excel completo descargado exitosamente', severity: 'success' });
      } else setError('Error al exportar todos los acreditados');
    } catch { setError('Error de conexión al exportar completo'); }
    finally { setExportingAll(false); }
  };

  const handleUploadExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportStatus('uploading');
    setImportDialogOpen(true);
    clearImportProgress();
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      await new Promise(r => setTimeout(r, 600));
      setImportStatus('processing');
      const res = await fetch(`${API_URL}/api/acreditados/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setImportStatus('done');
        fetchGeneralStats();
        fetchInitialData();
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('error');
    }
    event.target.value = '';
  };

  const handleClearAcreditados = async () => {
    if (!window.confirm('🚨 ¿Está seguro de que desea limpiar todos los registros de acreditados?\n\nEsta acción borrará ÚNICAMENTE los acreditados cargados desde el Excel oficial, sin tocar la base de datos de testigos manuales.')) return;
    setClearing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/acreditados/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setSnackbar({ open: true, message: '🧹 Listado de acreditados limpiado exitosamente', severity: 'success' });
        fetchGeneralStats();
        fetchInitialData();
      } else {
        setSnackbar({ open: true, message: '❌ Error al limpiar los acreditados', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: '❌ Error de conexión al limpiar', severity: 'error' });
    } finally {
      setClearing(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setTimeout(() => { setImportStatus('idle'); clearImportProgress(); }, 300);
  };

  const progressPercent = importProgress && importProgress.total > 0
    ? Math.round((importProgress.procesados / importProgress.total) * 100)
    : 0;

  const thSx = {
    color: '#fff', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 600, borderBottom: 'none', py: 2,
  };

  const truncate = (name: string, max: number) => name.length > max ? name.slice(0, max) + '…' : name;

  const barData = municipioCoberturas.map(d => ({
    name: truncate(d.municipioNombre, 12),
    fullName: d.municipioNombre,
    Cubiertas: d.mesasConTestigo,
    Vacías: d.mesasSinTestigo,
  }));

  // Filter list in memory
  const filteredAcreditados = allAcreditados.filter(t => {
    const q = searchQuery.trim().toLowerCase();
    return (q === '' || t.documento.toLowerCase().includes(q) || (t.nombreCompleto || '').toLowerCase().includes(q))
      && (selectedListMunicipio === '' || String(t.municipioId) === String(selectedListMunicipio))
      && (selectedListPuesto === '' || String(t.mesaId && allAcreditados.find(x => x.id === t.id)?.mesaId) === String(t.mesaId) && (selectedListPuesto === '' || t.nombrePuesto === listPuestos.find(p => String(p.id) === String(selectedListPuesto))?.nombrePuesto))
      && (selectedListMesa === '' || String(t.mesaId) === String(selectedListMesa));
  });

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
            Monitoreo Oficial
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '36px', color: J.ink }}>
            Control de Acreditados
          </Typography>
          <Typography sx={{ fontSize: '15px', color: J.textMuted, mt: 0.5 }}>
            Reportes en paralelo de testigos oficiales acreditados por el Consejo Nacional Electoral (CNE).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleClearAcreditados}
            disabled={clearing || stats.totalAcreditados === 0}
            sx={{ borderRadius: 0, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', py: 1 }}
          >
            {clearing ? 'Borrando...' : 'Limpiar Acreditados'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: '18px !important' }} />}
            component="label"
            sx={{ borderColor: J.border, color: J.ink, borderRadius: 0, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', py: 1, '&:hover': { bgcolor: '#F0EEE9', borderColor: J.border } }}
          >
            Subir Oficial Excel
            <input type="file" hidden accept=".xlsx" onChange={handleUploadExcel} />
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleExportAll}
            disabled={exportingAll || stats.totalAcreditados === 0}
            sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', py: 1, boxShadow: 'none', '&:hover': { bgcolor: J.blue } }}
          >
            {exportingAll ? 'Exportando...' : 'Exportar Listado'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }} onClose={() => setError('')}>{error}</Alert>}

      {/* COMPARISON METRICS SECTION */}
      <Card sx={{ mb: 4, borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none', bgcolor: '#fff' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${J.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CompareArrowsIcon sx={{ color: J.gold }} />
          <Typography sx={{ fontWeight: 700, fontSize: '16px', color: J.ink }}>
            Análisis de Cobertura: Planificación Manual vs Acreditados Oficiales
          </Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                title="Mesa Ganada"
                value={stats.mesasGanadas}
                icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
                color={J.blue}
                subtitle="Mesas sin planificar con testigo acreditado"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                title="Mesa Perdida"
                value={stats.mesasPerdidas}
                icon={<CancelIcon sx={{ fontSize: 28 }} />}
                color={J.danger}
                subtitle="Mesas planificadas sin testigo acreditado"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ComparisonCard
                title="Mesa Confirmada"
                value={stats.mesasConfirmadas}
                icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
                color={J.success}
                subtitle="Coincidencia de planificación y acreditación"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%', border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none', bgcolor: J.surface }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography sx={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: J.textMuted, mb: 1, display: 'block' }}>
                    Resumen de Acreditación
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography sx={{ fontSize: '12px' }}>Total Acreditados:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{stats.totalAcreditados}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography sx={{ fontSize: '12px' }}>Total Planificados:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{stats.totalTestigosManuales}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12px' }}>% Cobertura Oficial:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: J.blue }}>{stats.porcentajeCobertura}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => { setActiveTab(v); setPage(0); }}
        sx={{ mb: 4, borderBottom: `1px solid ${J.border}`, '& .MuiTabs-indicator': { bgcolor: J.gold, height: 2 } }}
      >
        <Tab label="Cobertura por Puesto" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Cobertura por Municipio" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Estadísticas por Puestos" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Buscador y Listado" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
        <Tab label="Comparativa Planificación" sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: J.textMuted, '&.Mui-selected': { color: J.ink } }} />
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
                    <InputLabel sx={sxLabel}>Departamento</InputLabel>
                    <Select value={selectedDepartamento} label="Departamento" onChange={handleDepartamentoChange} sx={sxSelect}>
                      <MenuItem value="">Selecciona Departamento…</MenuItem>
                      {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedDepartamento}>
                    <InputLabel sx={sxLabel}>Municipio</InputLabel>
                    <Select value={selectedMunicipio} label="Municipio" onChange={handleMunicipioChange} sx={sxSelect}>
                      <MenuItem value="">Selecciona Municipio…</MenuItem>
                      {[...municipios].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => <MenuItem key={m.id} value={m.id.toString()}>{m.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedMunicipio}>
                    <InputLabel sx={sxLabel}>Puesto de Votación</InputLabel>
                    <SearchableSelect value={selectedPuesto} label="Puesto de Votación" onChange={(e) => setSelectedPuesto(e.target.value as string)} sx={sxSelect}>
                      <MenuItem value="">Selecciona Puesto…</MenuItem>
                      {[...puestos].sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map((p: any) => <MenuItem key={p.id} value={p.id.toString()}>{p.nombrePuesto} (Zona: {p.zona})</MenuItem>)}
                    </SearchableSelect>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {selectedPuesto ? (
            loadingMesas || loadingAcreditados ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress size={32} sx={{ color: J.blue }} /></Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }} className="no-print">
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => window.print()}
                    sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: 'none', '&:hover': { bgcolor: J.blue } }}
                  >
                    Descargar PDF / Imprimir
                  </Button>
                </Box>
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Total Mesas" value={mesaStats.total} color={J.ink} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Cubiertas (Verde)" value={mesaStats.verdes} color={J.success} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Parciales (Amarillo)" value={mesaStats.amarillas} color={J.warning} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="Faltantes (Rojo)" value={mesaStats.rojas} color={J.danger} /></Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}><StatMini title="% Cobertura" value={`${mesaStats.porcentaje}%`} color={J.blue} /></Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: J.ink }}>
                      <TableRow>
                        <TableCell sx={{ ...thSx, width: '12%' }}>Mesa</TableCell>
                        <TableCell sx={{ ...thSx, width: '20%' }}>Estado</TableCell>
                        <TableCell sx={{ ...thSx, width: '34%' }}>Acreditado Principal</TableCell>
                        <TableCell sx={{ ...thSx, width: '34%' }}>Acreditados Adicionales</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mesas.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '11px' }}>No hay mesas registradas.</TableCell></TableRow>
                      ) : (
                        [...mesas].sort((a, b) => a.numeroMesa - b.numeroMesa).map((m) => {
                          const witnesses = allAcreditados.filter(w => w.mesaId === m.id).sort((a, b) => a.id - b.id);
                          const t1 = witnesses[0] || null;
                          const tRemaining = witnesses.slice(1);
                          return (
                            <TableRow key={m.id} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '16px', color: J.ink }}>{m.numeroMesa}</TableCell>
                              <TableCell><CoverageBadge occupied={witnesses.length} capacity={m.capacidad} /></TableCell>
                              <TableCell>
                                {t1 ? (
                                  <Box>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: J.ink }}>{t1.nombreCompleto}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 0.3 }}>C.C: {t1.documento} · Rol: {t1.tipoTestigo}</Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '13px', color: J.danger, fontStyle: 'italic' }}>Sin acreditados</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {tRemaining.length > 0 ? (
                                  tRemaining.map(tr => (
                                    <Box key={tr.id} sx={{ mb: 1 }}>
                                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: J.ink }}>{tr.nombreCompleto}</Typography>
                                      <Typography sx={{ fontSize: '12px', color: J.textMuted }}>C.C: {tr.documento} · Rol: {tr.tipoTestigo}</Typography>
                                    </Box>
                                  ))
                                ) : (
                                  <Typography sx={{ fontSize: '13px', color: J.textMuted, fontStyle: 'italic' }}>Ninguno adicional</Typography>
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
                Selecciona Departamento → Municipio → Puesto para cargar el reporte de acreditados.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ══ TAB 1: por Municipio ═══════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={sxLabel}>Departamento</InputLabel>
                    <Select value={selectedDepartamento} label="Departamento" onChange={handleDepartamentoChange} sx={sxSelect}>
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
                    sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: 'none', '&:hover': { bgcolor: J.blue } }}
                  >
                    {exportingCoberturas ? 'Exportando…' : 'Exportar Cobertura'}
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
                {/* Visual Chart */}
                {municipioCoberturas.length > 0 && (
                  <Card sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none', mb: 4, overflow: 'hidden' }}>
                    <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${J.border}` }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '18px', color: J.ink }}>
                        Cobertura por Municipio (Acreditados)
                      </Typography>
                    </Box>
                    <Box sx={{ px: 3, py: 3, bgcolor: J.surface }}>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke={J.border} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: J.textMuted }} angle={-35} textAnchor="end" interval={0} height={50} />
                          <YAxis tick={{ fontSize: 11, fill: J.textMuted }} allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'rgba(41,82,204,0.06)' }} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                          <Bar dataKey="Cubiertas" name="Confirmadas / Parciales" fill={J.success} radius={[2, 2, 0, 0]} />
                          <Bar dataKey="Vacías" name="Sin Cobertura" fill={J.danger} radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                )}

                <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: J.ink }}>
                      <TableRow>
                        <TableCell sx={thSx}>Municipio</TableCell>
                        <TableCell sx={thSx}>Total Mesas</TableCell>
                        <TableCell sx={{ ...thSx, color: '#A8F0C6' }}>Tot. Cubiertas (2+)</TableCell>
                        <TableCell sx={{ ...thSx, color: '#FFE08A' }}>Parc. Cubiertas (1)</TableCell>
                        <TableCell sx={thSx}>Vacías</TableCell>
                        <TableCell sx={thSx}>% Cobertura</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {municipioCoberturas.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>No hay municipios registrados.</TableCell></TableRow>
                      ) : (
                        municipioCoberturas.map((item) => {
                          const pct = item.porcentajeCobertura;
                          const pctColor = pct >= 80 ? J.success : pct >= 40 ? J.warning : J.danger;
                          const { totalCubiertas, parcialCubiertas } = computeExtendedCoverage(allAcreditados, item.municipioId);

                          return (
                            <TableRow key={item.municipioId} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '15px', color: J.ink }}>{item.municipioNombre}</TableCell>
                              <TableCell sx={{ fontSize: '14px' }}>{item.totalMesas}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: J.success }} />
                                  <Typography sx={{ fontSize: '14px', color: J.success, fontWeight: 700 }}>{totalCubiertas}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningIcon sx={{ fontSize: 16, color: J.warning }} />
                                  <Typography sx={{ fontSize: '14px', color: J.warning, fontWeight: 700 }}>{parcialCubiertas}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '14px', color: J.danger, fontWeight: 700 }}>{item.mesasSinTestigo}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box sx={{ flex: 1, height: 4, bgcolor: J.border, position: 'relative' }}>
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: pctColor }} />
                                  </Box>
                                  <Typography sx={{ fontWeight: 700, fontSize: '14px', color: pctColor }}>{pct}%</Typography>
                                </Box>
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
                Selecciona un Departamento para cargar el reporte de cobertura por municipio.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ══ TAB 2: Estadísticas por Puestos ═════════════════════════════════════ */}
      {activeTab === 2 && (
        <Box>
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={sxLabel}>Departamento</InputLabel>
                    <Select value={selectedDeptoPuestos} label="Departamento"
                      onChange={(e) => { setSelectedDeptoPuestos(e.target.value as string); setSelectedMunicipioPuestos(''); setMunicipiosPuestos([]); setPuestoCoberturas([]); setSearchTermPuestos(''); }}
                      sx={sxSelect}>
                      <MenuItem value="">Selecciona Departamento…</MenuItem>
                      {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id.toString()}>{d.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" disabled={!selectedDeptoPuestos}>
                    <InputLabel sx={sxLabel}>Municipio</InputLabel>
                    <Select value={selectedMunicipioPuestos} label="Municipio"
                      onChange={(e) => { setSelectedMunicipioPuestos(e.target.value as string); setSearchTermPuestos(''); }}
                      sx={sxSelect}>
                      <MenuItem value="">Selecciona Municipio…</MenuItem>
                      {[...municipiosPuestos].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => <MenuItem key={m.id} value={m.id.toString()}>{m.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" placeholder="Buscar puesto..." value={searchTermPuestos} onChange={(e) => setSearchTermPuestos(e.target.value)} disabled={!selectedMunicipioPuestos}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: J.textMuted, fontSize: 20 }} /></InputAdornment>,
                        sx: { fontSize: '14px' }
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {selectedMunicipioPuestos ? (
            loadingPuestoCoberturas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress size={32} sx={{ color: J.blue }} /></Box>
            ) : (
              <Box>
                <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: J.ink }}>
                      <TableRow>
                        <TableCell sx={thSx}>Puesto</TableCell>
                        <TableCell sx={thSx}>Zona</TableCell>
                        <TableCell sx={thSx}>Total Mesas</TableCell>
                        <TableCell sx={{ ...thSx, color: '#A8F0C6' }}>Tot. Cubiertas (2+)</TableCell>
                        <TableCell sx={{ ...thSx, color: '#FFE08A' }}>Parc. Cubiertas (1)</TableCell>
                        <TableCell sx={thSx}>Vacías</TableCell>
                        <TableCell sx={thSx}>% Cobertura</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {puestoCoberturas.length === 0 ? (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>No hay puestos registrados.</TableCell></TableRow>
                      ) : puestoCoberturas.filter(item => (item.puestoNombre || '').toLowerCase().includes(searchTermPuestos.toLowerCase())).length === 0 ? (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>No se encontraron puestos que coincidan con la búsqueda.</TableCell></TableRow>
                      ) : (
                        puestoCoberturas
                          .filter(item => (item.puestoNombre || '').toLowerCase().includes(searchTermPuestos.toLowerCase()))
                          .map((item) => {
                            const pct = item.porcentajeCobertura;
                            const pctColor = pct >= 80 ? J.success : pct >= 40 ? J.warning : J.danger;
                            return (
                              <TableRow key={item.puestoId} hover sx={{ '&:hover': { bgcolor: J.surface } }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: '15px', color: J.ink }}>{item.puestoNombre}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{item.zona}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{item.totalMesas}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: J.success }} />
                                    <Typography sx={{ fontSize: '14px', color: J.success, fontWeight: 700 }}>{item.mesasTotalmenteCubiertas}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ fontSize: 16, color: J.warning }} />
                                    <Typography sx={{ fontSize: '14px', color: J.warning, fontWeight: 700 }}>{item.mesasParcialmenteCubiertas}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: '14px', color: J.danger, fontWeight: 700 }}>{item.mesasSinTestigo}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ flex: 1, height: 4, bgcolor: J.border, position: 'relative' }}>
                                      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: pctColor }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: pctColor }}>{pct}%</Typography>
                                  </Box>
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
                Selecciona Departamento → Municipio para ver las estadísticas de los puestos.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ══ TAB 3: Buscador y Listado Completo ═════════════════════════════════ */}
      {activeTab === 3 && (
        <Box>
          {/* Filters card */}
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.textMuted, mb: 2.5 }}>
                Buscador y Filtros de Acreditados
              </Typography>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                {/* Search Text */}
                <Grid size={{ xs: 12, md: 3.5 }}>
                  <TextField
                    fullWidth
                    label="Buscar por Nombre o Documento"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: J.textMuted, fontSize: 20 }} /></InputAdornment>,
                        sx: { fontSize: '14px' }
                      }
                    }}
                  />
                </Grid>

                {/* Municipio */}
                <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink sx={sxLabel}>Municipio</InputLabel>
                    <Select
                      value={selectedListMunicipio}
                      label="Municipio"
                      displayEmpty
                      onChange={e => handleListMunicipioChange(e.target.value as string)}
                      sx={sxSelect}
                      renderValue={val =>
                        val ? listMunicipios.find(m => String(m.id) === String(val))?.nombre ?? 'Todos' : <span style={{ color: J.textMuted }}>Todos</span>
                      }
                    >
                      <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todos los municipios</em></MenuItem>
                      {[...listMunicipios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(m => (
                        <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Puesto */}
                <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                  <FormControl fullWidth size="small" disabled={!selectedListMunicipio}>
                    <InputLabel shrink sx={sxLabel}>Puesto</InputLabel>
                    <SearchableSelect
                      value={selectedListPuesto}
                      label="Puesto"
                      displayEmpty
                      onChange={e => handleListPuestoChange(e.target.value as string)}
                      sx={sxSelect}
                      renderValue={val =>
                        val ? listPuestos.find(p => String(p.id) === String(val))?.nombrePuesto ?? 'Todos' : <span style={{ color: J.textMuted }}>Todos</span>
                      }
                    >
                      <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todos los puestos</em></MenuItem>
                      {[...listPuestos].sort((a, b) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map(p => (
                        <MenuItem key={p.id} value={String(p.id)}>{p.nombrePuesto}</MenuItem>
                      ))}
                    </SearchableSelect>
                  </FormControl>
                </Grid>

                {/* Mesa */}
                <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
                  <FormControl fullWidth size="small" disabled={!selectedListPuesto}>
                    <InputLabel shrink sx={sxLabel}>Mesa</InputLabel>
                    <Select
                      value={selectedListMesa}
                      label="Mesa"
                      displayEmpty
                      onChange={e => { setSelectedListMesa(e.target.value as string); setPage(0); }}
                      sx={sxSelect}
                      renderValue={val => val ? `Mesa ${val}` : <span style={{ color: J.textMuted }}>Todas</span>}
                    >
                      <MenuItem value=""><em style={{ color: J.textMuted, fontSize: '0.9rem' }}>Todas</em></MenuItem>
                      {[...listMesas].sort((a, b) => a.numeroMesa - b.numeroMesa).map(m => (
                        <MenuItem key={m.id} value={String(m.numeroMesa)}>Mesa {m.numeroMesa}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Export button */}
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={handleExportTestigosMunicipio}
                    disabled={exportingTestigosMunicipio || !selectedListMunicipio}
                    sx={{ bgcolor: J.ink, color: '#fff', borderRadius: 0, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: 'none', '&:hover': { bgcolor: J.blue } }}
                  >
                    {exportingTestigosMunicipio ? 'Exportando…' : 'Exportar Excel'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Table */}
          {loadingAcreditados ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress size={32} sx={{ color: J.blue }} /></Box>
          ) : (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PeopleIcon sx={{ color: J.blue, fontSize: 22 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '18px', color: J.ink }}>
                  {filteredAcreditados.length} acreditado{filteredAcreditados.length !== 1 ? 's' : ''} encontrado{filteredAcreditados.length !== 1 ? 's' : ''}
                </Typography>
              </Box>

              <TableContainer component={Paper} sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: J.ink }}>
                    <TableRow>
                      <TableCell sx={thSx}>Municipio</TableCell>
                      <TableCell sx={thSx}>Puesto</TableCell>
                      <TableCell sx={thSx}>Mesa</TableCell>
                      <TableCell sx={thSx}>Rol</TableCell>
                      <TableCell sx={thSx}>Documento</TableCell>
                      <TableCell sx={thSx}>Nombre Completo</TableCell>
                      <TableCell sx={thSx}>Celular</TableCell>
                      <TableCell sx={thSx}>Correo</TableCell>
                      <TableCell sx={thSx}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAcreditados.length === 0 ? (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: J.textMuted, fontSize: '13px' }}>No hay acreditados oficiales registrados.</TableCell></TableRow>
                    ) : (
                      filteredAcreditados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t: any, idx: number) => (
                        <TableRow key={t.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : J.surface, '&:hover': { bgcolor: J.muted } }}>
                          <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: J.ink }}>{t.nombreMunicipio || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '13px' }}>{t.nombrePuesto || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '13px', fontWeight: 700 }}>{t.numeroMesa ?? '—'}</TableCell>
                          <TableCell>
                            <Chip label={t.tipoTestigo} size="small"
                              sx={{ fontSize: '11px', height: 22,
                                bgcolor: t.tipoTestigo === 'PRINCIPAL' ? 'rgba(41,82,204,0.1)' : 'rgba(185,125,26,0.1)',
                                color: t.tipoTestigo === 'PRINCIPAL' ? J.blue : J.warning,
                                border: `1px solid ${t.tipoTestigo === 'PRINCIPAL' ? 'rgba(41,82,204,0.25)' : 'rgba(185,125,26,0.25)'}` }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '13px', fontFamily: '"IBM Plex Mono", monospace' }}>{t.documento}</TableCell>
                          <TableCell sx={{ fontSize: '14px', fontWeight: 600, color: J.ink }}>{t.nombreCompleto}</TableCell>
                          <TableCell sx={{ fontSize: '13px' }}>{t.celular || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '13px', color: J.textMuted }}>{t.correo || '—'}</TableCell>
                          <TableCell>
                            <Chip label={t.estado || 'Acreditado'} size="small" color="success" variant="outlined" sx={{ fontSize: '11px', height: 22 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  component="div"
                  count={filteredAcreditados.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  labelRowsPerPage="Filas por página:"
                  sx={{ fontSize: '13px', borderTop: `1px solid ${J.border}` }}
                />
              </TableContainer>
            </Box>
          )}
        </Box>
      )}

      {/* WebSocket Import dialog */}
      <Dialog
        open={importDialogOpen}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 0, overflow: 'hidden', background: `linear-gradient(135deg, ${J.ink} 0%, #243050 100%)`, color: 'white', border: 'none' }
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', p: 2, bgcolor: importStatus === 'done' ? 'rgba(45,125,78,0.2)' : importStatus === 'error' ? 'rgba(184,50,50,0.2)' : 'rgba(255,255,255,0.08)', mb: 2 }}>
              {importStatus === 'done' ? <CloudDoneIcon sx={{ fontSize: 48, color: J.success }} /> : importStatus === 'error' ? <CancelIcon sx={{ fontSize: 48, color: J.danger }} /> : <CloudUploadIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.8)' }} />}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '24px' }}>
              {importStatus === 'done' ? '¡Importación de Acreditados Exitosa!' : importStatus === 'error' ? 'Error en la Importación' : 'Importando Acreditados'}
            </Typography>
            <Box sx={{ mt: 1, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.6 }}>
              <InsertDriveFileIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: '13px', letterSpacing: '0.1em' }}>{importFileName}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            {[
              { label: 'Subiendo archivo', icon: <CloudUploadIcon />, active: importStatus === 'uploading', completed: importStatus === 'processing' || importStatus === 'done' },
              { label: 'Procesando registros', icon: <StorageIcon />, active: importStatus === 'processing', completed: importStatus === 'done' },
              { label: 'Importación completa', icon: <VerifiedIcon />, active: importStatus === 'done', completed: importStatus === 'done' }
            ].map((step, i, arr) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <Box sx={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: step.completed ? 'rgba(45,125,78,0.25)' : step.active ? 'rgba(41,82,204,0.25)' : 'rgba(255,255,255,0.06)',
                  border: step.active ? `2px solid ${J.blue}` : step.completed ? `2px solid ${J.success}` : '2px solid rgba(255,255,255,0.12)',
                  color: step.completed ? J.success : step.active ? J.blue : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.5s ease', mb: 1,
                }}>
                  {step.completed ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : React.cloneElement(step.icon as React.ReactElement<any>, { sx: { fontSize: 22 } })}
                </Box>
                <Typography sx={{ fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', color: step.active || step.completed ? 'white' : 'rgba(255,255,255,0.35)' }}>
                  {step.label}
                </Typography>
                {i < arr.length - 1 && (
                  <Box sx={{ position: 'absolute', top: 22, left: '60%', width: '80%', height: 1, bgcolor: step.completed ? J.success : 'rgba(255,255,255,0.12)' }} />
                )}
              </Box>
            ))}
          </Box>

          {importStatus === 'processing' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '13px', opacity: 0.7 }}>Procesando acreditados...</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
                    {importProgress ? `${importProgress.procesados.toLocaleString()} / ${importProgress.total.toLocaleString()}` : 'Iniciando...'}
                  </Typography>
                </Box>
                <LinearProgress variant={importProgress ? 'determinate' : 'indeterminate'} value={progressPercent} sx={{ height: 6, borderRadius: 0 }} />
                <Typography sx={{ fontSize: '9px', textAlign: 'center', mt: 1, opacity: 0.5 }}>{progressPercent}% completado</Typography>
              </Box>
            </Fade>
          )}

          {importStatus === 'uploading' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '11px', opacity: 0.7, mb: 1 }}>Enviando archivo al servidor...</Typography>
                <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 0 }} />
              </Box>
            </Fade>
          )}

          {importStatus === 'done' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', mb: 3, opacity: 0.85 }}>Todos los acreditados oficiales fueron importados correctamente.</Typography>
                <Button onClick={handleCloseImportDialog} sx={{ bgcolor: J.success, color: '#fff', borderRadius: 0, px: 4, '&:hover': { bgcolor: '#235f3b' } }}>Cerrar</Button>
              </Box>
            </Fade>
          )}

          {importStatus === 'error' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '15px', mb: 3, opacity: 0.85 }}>Error al cargar los acreditados oficiales. Revisa el formato del archivo.</Typography>
                <Button onClick={handleCloseImportDialog} sx={{ bgcolor: J.danger, color: '#fff', borderRadius: 0, px: 4, '&:hover': { bgcolor: '#8f2020' } }}>Cerrar</Button>
              </Box>
            </Fade>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 0 }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* ══ TAB 4: Comparativa Planificación ══════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <Box>
          <Card sx={{ mb: 4, border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    placeholder="Buscar por cédula o nombre..."
                    value={searchComparativa}
                    onChange={e => { setSearchComparativa(e.target.value); setPageComparativa(0); }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: J.textMuted }} /></InputAdornment>,
                        sx: { borderRadius: 0, '& fieldset': { borderColor: J.border }, '&:hover fieldset': { borderColor: J.blue } }
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={sxLabel}>Estado</InputLabel>
                    <Select
                      value={filterAcreditado}
                      label="Estado"
                      onChange={e => { setFilterAcreditado(e.target.value as any); setPageComparativa(0); }}
                      sx={sxSelect}
                    >
                      <MenuItem value="ALL">Todos</MenuItem>
                      <MenuItem value="ACREDITADO">Acreditados (Ganados / Confirmados)</MenuItem>
                      <MenuItem value="NO_ACREDITADO">No Acreditados (Perdidos)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Documento</TableCell>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Testigo (Planificación)</TableCell>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Celular</TableCell>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Municipio</TableCell>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Puesto</TableCell>
                    <TableCell sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Mesa</TableCell>
                    <TableCell align="center" sx={{ bgcolor: J.surface, fontWeight: 600, color: J.ink, fontSize: '12px' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    let filtered = comparativa;
                    if (searchComparativa) {
                      const q = searchComparativa.toLowerCase();
                      filtered = filtered.filter((c: ComparativaTestigo) =>
                        (c.documento || '').toLowerCase().includes(q) ||
                        (c.nombreCompleto || '').toLowerCase().includes(q)
                      );
                    }
                    if (filterAcreditado === 'ACREDITADO') filtered = filtered.filter((c: ComparativaTestigo) => c.fueAcreditado);
                    if (filterAcreditado === 'NO_ACREDITADO') filtered = filtered.filter((c: ComparativaTestigo) => !c.fueAcreditado);

                    const paginated = filtered.slice(pageComparativa * rowsPerPageComparativa, pageComparativa * rowsPerPageComparativa + rowsPerPageComparativa);
                    
                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: J.textMuted }}>
                            No se encontraron resultados
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return paginated.map((row: ComparativaTestigo) => (
                      <TableRow key={row.idTestigo} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '13px' }}>{row.documento}</TableCell>
                        <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{row.nombreCompleto}</TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>{row.celular}</TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>{row.nombreMunicipio}</TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>
                          <Typography variant="body2" sx={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                            {row.nombrePuesto}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>{row.numeroMesa}</TableCell>
                        <TableCell align="center">
                          {row.fueAcreditado ? (
                            <Chip label="Acreditado" size="small" icon={<CheckCircleIcon />} sx={{ bgcolor: 'rgba(45,125,78,0.1)', color: J.success, border: `1px solid rgba(45,125,78,0.25)` }} />
                          ) : (
                            <Chip label="No Acreditado" size="small" icon={<CancelIcon />} sx={{ bgcolor: 'rgba(184,50,50,0.1)', color: J.danger, border: `1px solid rgba(184,50,50,0.25)` }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={
                (() => {
                  let f = comparativa;
                  if (searchComparativa) {
                    const q = searchComparativa.toLowerCase();
                    f = f.filter((c: ComparativaTestigo) => (c.documento || '').toLowerCase().includes(q) || (c.nombreCompleto || '').toLowerCase().includes(q));
                  }
                  if (filterAcreditado === 'ACREDITADO') f = f.filter((c: ComparativaTestigo) => c.fueAcreditado);
                  if (filterAcreditado === 'NO_ACREDITADO') f = f.filter((c: ComparativaTestigo) => !c.fueAcreditado);
                  return f.length;
                })()
              }
              rowsPerPage={rowsPerPageComparativa}
              page={pageComparativa}
              onPageChange={(_, newPage) => setPageComparativa(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPageComparativa(parseInt(e.target.value, 10)); setPageComparativa(0); }}
              labelRowsPerPage="Filas:"
            />
          </Card>
        </Box>
      )}

    </Box>
  );
}
