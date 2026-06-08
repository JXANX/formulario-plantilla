import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const JAGUAR = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  muted: '#7A7A7A',
  danger: '#B83232',
};

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });
      const data = await response.json();
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: JAGUAR.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Padding so card doesn't touch edges on small phones
        p: { xs: 2, sm: 3 },
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Gold accent line — top */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent, ${JAGUAR.gold}, transparent)`,
        }}
      />

      {/* Login card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 460,
          bgcolor: '#ffffff',
          border: `1px solid ${JAGUAR.border}`,
          p: { xs: '32px 24px', sm: '52px 44px' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand */}
        <Box sx={{ mb: { xs: 4, sm: 5 }, textAlign: 'center' }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '36px', sm: '40px' },
              letterSpacing: '0.06em',
              color: JAGUAR.ink,
              lineHeight: 1,
            }}
          >
            TRACTO
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '17px', sm: '18px' },
              color: JAGUAR.gold,
              fontWeight: 600,
              mt: 0.75,
            }}
          >
            Control de Testigos
          </Typography>

          {/* thin rule */}
          <Box sx={{ mt: 3, height: '1px', bgcolor: JAGUAR.border }} />

          <Typography
            sx={{
              mt: 2.5,
              fontSize: { xs: '13px', sm: '13px' },
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: JAGUAR.muted,
              fontWeight: 500,
            }}
          >
            Acceso Institucional
          </Typography>
        </Box>

        {/* Error */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 0,
              border: `1px solid ${JAGUAR.danger}`,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} autoComplete="off">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Usuario"
              variant="outlined"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoComplete="new-username"
              inputProps={{ style: { fontSize: '1.1rem' } }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              inputProps={{ style: { fontSize: '1.1rem' } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 1,
                py: 2,
                bgcolor: JAGUAR.ink,
                color: '#fff',
                fontSize: { xs: '15px', sm: '16px' },
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                borderRadius: 0,
                boxShadow: 'none',
                minHeight: 60,
                '&:hover': { bgcolor: JAGUAR.blue, boxShadow: 'none' },
                '&:disabled': { bgcolor: 'rgba(26,31,46,0.4)', color: '#fff' },
              }}
            >
              {loading ? 'Verificando…' : 'Ingresar al Sistema'}
            </Button>
          </Box>
        </form>

        {/* Footer label */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: '12px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(26,31,46,0.3)',
            }}
          >
            Sistema Electoral — Acceso Restringido
          </Typography>
        </Box>
      </Box>

      {/* Gold accent line — bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent, ${JAGUAR.gold}, transparent)`,
        }}
      />
    </Box>
  );
}