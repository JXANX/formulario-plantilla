import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import SchoolIcon from '@mui/icons-material/School';
import TableBarIcon from '@mui/icons-material/TableBar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
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
  const { dashboardUpdates } = useWebSocket();
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

  // Efecto para cargar datos iniciales y reaccionar a WebSockets
  useEffect(() => {
    fetchStats();
  }, [dashboardUpdates]);

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
        {dashboardUpdates > 0 && (
          <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span className="live-indicator"></span> En vivo
          </Typography>
        )}
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
      `}</style>
    </Box>
  );
}
