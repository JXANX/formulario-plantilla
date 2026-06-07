import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.token) {
        // Guardar token en localStorage
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }} gutterBottom>
          Acceso Electoral
        </Typography>
        <Card sx={{ width: '100%', mt: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
              Iniciar Sesión
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <form onSubmit={handleLogin} autoComplete="off">
              <TextField
                fullWidth
                label="Usuario"
                variant="outlined"
                margin="normal"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                inputProps={{ autoComplete: 'new-username' }}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputProps={{ autoComplete: 'new-password' }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 4, mb: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Ingresar al Sistema
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
