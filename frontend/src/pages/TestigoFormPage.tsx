import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem, FormControl, InputLabel, Select, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function TestigoFormPage() {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [mesas, setMesas] = useState([]);

  const [selectedDepto, setSelectedDepto] = useState('');
  const [selectedMpio, setSelectedMpio] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');
  const [selectedMesa, setSelectedMesa] = useState('');

  const [formData, setFormData] = useState({
    documento: '',
    nombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    celular: '',
    correo: '',
    tipoTestigo: 'PRINCIPAL'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerificarDocumento = async () => {
    if (!formData.documento) return;
    setIsVerifying(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos/documento/${formData.documento}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSuccess('El testigo ya existe. Verifique sus datos o asigne ubicación si es necesario.');
        const t = data.data;
        setFormData(prev => ({
          ...prev,
          nombre: t.nombre || '',
          segundoNombre: t.segundoNombre || '',
          primerApellido: t.primerApellido || '',
          segundoApellido: t.segundoApellido || '',
          celular: t.celular || '',
          correo: t.correo || '',
          tipoTestigo: t.tipoTestigo || 'PRINCIPAL'
        }));

        // If it has location, we might want to load it (optional, skipped for brevity or handled manually by user)
      } else {
        setSuccess('Documento disponible para registro nuevo.');
      }
    } catch (err) {
      setError('Cedula ya registrada');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setDepartamentos(data.data);
      }).catch(console.error);
  }, []);

  const handleDeptoChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedDepto(e.target.value);
    setSelectedMpio('');
    setPuestos([]);
    setMesas([]);
    fetch(`${API_URL}/api/catalogo/departamentos/${e.target.value}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMunicipios(data.data);
      });
  };

  const handleMpioChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedMpio(e.target.value);
    setSelectedPuesto('');
    setMesas([]);
    fetch(`${API_URL}/api/catalogo/municipios/${e.target.value}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setPuestos(data.data);
      });
  };

  const handlePuestoChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedPuesto(e.target.value);
    setSelectedMesa('');
    fetch(`${API_URL}/api/catalogo/puestos/${e.target.value}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMesas(data.data);
      });
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/testigos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, mesaId: selectedMesa })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Testigo registrado correctamente');
        // Limpiar campos personales
        setFormData({
          documento: '',
          nombre: '',
          segundoNombre: '',
          primerApellido: '',
          segundoApellido: '',
          celular: '',
          correo: '',
          tipoTestigo: 'PRINCIPAL'
        });
        // Limpiar mesa seleccionada
        setSelectedMesa('');
        // Recargar las mesas del puesto para actualizar ocupados
        if (selectedPuesto) {
          fetch(`${API_URL}/api/catalogo/puestos/${selectedPuesto}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(d => {
              if (d.success) setMesas(d.data);
            });
        }
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary.main" gutterBottom>
        Registro de Testigos
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" color="secondary.main">1. Buscar/Verificar Cédula</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    required
                    label="Cédula / Documento"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleVerificarDocumento}
                    disabled={!formData.documento || isVerifying}
                  >
                    Verificar
                  </Button>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" color="secondary.main" sx={{ mt: 2 }}>2. Datos Personales</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required label="Primer Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth label="Segundo Nombre" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required label="Primer Apellido" name="primerApellido" value={formData.primerApellido} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth label="Segundo Apellido" name="segundoApellido" value={formData.segundoApellido} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required label="Celular" name="celular" value={formData.celular} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth label="Correo Electrónico" name="correo" type="email" value={formData.correo} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo Testigo</InputLabel>
                  <Select name="tipoTestigo" value={formData.tipoTestigo} label="Tipo Testigo" onChange={handleChange}>
                    <MenuItem value="PRINCIPAL">PRINCIPAL</MenuItem>
                    <MenuItem value="SUPLENTE">SUPLENTE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" color="secondary.main" sx={{ mt: 2 }}>3. Asignación Electoral</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select value={selectedDepto} label="Departamento" onChange={handleDeptoChange} required>
                    {departamentos.map((d: any) => <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedDepto}>
                  <InputLabel>Municipio</InputLabel>
                  <Select value={selectedMpio} label="Municipio" onChange={handleMpioChange} required>
                    {municipios.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedMpio}>
                  <InputLabel>Puesto</InputLabel>
                  <Select value={selectedPuesto} label="Puesto" onChange={handlePuestoChange} required>
                    {puestos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombrePuesto}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedPuesto}>
                  <InputLabel>Mesa</InputLabel>
                  <Select value={selectedMesa} label="Mesa" onChange={(e) => setSelectedMesa(e.target.value as string)} required>
                    {mesas
                      .filter((m: any) => m.ocupados < m.capacidad)
                      .map((m: any) => {
                        const isPartial = m.ocupados > 0 && m.ocupados < m.capacidad;
                        return (
                          <MenuItem
                            key={m.id}
                            value={m.id}
                            sx={{
                              color: isPartial ? '#b8860b' : '#d32f2f',
                              fontWeight: 'medium',
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%'
                            }}
                          >
                            <span>Mesa {m.numeroMesa}</span>
                            <span>{isPartial ? '🟡 Parcial' : '🔴 Vacía'}</span>
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" size="large" startIcon={<SaveIcon />}>
                  Registrar Testigo
                </Button>
              </Grid>

            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
