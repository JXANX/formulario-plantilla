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
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

// Responsive drawer: narrower on phone, wider on desktop
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

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 26 }} /> },
  { label: 'Registrar Testigo', path: '/registro', icon: <PersonAddIcon sx={{ fontSize: 26 }} /> },
  { label: 'Listado de Testigos', path: '/testigos', icon: <PeopleIcon sx={{ fontSize: 26 }} /> },
  { label: 'Reporte de Mesas', path: '/reporte-mesas', icon: <AssessmentIcon sx={{ fontSize: 26 }} /> },
];

const breadcrumbMap: Record<string, { parent: string; current: string }> = {
  '/dashboard': { parent: 'MÓDULO PRINCIPAL /', current: 'Panel General' },
  '/registro': { parent: 'REGISTRO /', current: 'Alta de Testigo' },
  '/testigos': { parent: 'REGISTRO /', current: 'Listado de Testigos' },
  '/reporte-mesas': { parent: 'MONITOREO /', current: 'Reporte de Mesas' },
};

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Close drawer on route change (mobile UX)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

      {/* Brand + close btn on mobile */}
      <Box sx={{ px: 3, pt: 4, pb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '30px',
              letterSpacing: '0.08em',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            TRACTO
          </Typography>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '17px',
              color: JAGUAR.gold,
              mt: 0.5,
            }}
          >
            Control de Testigos
          </Typography>
        </Box>
        {/* Close button — only visible when mobile drawer is open */}
        <IconButton
          onClick={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            color: 'rgba(200,208,224,0.6)',
            ml: 1,
            mt: -0.5,
            '&:hover': { color: '#fff' },
          }}
          aria-label="Cerrar menú"
        >
          <CloseIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Box>

      {/* Gold rule */}
      <Box sx={{ mx: 3, mb: 2, height: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `rgba(201,151,58,0.25)` }}>
        <img src={logo} alt="Logo" style={{ height: '100%', maxHeight: '30px', width: 'auto' }} />
      </Box>

      {/* Nav items */}
      <List disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = currentPath === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              disableRipple
              sx={{
                px: 3,
                py: 1.75,
                minHeight: 58,
                borderLeft: active ? `4px solid ${JAGUAR.gold}` : '4px solid transparent',
                bgcolor: active ? 'rgba(255,255,255,0.055)' : 'transparent',
                transition: 'all 0.18s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderLeft: `4px solid rgba(201,151,58,0.45)`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? JAGUAR.gold : 'rgba(200,208,224,0.6)',
                  minWidth: 44,
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
                      fontSize: '17px',
                      fontWeight: active ? 700 : 500,
                      color: active ? JAGUAR.gold : 'rgba(200,208,224,0.8)',
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
          startIcon={<LogoutIcon sx={{ fontSize: '20px !important' }} />}
          onClick={handleLogout}
          disableRipple
          sx={{
            justifyContent: 'flex-start',
            color: 'rgba(200,208,224,0.5)',
            fontSize: '14px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            minHeight: 48,
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
            '& .MuiDrawer-paper': {
              width: '85vw',
              maxWidth: 300,
              border: 'none',
            },
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>

        {/* ── HEADER ──────────────────────────────── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: JAGUAR.canvas,
            borderBottom: `1px solid ${JAGUAR.border}`,
            color: JAGUAR.ink,
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar
            sx={{
              height: { xs: 64, sm: 72 },
              display: 'flex',
              justifyContent: 'space-between',
              px: { xs: 2, sm: 4 },
              gap: 1,
            }}
          >
            {/* Left: hamburger + breadcrumb */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{
                  display: { sm: 'none' },
                  minWidth: 48,
                  minHeight: 48,
                  flexShrink: 0,
                }}
                aria-label="Abrir menú"
              >
                <MenuIcon sx={{ fontSize: 28 }} />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  sx={{
                    fontSize: { xs: '11px', sm: '13px' },
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: JAGUAR.muted,
                    flexShrink: 0,
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {crumb.parent}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '20px', sm: '24px', md: '26px' },
                    color: JAGUAR.ink,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {crumb.current}
                </Typography>
              </Box>
            </Box>

            {/* Right: user chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {/* Vertical rule */}
              <Box sx={{ width: 1, height: 32, bgcolor: JAGUAR.border, display: { xs: 'none', lg: 'block' } }} />

              {/* Avatar + label */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: JAGUAR.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    Coordinador Principal
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
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
                    width: 44,
                    height: 44,
                    bgcolor: JAGUAR.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: JAGUAR.gold }}>
                    CP
                  </Typography>
                </Box>
              </Box>

              {/* Mobile: just the avatar square */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  width: 42,
                  height: 42,
                  bgcolor: JAGUAR.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: JAGUAR.gold }}>
                  CP
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── PAGE CONTENT ──────────────────────── */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 5 },
            bgcolor: '#F8F7F4',
            backgroundImage: 'radial-gradient(rgba(26,31,46,0.03) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            // Prevent content from overflowing on mobile
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}