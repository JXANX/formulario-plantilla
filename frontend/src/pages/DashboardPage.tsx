import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Dialog, DialogContent, LinearProgress, Snackbar, Alert, Fade
} from '@mui/material';
import DownloadIcon      from '@mui/icons-material/Download';
import UploadIcon        from '@mui/icons-material/Upload';
import PeopleIcon        from '@mui/icons-material/People';
import LocationCityIcon  from '@mui/icons-material/LocationCity';
import SchoolIcon        from '@mui/icons-material/School';
import TableBarIcon      from '@mui/icons-material/TableBar';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import WarningIcon       from '@mui/icons-material/Warning';
import CancelIcon        from '@mui/icons-material/Cancel';
import CloudUploadIcon   from '@mui/icons-material/CloudUpload';
import CloudDoneIcon     from '@mui/icons-material/CloudDone';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StorageIcon       from '@mui/icons-material/Storage';
import VerifiedIcon      from '@mui/icons-material/Verified';
import { useWebSocket }  from '../hooks/useWebSocket';

/* ── JAGUAR tokens ───────────────────────────────── */
const J = {
  ink:     '#1A1F2E',
  blue:    '#2952CC',
  gold:    '#C9973A',
  surface: '#F8F7F4',
  canvas:  '#FFFFFF',
  muted:   '#F0EEE9',
  border:  '#E2DDD6',
  success: '#2D7D4E',
  warning: '#B97D1A',
  danger:  '#B83232',
  textBody:'#2C2C2C',
  textMuted:'#7A7A7A',
};

