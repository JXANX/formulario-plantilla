import {
  Box, AppBar, Toolbar, Typography, Drawer,
  List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Button,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon  from '@mui/icons-material/PersonAdd';
import PeopleIcon     from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon       from '@mui/icons-material/Menu';
import LogoutIcon     from '@mui/icons-material/Logout';
import { useState, useEffect } from 'react';

const drawerWidth = 228;

const JAGUAR = {
  ink:    '#1A1F2E',
  blue:   '#2952CC',
  gold:   '#C9973A',
  border: '#E2DDD6',
  surface:'#F8F7F4',
  canvas: '#FFFFFF',
  muted:  '#7A7A7A',
};

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',           path: '/dashboard',     icon: <DashboardIcon  sx={{ fontSize: 20 }} /> },
  { label: 'Registrar Testigo',   path: '/registro',      icon: <PersonAddIcon  sx={{ fontSize: 20 }} /> },
  { label: 'Listado de Testigos', path: '/testigos',      icon: <PeopleIcon     sx={{ fontSize: 20 }} /> },
  { label: 'Reporte de Mesas',    path: '/reporte-mesas', icon: <AssessmentIcon sx={{ fontSize: 20 }} /> },
];

const breadcrumbMap: Record<string, { parent: string; current: string }> = {
  '/dashboard':     { parent: 'MÓDULO PRINCIPAL /', current: 'Panel General' },
  '/registro':      { parent: 'REGISTRO INSTITUCIONAL /', current: 'Alta de Testigo' },
  '/testigos':      { parent: 'REGISTRO INSTITUCIONAL /', current: 'Listado de Testigos' },
  '/reporte-mesas': { parent: 'MONITOREO /', current: 'Reporte de Mesas' },
};

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('¿Está seguro de que desea cerrar su sesión?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const currentPath = location.pathname;
  const crumb = breadcrumbMap[currentPath] ?? { parent: 'PANEL /', current: 'Electoral' };

  /* ── SIDEBAR CONTENT ─────────────────────────────── */
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: JAGUAR.ink }}>

      {/* Brand */}
      <Box sx={{ px: 3, pt: 5, pb: 4 }}>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 600,
            fontSize: '22px',
            letterSpacing: '0.08em',
            color: '#fff',
            lineHeight: 1,
          }}
        >
          TRACTO
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '13px',
            color: JAGUAR.gold,
            mt: 0.5,
          }}
        >
          Control de Testigos
        </Typography>
      </Box>

      {/* Gold rule */}
      <Box sx={{ mx: 3, mb: 2, height: 1, bgcolor: `rgba(201,151,58,0.25)` }} />

      {/* Nav items */}
      <List disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = currentPath === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              disableRipple
              sx={{
                px: 3,
                py: 1.5,
                borderLeft: active ? `2px solid ${JAGUAR.gold}` : '2px solid transparent',
                bgcolor: active ? 'rgba(255,255,255,0.055)' : 'transparent',
                transition: 'all 0.18s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderLeft: `2px solid rgba(201,151,58,0.45)`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? JAGUAR.gold : 'rgba(200,208,224,0.6)',
                  minWidth: 36,
                  transition: 'color 0.18s',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '13.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? JAGUAR.gold : 'rgba(200,208,224,0.75)',
                      transition: 'color 0.18s',
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Button
          fullWidth
          startIcon={<LogoutIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleLogout}
          disableRipple
          sx={{
            justifyContent: 'flex-start',
            color: 'rgba(200,208,224,0.45)',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            px: 0,
            '&:hover': { color: '#fff', background: 'transparent' },
          }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F7F4' }}>

      {/* ── SIDEBAR ────────────────────────────── */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 'none',
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* ── MAIN COLUMN ─────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── HEADER ──────────────────────────────── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: JAGUAR.canvas,
            borderBottom: `1px solid ${JAGUAR.border}`,
            color: JAGUAR.ink,
          }}
        >
          <Toolbar sx={{ height: 64, display: 'flex', justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
            {/* Left: hamburger + breadcrumb */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: JAGUAR.muted,
                  }}
                >
                  {crumb.parent}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: '19px',
                    color: JAGUAR.ink,
                    lineHeight: 1,
                  }}
                >
                  {crumb.current}
                </Typography>
              </Box>
            </Box>

            {/* Right: user chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Vertical rule */}
              <Box sx={{ width: 1, height: 32, bgcolor: JAGUAR.border, display: { xs: 'none', md: 'block' } }} />

              {/* Avatar + label */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: JAGUAR.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    Coordinador Principal
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: JAGUAR.muted,
                    }}
                  >
                    Admin
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: JAGUAR.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: JAGUAR.gold,
                    }}
                  >
                    CP
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── PAGE CONTENT ──────────────────────── */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 4 },
            bgcolor: '#F8F7F4',
            /* subtle dot grid atmosphere */
            backgroundImage: 'radial-gradient(rgba(26,31,46,0.035) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
