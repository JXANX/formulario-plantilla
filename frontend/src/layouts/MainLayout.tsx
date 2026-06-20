import {
  Box, AppBar, Toolbar, Typography, Drawer,
  List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Button,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/ManageSearch';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useState, useEffect } from 'react';
import logo from '../assets/logo_tracto.png';
import logoBox from '../assets/logobox_tracto.png';

const drawerWidth = 270;

const JAGUAR = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  surface: '#F8F7F4',
  canvas: '#FFFFFF',
  muted: '#7A7A7A',
};

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 26 }} /> },
  { label: 'Registrar Testigo', path: '/registro', icon: <PersonAddIcon sx={{ fontSize: 26 }} /> },
  { label: 'Listado de Testigos', path: '/testigos', icon: <PeopleIcon sx={{ fontSize: 26 }} /> },
  { label: 'Coordinadores', path: '/coordinadores', icon: <AssignmentIndIcon sx={{ fontSize: 26 }} /> },
  { label: 'Reporte de Mesas', path: '/reporte-mesas', icon: <AssessmentIcon sx={{ fontSize: 26 }} /> },
  { label: 'Acreditados', path: '/acreditados', icon: <VerifiedIcon sx={{ fontSize: 26 }} /> },
  { label: 'Coord. Acreditados', path: '/coordinadores-acreditados', icon: <AssignmentIndIcon sx={{ fontSize: 26 }} /> },
  { label: 'Optimizar Cobertura', path: '/distribucion', icon: <AccountTreeIcon sx={{ fontSize: 26 }} /> },
  { label: 'Historial', path: '/historial', icon: <HistoryIcon sx={{ fontSize: 26 }} /> },
];

const breadcrumbMap: Record<string, { parent: string; current: string }> = {
  '/dashboard': { parent: 'MÓDULO PRINCIPAL /', current: 'Panel General' },
  '/registro': { parent: 'REGISTRO /', current: 'Alta de Testigo' },
  '/testigos': { parent: 'REGISTRO /', current: 'Listado de Testigos' },
  '/coordinadores': { parent: 'GESTIÓN /', current: 'Coordinadores de Puesto' },
  '/reporte-mesas': { parent: 'MONITOREO /', current: 'Reporte de Mesas' },
  '/acreditados': { parent: 'MONITOREO /', current: 'Reporte de Acreditados' },
  '/coordinadores-acreditados': { parent: 'GESTIÓN /', current: 'Coordinadores de Acreditados' },
  '/distribucion': { parent: 'INTELIGENCIA /', current: 'Optimización de Cobertura' },
  '/historial': { parent: 'AUDITORÍA /', current: 'Historial de Acciones' },
};

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm('¿Está seguro de que desea cerrar su sesión?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const currentPath = location.pathname;
  const crumb = breadcrumbMap[currentPath] ?? { parent: 'PANEL /', current: 'Electoral' };

  /* ── SIDEBAR ─────────────────────────────────────── */
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: JAGUAR.ink }}>

      <Box sx={{ px: 3, pt: 4, pb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '30px', letterSpacing: '0.08em', color: '#fff', lineHeight: 1 }}>
            TRACTO
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '17px', color: JAGUAR.gold, mt: 0.5 }}>
            Control de Testigos
          </Typography>
        </Box>
        <IconButton
          onClick={() => setMobileOpen(false)}
          sx={{ display: { xs: 'flex', sm: 'none' }, color: 'rgba(200,208,224,0.6)', ml: 1, mt: -0.5, '&:hover': { color: '#fff' } }}
          aria-label="Cerrar menú"
        >
          <CloseIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Box>

      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ height: 140, width: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,1)' }}>
          <img src={logo} alt="Logo" style={{ height: 'auto', maxHeight: '115px', width: 'auto' }} />
        </Box>
      </Box>

      <List disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = currentPath === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              disableRipple
              sx={{
                px: 3, py: 1.75, minHeight: 58,
                borderLeft: active ? `4px solid ${JAGUAR.gold}` : '4px solid transparent',
                bgcolor: active ? 'rgba(255,255,255,0.055)' : 'transparent',
                transition: 'all 0.18s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderLeft: `4px solid rgba(201,151,58,0.45)` },
              }}
            >
              <ListItemIcon sx={{ color: active ? JAGUAR.gold : 'rgba(200,208,224,0.6)', minWidth: 44, transition: 'color 0.18s' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: '17px', fontWeight: active ? 700 : 500, color: active ? JAGUAR.gold : 'rgba(200,208,224,0.8)', transition: 'color 0.18s' } } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Button
          fullWidth startIcon={<LogoutIcon sx={{ fontSize: '20px !important' }} />}
          onClick={handleLogout} disableRipple
          sx={{ justifyContent: 'flex-start', color: 'rgba(200,208,224,0.5)', fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, minHeight: 48, px: 0, '&:hover': { color: '#fff', background: 'transparent' } }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F7F4' }}>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '85vw', maxWidth: 300, border: 'none' } }}
        >
          {sidebarContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none', boxSizing: 'border-box' } }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>

        <AppBar position="sticky" elevation={0} sx={{ bgcolor: JAGUAR.canvas, borderBottom: `1px solid ${JAGUAR.border}`, color: JAGUAR.ink, zIndex: (t) => t.zIndex.drawer - 1 }}>
          <Toolbar sx={{ height: { xs: 76, sm: 96 }, minHeight: { xs: 76, sm: 96 }, display: 'flex', justifyContent: 'space-between', px: { xs: 2, sm: 4 }, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { sm: 'none' }, minWidth: 48, minHeight: 48, flexShrink: 0 }} aria-label="Abrir menú">
                <MenuIcon sx={{ fontSize: 28 }} />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0, overflow: 'hidden' }}>
                <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, letterSpacing: '0.1em', textTransform: 'uppercase', color: JAGUAR.muted, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
                  {crumb.parent}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: '20px', sm: '24px', md: '26px' }, color: JAGUAR.ink, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {crumb.current}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={logoBox} alt="TRACTO" style={{ height: '76px', width: 'auto', objectFit: 'contain' }} />
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: JAGUAR.ink, lineHeight: 1.2 }}>Coordinador Principal</Typography>
                  <Typography sx={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: JAGUAR.muted }}>Admin</Typography>
                </Box>
              </Box>
              <Box sx={{ display: { xs: 'flex', md: 'none' }, height: 60, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={logoBox} alt="TRACTO" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 5 }, bgcolor: '#F8F7F4', backgroundImage: 'radial-gradient(rgba(26,31,46,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', minWidth: 0, overflowX: 'hidden' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}