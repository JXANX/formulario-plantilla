import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, 
  Dialog, DialogContent, LinearProgress, Snackbar, Alert, Fade
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PeopleIcon from '@mui/icons-material/People';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import SchoolIcon from '@mui/icons-material/School';
import TableBarIcon from '@mui/icons-material/TableBar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useWebSocket } from '../hooks/useWebSocket';

// Tipos de datos
interface DashboardStats {
  totalTestigos: number;
  totalMunicipios: number;
  totalPuestos: number;
  totalMesas: number;
  mesasVerdes: number;
  mesasAmarillas: number;
  mesasRojas: number;
  mesasCubiertas: number;
  mesasPendientes: number;
  porcentajeCobertura: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function DashboardPage() {
  const { dashboardUpdates, importProgress, clearImportProgress } = useWebSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalTestigos: 0,
    totalMunicipios: 0,
    totalPuestos: 0,
    totalMesas: 0,
    mesasVerdes: 0,
    mesasAmarillas: 0,
    mesasRojas: 0,
    mesasCubiertas: 0,
    mesasPendientes: 0,
    porcentajeCobertura: 0
  });

  // Import modal state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [importFileName, setImportFileName] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  // Download state
  const [downloading, setDownloading] = useState(false);

  // Efecto para cargar datos iniciales y reaccionar a WebSockets
  useEffect(() => {
    fetchStats();
  }, [dashboardUpdates]);

  // Listen for import progress from WebSocket
  useEffect(() => {
    if (importProgress && importStatus === 'processing') {
      if (importProgress.procesados >= importProgress.total && importProgress.total > 0) {
        setTimeout(() => {
          setImportStatus('done');
          fetchStats();
        }, 500);
      }
    }
  }, [importProgress]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas", error);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/excel/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Testigos_Electorales_Export.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSnackbar({ open: true, message: '✅ Excel descargado exitosamente', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '❌ Error al descargar el archivo', severity: 'error' });
      }
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: '❌ Error de conexión al descargar', severity: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadExcel = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportStatus('uploading');
    setImportDialogOpen(true);
    clearImportProgress();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('token');
      
      // Small delay for visual effect
      await new Promise(r => setTimeout(r, 800));
      setImportStatus('processing');
      
      const response = await fetch(`${API_URL}/api/excel/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        setImportStatus('done');
        fetchStats();
      } else {
        setImportStatus('error');
      }
    } catch (error) {
      console.error(error);
      setImportStatus('error');
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setTimeout(() => {
      setImportStatus('idle');
      clearImportProgress();
    }, 300);
  };

  const progressPercent = importProgress && importProgress.total > 0 
    ? Math.round((importProgress.procesados / importProgress.total) * 100) 
    : 0;

  const ImportProgressDialog = () => {
    const steps = [
      { 
        label: 'Subiendo archivo', 
        icon: <CloudUploadIcon />, 
        active: importStatus === 'uploading',
        completed: importStatus === 'processing' || importStatus === 'done'
      },
      { 
        label: 'Procesando registros', 
        icon: <StorageIcon />, 
        active: importStatus === 'processing',
        completed: importStatus === 'done'
      },
      { 
        label: 'Importación completa', 
        icon: <VerifiedIcon />, 
        active: importStatus === 'done',
        completed: importStatus === 'done'
      },
    ];

    return (
      <Dialog 
        open={importDialogOpen} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0d1b3e 0%, #1a237e 50%, #283593 100%)',
            color: 'white',
          }
        }}}
      >
        <DialogContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ 
              display: 'inline-flex', 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: importStatus === 'done' ? 'rgba(76, 175, 80, 0.2)' : importStatus === 'error' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              mb: 2,
              animation: importStatus === 'processing' ? 'pulse-glow 2s infinite' : 'none'
            }}>
              {importStatus === 'done' ? (
                <CloudDoneIcon sx={{ fontSize: 48, color: '#4caf50' }} />
              ) : importStatus === 'error' ? (
                <CancelIcon sx={{ fontSize: 48, color: '#f44336' }} />
              ) : (
                <CloudUploadIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.8)' }} />
              )}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {importStatus === 'done' ? '¡Importación Exitosa!' : importStatus === 'error' ? 'Error en la Importación' : 'Importando Plantilla'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1, opacity: 0.7 }}>
              <InsertDriveFileIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">{importFileName}</Typography>
            </Box>
          </Box>

          {/* Steps */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            {steps.map((step, index) => (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <Box sx={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: step.completed ? 'rgba(76, 175, 80, 0.3)' : step.active ? 'rgba(66, 165, 245, 0.3)' : 'rgba(255,255,255,0.08)',
                  border: step.active ? '2px solid #42a5f5' : step.completed ? '2px solid #4caf50' : '2px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.5s ease',
                  animation: step.active ? 'step-pulse 1.5s infinite' : 'none',
                  color: step.completed ? '#4caf50' : step.active ? '#42a5f5' : 'rgba(255,255,255,0.3)',
                  mb: 1
                }}>
                  {step.completed ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : React.cloneElement(step.icon, { sx: { fontSize: 22 } })}
                </Box>
                <Typography variant="caption" sx={{ 
                  textAlign: 'center', 
                  color: step.active || step.completed ? 'white' : 'rgba(255,255,255,0.4)',
                  fontWeight: step.active ? 'bold' : 'normal',
                  fontSize: '0.7rem'
                }}>
                  {step.label}
                </Typography>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <Box sx={{
                    position: 'absolute',
                    top: 22,
                    left: '60%',
                    width: '80%',
                    height: 2,
                    bgcolor: step.completed ? '#4caf50' : 'rgba(255,255,255,0.15)',
                    transition: 'background-color 0.5s ease'
                  }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Progress Bar */}
          {importStatus === 'processing' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Procesando registros...
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {importProgress ? `${importProgress.procesados.toLocaleString()} / ${importProgress.total.toLocaleString()}` : 'Iniciando...'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant={importProgress ? "determinate" : "indeterminate"} 
                  value={progressPercent}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #42a5f5, #66bb6a, #42a5f5)',
                      backgroundSize: '200% 100%',
                      animation: 'gradient-shift 2s linear infinite',
                    }
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, opacity: 0.6 }}>
                  {progressPercent}% completado
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Uploading Indicator */}
          {importStatus === 'uploading' && (
            <Fade in>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                  Subiendo archivo al servidor...
                </Typography>
                <LinearProgress 
                  variant="indeterminate"
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #42a5f5, #7c4dff, #42a5f5)',
                      backgroundSize: '200% 100%',
                      animation: 'gradient-shift 1.5s linear infinite',
                    }
                  }}
                />
              </Box>
            </Fade>
          )}

          {/* Done State */}
          {importStatus === 'done' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                  Todos los registros fueron importados y actualizados correctamente.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleCloseImportDialog}
                  sx={{ 
                    bgcolor: '#4caf50', 
                    '&:hover': { bgcolor: '#388e3c' },
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 'bold'
                  }}
                >
                  Cerrar
                </Button>
              </Box>
            </Fade>
          )}

          {/* Error State */}
          {importStatus === 'error' && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                  Ocurrió un error al importar el archivo. Verifica que el formato sea correcto.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleCloseImportDialog}
                  sx={{ 
                    bgcolor: '#f44336', 
                    '&:hover': { bgcolor: '#d32f2f' },
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 'bold'
                  }}
                >
                  Cerrar
                </Button>
              </Box>
            </Fade>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="h4" color="textPrimary">
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            backgroundColor: `${color}15`, 
            p: 1.5, 
            borderRadius: 2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary.main">
          Dashboard Electoral
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            component="label"
          >
            Subir Plantilla Excel
            <input type="file" hidden accept=".xlsx" onChange={handleUploadExcel} />
          </Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={downloading}
          >
            {downloading ? 'Descargando...' : 'Descargar Excel'}
          </Button>
          {dashboardUpdates > 0 && (
            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <span className="live-indicator"></span> En vivo
            </Typography>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Tarjetas Principales */}
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard title="Total Testigos" value={stats.totalTestigos} icon={<PeopleIcon sx={{ color: 'primary.main' }} />} color="#0d1b3e" />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard title="Municipios" value={stats.totalMunicipios} icon={<LocationCityIcon sx={{ color: 'primary.main' }} />} color="#0d1b3e" />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard title="Puestos" value={stats.totalPuestos} icon={<SchoolIcon sx={{ color: 'primary.main' }} />} color="#0d1b3e" />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard title="Total Mesas" value={stats.totalMesas} icon={<TableBarIcon sx={{ color: 'primary.main' }} />} color="#0d1b3e" />
        </Grid>

        {/* Semáforo Electoral */}
        <Grid size={{xs: 12}}>
          <Typography variant="h5" sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>
            Semáforo de Cobertura
          </Typography>
        </Grid>

        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard 
            title="Cobertura Completa (Verde)" 
            value={stats.mesasVerdes} 
            icon={<CheckCircleIcon color="success" fontSize="large" />} 
            color="#43a047" 
          />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard 
            title="Cobertura Parcial (Amarillo)" 
            value={stats.mesasAmarillas} 
            icon={<WarningIcon color="warning" fontSize="large" />} 
            color="#ffb300" 
          />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard 
            title="Sin Cobertura (Rojo)" 
            value={stats.mesasRojas} 
            icon={<CancelIcon sx={{ color: 'error.main' }} fontSize="large" />} 
            color="#e53935" 
          />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <StatCard 
            title="Porcentaje Cobertura" 
            value={`${stats.porcentajeCobertura}%`} 
            icon={<CheckCircleIcon sx={{ color: 'primary.main' }} fontSize="large" />} 
            color="#0d1b3e" 
          />
        </Grid>
      </Grid>

      {/* Import Progress Dialog */}
      <ImportProgressDialog />

      {/* Snackbar Notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <style>{`
        .live-indicator {
          width: 8px;
          height: 8px;
          background-color: #43a047;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(67, 160, 71, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(67, 160, 71, 0); }
          100% { box-shadow: 0 0 0 0 rgba(67, 160, 71, 0); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(66, 165, 245, 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(66, 165, 245, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(66, 165, 245, 0.4); }
        }
        @keyframes step-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </Box>
  );
}
