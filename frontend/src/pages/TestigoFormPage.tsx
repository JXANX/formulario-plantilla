import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  MenuItem, FormControl, InputLabel, Select, Alert
} from '@mui/material';
import SaveIcon      from '@mui/icons-material/Save';
import SearchIcon    from '@mui/icons-material/Search';
import { useToast }  from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink:    '#1A1F2E',
  blue:   '#2952CC',
  gold:   '#C9973A',
  border: '#E2DDD6',
  muted:  '#F0EEE9',
  textMuted: '#7A7A7A',
  success:   '#2D7D4E',
  danger:    '#B83232',
};

/* ─── small helper: section title ─────────────────── */
function SectionLabel({ num, text }: { num: string; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box
        sx={{
          width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${J.border}`, flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.ink }}>
          {num}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: J.gold, fontWeight: 600 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function TestigoFormPage() {
  const [departamentos,   setDepartamentos]   = useState([]);
  const [municipios,      setMunicipios]      = useState([]);
  const [puestos,         setPuestos]         = useState([]);
  const [mesas,           setMesas]           = useState([]);

  const [selectedDepto,   setSelectedDepto]   = useState('');
  const [selectedMpio,    setSelectedMpio]    = useState('');
  const [selectedPuesto,  setSelectedPuesto]  = useState('');
  const [selectedMesa,    setSelectedMesa]    = useState('');

  const [formData, setFormData] = useState({
    documento: '', nombre: '', segundoNombre: '',
    primerApellido: '', segundoApellido: '',
    celular: '', correo: '', tipoTestigo: 'PRINCIPAL',
  });

  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const toast = useToast();

  /* ── Logic (unchanged) ─────────────────────────── */
  const handleVerificarDocumento = async () => {
    if (!formData.documento) return;
    setIsVerifying(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res  = await fetch(`${API_URL}/api/testigos/documento/${formData.documento}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data) {
        setSuccess('El testigo ya existe. Verifique sus datos o asigne ubicación si es necesario.');
        toast.warning('El testigo ya existe. Verifique sus datos o asigne ubicación si es necesario.');
        const t = data.data;
        setFormData(prev => ({ ...prev, nombre: t.nombre||'', segundoNombre: t.segundoNombre||'', primerApellido: t.primerApellido||'', segundoApellido: t.segundoApellido||'', celular: t.celular||'', correo: t.correo||'', tipoTestigo: t.tipoTestigo||'PRINCIPAL' }));
      } else {
        setSuccess('Documento disponible para registro nuevo.');
        toast.info('Documento disponible para registro nuevo.');
      }
    } catch { setError('Cédula ya registrada.'); toast.error('Cédula ya registrada.'); }
    finally  { setIsVerifying(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setDepartamentos(d.data); }).catch(console.error);
  }, []);

  const handleDeptoChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedDepto(e.target.value); setSelectedMpio(''); setPuestos([]); setMesas([]);
    fetch(`${API_URL}/api/catalogo/departamentos/${e.target.value}/municipios`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setMunicipios(d.data); });
  };

  const handleMpioChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedMpio(e.target.value); setSelectedPuesto(''); setMesas([]);
    fetch(`${API_URL}/api/catalogo/municipios/${e.target.value}/puestos`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setPuestos(d.data); });
  };

  const handlePuestoChange = (e: any) => {
    const token = localStorage.getItem('token');
    setSelectedPuesto(e.target.value); setSelectedMesa('');
    fetch(`${API_URL}/api/catalogo/puestos/${e.target.value}/mesas`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setMesas(d.data); });
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res  = await fetch(`${API_URL}/api/testigos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, mesaId: selectedMesa }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Testigo registrado correctamente');
        toast.success('¡Testigo registrado correctamente!');
        setFormData({ documento:'', nombre:'', segundoNombre:'', primerApellido:'', segundoApellido:'', celular:'', correo:'', tipoTestigo:'PRINCIPAL' });
        setSelectedMesa('');
        if (selectedPuesto) {
          const token2 = localStorage.getItem('token');
          fetch(`${API_URL}/api/catalogo/puestos/${selectedPuesto}/mesas`, { headers: { 'Authorization': `Bearer ${token2}` } })
            .then(r => r.json()).then(d => { if (d.success) setMesas(d.data); });
        }
      } else { setError(data.message || 'Error al guardar'); toast.error(data.message || 'Error al guardar el testigo.'); }
    } catch { setError('Error de conexión con el servidor'); toast.error('Error de conexión con el servidor.'); }
  };

  /* ── Render ───────────────────────────────────── */
  return (
    <Box>
      {/* Page heading */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, mb: 0.5 }}>
          Registro Institucional
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '32px', color: J.ink }}>
          Registro de Testigos
        </Typography>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2.5, borderRadius: 0 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 0 }}>{success}</Alert>}

      <Card sx={{ bgcolor: '#fff', border: `1px solid ${J.border}`, borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>

              {/* ── 1 · Buscar cédula ─────────────── */}
              <Grid size={{ xs: 12 }}>
                <SectionLabel num="01" text="Buscar / Verificar Cédula" />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth required
                    label="Cédula / Documento"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    onClick={handleVerificarDocumento}
                    disabled={!formData.documento || isVerifying}
                    startIcon={<SearchIcon sx={{ fontSize: '16px !important' }} />}
                    sx={{
                      flexShrink: 0,
                      borderColor: J.border,
                      color: J.ink,
                      borderRadius: 0,
                      fontSize: '13px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: J.muted, borderColor: J.border },
                    }}
                  >
                    Verificar
                  </Button>
                </Box>
              </Grid>

              {/* thin rule */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ height: 1, bgcolor: J.border, mt: 1 }} />
              </Grid>

              {/* ── 2 · Datos personales ──────────── */}
              <Grid size={{ xs: 12 }}>
                <SectionLabel num="02" text="Datos Personales" />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required size="small" label="Primer Nombre"     name="nombre"          value={formData.nombre}          onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth          size="small" label="Segundo Nombre"    name="segundoNombre"   value={formData.segundoNombre}   onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required size="small" label="Primer Apellido"   name="primerApellido"  value={formData.primerApellido}  onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth          size="small" label="Segundo Apellido"  name="segundoApellido" value={formData.segundoApellido} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth required size="small" label="Celular"           name="celular"         value={formData.celular}         onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth          size="small" label="Correo Electrónico" name="correo"         value={formData.correo}          onChange={handleChange} type="email" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo Testigo</InputLabel>
                  <Select native name="tipoTestigo" value={formData.tipoTestigo} label="Tipo Testigo" onChange={handleChange}>
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="SUPLENTE">SUPLENTE</option>
                  </Select>
                </FormControl>
              </Grid>

              {/* thin rule */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ height: 1, bgcolor: J.border, mt: 1 }} />
              </Grid>

              {/* ── 3 · Asignación electoral ──────── */}
              <Grid size={{ xs: 12 }}>
                <SectionLabel num="03" text="Asignación Electoral" />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select native value={selectedDepto} label="Departamento" onChange={handleDeptoChange} required>
                    <option value="">Seleccione...</option>
                    {[...departamentos].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedDepto}>
                  <InputLabel>Municipio</InputLabel>
                  <Select native value={selectedMpio} label="Municipio" onChange={handleMpioChange} required>
                    <option value="">Seleccione...</option>
                    {[...municipios].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es')).map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedMpio}>
                  <InputLabel>Puesto</InputLabel>
                  <Select native value={selectedPuesto} label="Puesto" onChange={handlePuestoChange} required>
                    <option value="">Seleccione...</option>
                    {[...puestos].sort((a: any, b: any) => a.nombrePuesto.localeCompare(b.nombrePuesto, 'es')).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombrePuesto}</option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small" disabled={!selectedPuesto}>
                  <InputLabel>Mesa</InputLabel>
                  <Select native value={selectedMesa} label="Mesa" onChange={(e) => setSelectedMesa(e.target.value as string)} required>
                    <option value="">Seleccione...</option>
                    {[...mesas].filter((m: any) => m.ocupados < m.capacidad).sort((a: any, b: any) => a.numeroMesa - b.numeroMesa).map((m: any) => {
                      const isPartial = m.ocupados > 0 && m.ocupados < m.capacidad;
                      return (
                        <option key={m.id} value={m.id}>
                          Mesa {m.numeroMesa} ({isPartial ? 'Parcial' : 'Vacía'})
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {/* Submit */}
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon sx={{ fontSize: '18px !important' }} />}
                  sx={{
                    bgcolor: J.ink,
                    color: '#fff',
                    borderRadius: 0,
                    px: 4,
                    py: 1.4,
                    fontSize: '13px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: J.blue, boxShadow: 'none' },
                  }}
                >
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