/* ── Types ───────────────────────────────────────── */
interface DashboardStats {
  totalTestigos:         number;
  totalMunicipios:       number;
  totalPuestos:          number;
  totalMesas:            number;
  mesasVerdes:           number;
  mesasAmarillas:        number;
  mesasRojas:            number;
  mesasCubiertas:        number;
  mesasPendientes:       number;
  porcentajeCobertura:   number;
  testigosFaltantes:     number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* ── Stat card ───────────────────────────────────── */
function StatCard({
  title, value, icon, accentColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        bgcolor: J.canvas,
        border: `1px solid ${J.border}`,
        borderTop: `4px solid ${accentColor}`,
        borderRadius: 0,
        boxShadow: 'none',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 28px rgba(26,31,46,0.09)',
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              sx={{
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: J.textMuted,
                mb: 2,
                display: 'block',
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '3.2rem',
                color: J.ink,
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.75,
              bgcolor: `${accentColor}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ── Main component ──────────────────────────────── */
export default function DashboardPage() {
  const { dashboardUpdates, importProgress, clearImportProgress } = useWebSocket();

  const [stats, setStats] = useState<DashboardStats>({
    totalTestigos: 0, totalMunicipios: 0, totalPuestos: 0, totalMesas: 0,
    mesasVerdes: 0, mesasAmarillas: 0, mesasRojas: 0,
    mesasCubiertas: 0, mesasPendientes: 0, porcentajeCobertura: 0, testigosFaltantes: 0,
  });

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStatus,     setImportStatus]     = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [importFileName,   setImportFileName]   = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success'|'error'|'info' }>({ open: false, message: '', severity: 'info' });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchStats(); }, [dashboardUpdates]);

  useEffect(() => {
    if (importProgress && importStatus === 'processing') {
      if (importProgress.procesados >= importProgress.total && importProgress.total > 0) {
        setTimeout(() => { setImportStatus('done'); fetchStats(); }, 500);
      }
    }
  }, [importProgress]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
      if (res.ok) { const r = await res.json(); setStats(r.data); }
    } catch (e) { console.error('Error cargando estadísticas', e); }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/excel/export`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'Testigos_Electorales_Export.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
        setSnackbar({ open: true, message: '✅ Excel descargado exitosamente', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '❌ Error al descargar el archivo', severity: 'error' });
      }
    } catch { setSnackbar({ open: true, message: '❌ Error de conexión al descargar', severity: 'error' }); }
    finally  { setDownloading(false); }
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
      await new Promise(r => setTimeout(r, 800));
      setImportStatus('processing');
      const res = await fetch(`${API_URL}/api/excel/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { setImportStatus('done'); fetchStats(); }
      else          setImportStatus('error');
    } catch { setImportStatus('error'); }
    event.target.value = '';
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setTimeout(() => { setImportStatus('idle'); clearImportProgress(); }, 300);
  };

  const progressPercent = importProgress && importProgress.total > 0
    ? Math.round((importProgress.procesados / importProgress.total) * 100)
    : 0;

  /* ── Import dialog ───────────────────────── */
  const ImportDialog = () => {
    const steps = [
      { label: 'Subiendo archivo',     icon: <CloudUploadIcon />, active: importStatus === 'uploading',  completed: importStatus === 'processing' || importStatus === 'done' },
      { label: 'Procesando registros', icon: <StorageIcon />,     active: importStatus === 'processing', completed: importStatus === 'done' },
      { label: 'Importación completa', icon: <VerifiedIcon />,    active: importStatus === 'done',       completed: importStatus === 'done' },
    ];

    return (
      <Dialog
        open={importDialogOpen}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 0,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${J.ink} 0%, #243050 100%)`,
              color: 'white',
              border: 'none',
            },
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex', p: 2,
                bgcolor: importStatus === 'done'  ? 'rgba(45,125,78,0.2)'
                       : importStatus === 'error' ? 'rgba(184,50,50,0.2)'
                       : 'rgba(255,255,255,0.08)',
                mb: 2,
                animation: importStatus === 'processing' ? 'pulse-glow 2s infinite' : 'none',
              }}
            >
              {importStatus === 'done'  ? <CloudDoneIcon   sx={{ fontSize: 48, color: J.success }} /> :
               importStatus === 'error' ? <CancelIcon       sx={{ fontSize: 48, color: J.danger  }} /> :
                                          <CloudUploadIcon  sx={{ fontSize: 48, color: 'rgba(255,255,255,0.8)' }} />}
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: '24px' }}>
              {importStatus === 'done'  ? '¡Importación Exitosa!'
               : importStatus === 'error' ? 'Error en la Importación'
               : 'Importando Plantilla'}
            </Typography>

            {/* Gold separator */}
            <Box sx={{ mt: 1, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.6 }}>
              <InsertDriveFileIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: '13px', letterSpacing: '0.1em' }}>
                {importFileName}
              </Typography>
            </Box>
          </Box>

          {/* Steps */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            {steps.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <Box sx={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor:    step.completed ? 'rgba(45,125,78,0.25)' : step.active ? `rgba(41,82,204,0.25)` : 'rgba(255,255,255,0.06)',
                  border:     step.active ? `2px solid ${J.blue}` : step.completed ? `2px solid ${J.success}` : '2px solid rgba(255,255,255,0.12)',
                  color:      step.completed ? J.success : step.active ? J.blue : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.5s ease',
                  animation:  step.active ? 'step-pulse 1.5s infinite' : 'none',
                  mb: 1,
                }}>
                  {step.completed ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : React.cloneElement(step.icon as React.ReactElement<any>, { sx: { fontSize: 22 } })}
                </Box>
                <Typography sx={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', color: step.active || step.completed ? 'white' : 'rgba(255,255,255,0.35)', fontWeight: step.active ? 700 : 400 }}>
                  {step.label}
                </Typography>
                {i < steps.length - 1 && (
                  <Box sx={{ position: 'absolute', top: 22, left: '60%', width: '80%', height: 1, bgcolor: step.completed ? J.success : 'rgba(255,255,255,0.12)', transition: 'background-color 0.5s' }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Progress bar */}
          {importStatus === 'processing' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '13px', opacity: 0.7 }}>Procesando registros...</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
                    {importProgress ? `${importProgress.procesados.toLocaleString()} / ${importProgress.total.toLocaleString()}` : 'Iniciando...'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={importProgress ? 'determinate' : 'indeterminate'}
                  value={progressPercent}
                  sx={{ height: 6, borderRadius: 0, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { borderRadius: 0, background: `linear-gradient(90deg, ${J.blue}, ${J.gold}, ${J.blue})`, backgroundSize: '200% 100%', animation: 'gradient-shift 2s linear infinite' } }}
                />
                <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', letterSpacing: '0.12em', textAlign: 'center', mt: 1, opacity: 0.5 }}>
                  {progressPercent}% completado
                </Typography>
              </Box>
            </Fade>
          )}

          {importStatus === 'uploading' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', opacity: 0.7, mb: 1 }}>Subiendo archivo al servidor...</Typography>
                <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 0, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { borderRadius: 0, background: `linear-gradient(90deg, ${J.blue}, ${J.gold}, ${J.blue})`, backgroundSize: '200% 100%', animation: 'gradient-shift 1.5s linear infinite' } }} />
              </Box>
            </Fade>
          )}

          {importStatus === 'done' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '14px', mb: 3, opacity: 0.85 }}>
                  Todos los registros fueron importados y actualizados correctamente.
                </Typography>
                <Button onClick={handleCloseImportDialog} sx={{ bgcolor: J.success, color: '#fff', borderRadius: 0, px: 4, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase', '&:hover': { bgcolor: '#235f3b' } }}>
                  Cerrar
                </Button>
              </Box>
            </Fade>
          )}

          {importStatus === 'error' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '16px', mb: 3, opacity: 0.85 }}>
                  Ocurrió un error al importar el archivo. Verifica que el formato sea correcto.
                </Typography>
                <Button onClick={handleCloseImportDialog} sx={{ bgcolor: J.danger, color: '#fff', borderRadius: 0, px: 4, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase', '&:hover': { bgcolor: '#8f2020' } }}>
                  Cerrar
                </Button>
              </Box>
            </Fade>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  /* ── Render ──────────────────────────────── */
  return (
    <Box>
      {/* Page header row */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
                  Panel General
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '36px', color: J.ink }}>
                  Dashboard Electoral
                </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {dashboardUpdates > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className="live-indicator" />
              <Typography sx={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: J.success }}>
                En vivo
              </Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: '16px !important' }} />}
            component="label"
            sx={{
              borderColor: J.border,
              color: J.ink,
              borderRadius: 0,
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              py: 1,
              '&:hover': { bgcolor: '#F0EEE9', borderColor: J.border },
            }}
          >
            Subir Plantilla Excel
            <input type="file" hidden accept=".xlsx" onChange={handleUploadExcel} />
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
            onClick={handleDownloadExcel}
            disabled={downloading}
            sx={{
              bgcolor: J.ink,
              color: '#fff',
              borderRadius: 0,
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              py: 1,
              boxShadow: 'none',
              '&:hover': { bgcolor: J.blue, boxShadow: 'none' },
            }}
          >
            {downloading ? 'Descargando…' : 'Descargar Excel'}
          </Button>
        </Box>
      </Box>

      {/* Gold divider */}
      <Box sx={{ height: 1, bgcolor: J.border, mb: 4 }} />

      {/* ── Stats grid ── */}
      <Typography sx={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.textMuted, mb: 2 }}>
        Métricas Generales
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Testigos"   value={stats.totalTestigos}   icon={<PeopleIcon       sx={{ fontSize: 34 }} />} accentColor={J.blue} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Municipios"       value={stats.totalMunicipios} icon={<LocationCityIcon sx={{ fontSize: 34 }} />} accentColor={J.ink}  />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Puestos"          value={stats.totalPuestos}    icon={<SchoolIcon       sx={{ fontSize: 34 }} />} accentColor={J.ink}  />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Mesas"      value={stats.totalMesas}      icon={<TableBarIcon     sx={{ fontSize: 34 }} />} accentColor={J.ink}  />
        </Grid>
      </Grid>

      {/* ── Semáforo ── */}
      <Box sx={{ height: 1, bgcolor: J.border, mb: 4 }} />
      <Typography sx={{ fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.textMuted, mb: 3 }}>
        Semáforo de Cobertura
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Cobertura Completa"   value={stats.mesasVerdes}            icon={<CheckCircleIcon sx={{ fontSize: 34 }} />} accentColor={J.success} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Cobertura Parcial"    value={stats.mesasAmarillas}          icon={<WarningIcon     sx={{ fontSize: 34 }} />} accentColor={J.warning} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Testigos Faltantes"   value={stats.testigosFaltantes}      icon={<PeopleIcon      sx={{ fontSize: 34 }} />} accentColor={J.warning} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Porcentaje Cobertura" value={`${stats.porcentajeCobertura}%`} icon={<CheckCircleIcon sx={{ fontSize: 34 }} />} accentColor={J.blue} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Mesas sin Testigo"        value={stats.mesasRojas}             icon={<CancelIcon      sx={{ fontSize: 34 }} />} accentColor={J.danger}  />
        </Grid>
      </Grid>

      {/* Import dialog */}
      <ImportDialog />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 0 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
