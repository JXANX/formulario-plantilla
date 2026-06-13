import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  FormControl, InputLabel, MenuItem, CircularProgress,
  Chip, Paper, Switch, FormControlLabel, Select, OutlinedInput, Divider
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import GuardedSelect from '../components/GuardedSelect';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const J = {
  ink: '#1A1F2E',
  blue: '#2952CC',
  gold: '#C9973A',
  border: '#E2DDD6',
  muted: '#F0EEE9',
  surface: '#F8F7F4',
  textMuted: '#7A7A7A',
  success: '#2D7D4E',
  warning: '#B97D1A',
  canvas: '#FFFFFF',
};

const sxSelect = {
  '& .MuiOutlinedInput-notchedOutline': { borderColor: J.border },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: J.blue },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: J.blue, borderWidth: '1.5px' },
};

const sxLabel = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontWeight: 600,
  color: J.textMuted,
  '&.Mui-focused': { color: J.blue },
};

export default function DistribucionPage() {
  const toast = useToast();
  const token = localStorage.getItem('token');

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [selectedDepto, setSelectedDepto] = useState<string>('');
  const [selectedMpio, setSelectedMpio] = useState<string>('');

  const [loadingData, setLoadingData] = useState(false);
  const [testigosMovibles, setTestigosMovibles] = useState<any[]>([]);
  const [puestosNecesitadosOriginal, setPuestosNecesitadosOriginal] = useState<any[]>([]);

  // Nuevos estados para filtros
  const [soloVacias, setSoloVacias] = useState<boolean>(true);
  const [selectedPuestoId, setSelectedPuestoId] = useState<string>('');

  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => { cancelAnimationFrame(animation); setEnabled(false); };
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/catalogo/departamentos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartamentos(data.data);
          const quindio = data.data.find((d: any) => d.nombre.toLowerCase().includes("quindio"));
          if (quindio) {
            setSelectedDepto(String(quindio.id));
            loadMunicipios(quindio.id);
          }
        }
      });
  }, []);

  const loadMunicipios = (deptoId: number) => {
    fetch(`${API_URL}/api/catalogo/departamentos/${deptoId}/municipios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMunicipios(data.data);
      });
  };

  const loadDistribucion = (mpioId: string) => {
    if (!mpioId) return;
    setLoadingData(true);
    fetch(`${API_URL}/api/distribucion/municipio/${mpioId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestigosMovibles(data.data.testigosMovibles);
          setPuestosNecesitadosOriginal(data.data.puestosNecesitados);
        }
        setLoadingData(false);
      })
      .catch(() => {
        toast.error('Error cargando distribución');
        setLoadingData(false);
      });
  };

  const handleDeptoChange = (e: any) => {
    const val = e.target.value;
    setSelectedDepto(val);
    setSelectedMpio('');
    setTestigosMovibles([]);
    setPuestosNecesitadosOriginal([]);
    setSelectedPuestoId('');
    loadMunicipios(Number(val));
  };

  const handleMpioChange = (e: any) => {
    const val = e.target.value;
    setSelectedMpio(val);
    setSelectedPuestoId('');
    loadDistribucion(val);
  };

  // 1. Filtrar las mesas necesitadas según el toggle `soloVacias`
  const puestosNecesitados = useMemo(() => {
    return puestosNecesitadosOriginal
      .map(p => ({
        ...p,
        mesas: soloVacias ? p.mesas.filter((m: any) => m.ocupados === 0) : p.mesas
      }))
      .filter(p => p.mesas.length > 0);
  }, [puestosNecesitadosOriginal, soloVacias]);

  // 2. Extraer todos los puestos que tienen testigos movibles o mesas necesitadas
  const allPuestos = useMemo(() => {
    const map = new Map<string, { id: string, nombre: string }>();
    testigosMovibles.forEach(t => map.set(String(t.puestoOrigenId), { id: String(t.puestoOrigenId), nombre: t.nombrePuestoOrigen }));
    puestosNecesitados.forEach(p => map.set(String(p.puestoId), { id: String(p.puestoId), nombre: p.nombrePuesto }));
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [testigosMovibles, puestosNecesitados]);

  // 3. Calcular totales para el Balance
  const totales = useMemo(() => {
    let mesasIncompletas = 0;
    let testigosFaltantes = 0;
    puestosNecesitados.forEach(p => {
      mesasIncompletas += p.mesas.length;
      p.mesas.forEach((m: any) => { testigosFaltantes += m.faltantes; });
    });
    const excedentes = testigosMovibles.length;
    const balance = excedentes - testigosFaltantes;
    return { mesasIncompletas, testigosFaltantes, excedentes, balance };
  }, [puestosNecesitados, testigosMovibles]);

  // Auto-seleccionar el primer puesto si no hay ninguno
  useEffect(() => {
    if (allPuestos.length > 0 && (!selectedPuestoId || !allPuestos.find(p => p.id === selectedPuestoId))) {
      setSelectedPuestoId(allPuestos[0].id);
    }
  }, [allPuestos, selectedPuestoId]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return; 

    if (destination.droppableId.startsWith('mesa-')) {
      const nuevaMesaId = destination.droppableId.replace('mesa-', '');
      const testigoId = draggableId.replace('testigo-', '');

      fetch(`${API_URL}/api/testigos/${testigoId}/mover?nuevaMesaId=${nuevaMesaId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success('Testigo reubicado exitosamente');
            loadDistribucion(selectedMpio);
          } else {
            toast.error(data.message || 'Error al reubicar el testigo');
          }
        })
        .catch(() => {
          toast.error('Error de red al reubicar el testigo');
        });
    }
  };

  // Separar listas para el puesto actual y los "otros" puestos
  const testigosPuestoActual = testigosMovibles.filter(t => String(t.puestoOrigenId) === selectedPuestoId);
  const testigosOtrosPuestos = testigosMovibles.filter(t => String(t.puestoOrigenId) !== selectedPuestoId);
  
  const puestoDestinoActual = puestosNecesitados.find(p => String(p.puestoId) === selectedPuestoId);
  const puestosDestinoOtros = puestosNecesitados.filter(p => String(p.puestoId) !== selectedPuestoId);

  // Helper para renderizar los Draggables
  const renderDraggableTestigo = (t: any, index: number) => (
    <Draggable key={t.id} draggableId={`testigo-${t.id}`} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            border: `1px solid ${snapshot.isDragging ? J.blue : J.border}`,
            borderRadius: 0,
            boxShadow: snapshot.isDragging ? '0 8px 16px rgba(41,82,204,0.15)' : 'none',
            bgcolor: '#fff',
            transform: snapshot.isDragging ? 'scale(1.02)' : 'none',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            mb: 1.5,
          }}
        >
          <CardContent sx={{ p: '12px !important' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '13px', color: J.ink }}>
              {t.nombreCompleto}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
              CC: {t.documento}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Chip size="small" label={`Mesa Origen: ${t.numeroMesaOrigen}`} sx={{ fontSize: '10px', height: '20px', bgcolor: 'rgba(201,151,58,0.1)', color: J.warning, fontWeight: 700, borderRadius: 0 }} />
              {String(t.puestoOrigenId) !== selectedPuestoId && (
                <Chip size="small" label={t.nombrePuestoOrigen} sx={{ fontSize: '9px', height: '20px', bgcolor: J.muted, color: J.ink, borderRadius: 0, maxWidth: '120px' }} />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  if (!enabled) return null;

  return (
    <Box sx={{ minHeight: '80vh' }}>
      {/* HEADER COBERTURA */}
      <Card sx={{ mb: 3, borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: J.gold, mb: 0.5 }}>
                Inteligencia Electoral
              </Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 800, color: J.ink }}>
                Optimización de Cobertura
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="depto-label" sx={sxLabel}>Departamento</InputLabel>
                <GuardedSelect
                  labelId="depto-label"
                  value={selectedDepto}
                  label="Departamento"
                  onChange={handleDeptoChange}
                  sx={sxSelect}
                >
                  {departamentos.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>
                  ))}
                </GuardedSelect>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!selectedDepto}>
                <InputLabel id="mpio-label" sx={sxLabel}>Municipio</InputLabel>
                <GuardedSelect
                  labelId="mpio-label"
                  value={selectedMpio}
                  label="Municipio"
                  onChange={handleMpioChange}
                  sx={sxSelect}
                >
                  {municipios.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                  ))}
                </GuardedSelect>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!selectedMpio ? (
        <Box sx={{ textAlign: 'center', py: 8, color: J.textMuted }}>
          <LocationCityIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography>Selecciona un municipio para comenzar la distribución</Typography>
        </Box>
      ) : loadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: J.blue }} />
        </Box>
      ) : allPuestos.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: J.surface, border: `1px dashed ${J.border}`, boxShadow: 'none' }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: J.success, mb: 2 }} />
          <Typography sx={{ color: J.ink, fontWeight: 600 }}>¡Cobertura Perfecta!</Typography>
          <Typography sx={{ color: J.textMuted, fontSize: '13px', mt: 1 }}>
            No hay mesas vacías, o no hay testigos excedentes disponibles para mover.
          </Typography>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          
          {/* REPORTE Y BALANCE */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none', bgcolor: '#fff', borderTop: `4px solid ${J.gold}` }}>
                <CardContent sx={{ p: 2, pb: '16px !important' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: J.textMuted, textTransform: 'uppercase', mb: 1 }}>
                    Testigos Excedentes
                  </Typography>
                  <Typography sx={{ fontSize: '28px', fontWeight: 800, color: J.ink, lineHeight: 1 }}>
                    {totales.excedentes}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: J.textMuted, mt: 1 }}>
                    Testigos disponibles para reubicar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none', bgcolor: '#fff', borderTop: `4px solid ${J.blue}` }}>
                <CardContent sx={{ p: 2, pb: '16px !important' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: J.textMuted, textTransform: 'uppercase', mb: 1 }}>
                    Brecha de Cobertura
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography sx={{ fontSize: '28px', fontWeight: 800, color: J.ink, lineHeight: 1 }}>
                      {totales.testigosFaltantes}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.warning }}>
                      en {totales.mesasIncompletas} mesas
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: J.textMuted, mt: 1 }}>
                    Espacios requeridos según filtro actual
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none', bgcolor: totales.balance >= 0 ? 'rgba(45,125,78,0.05)' : 'rgba(185,125,26,0.05)', borderTop: `4px solid ${totales.balance >= 0 ? J.success : J.warning}` }}>
                <CardContent sx={{ p: 2, pb: '16px !important' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: totales.balance >= 0 ? J.success : J.warning, textTransform: 'uppercase', mb: 1 }}>
                    Balance del Municipio
                  </Typography>
                  <Typography sx={{ fontSize: '28px', fontWeight: 800, color: totales.balance >= 0 ? J.success : J.warning, lineHeight: 1 }}>
                    {totales.balance > 0 ? '+' : ''}{totales.balance}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: J.ink, fontWeight: 500, mt: 1 }}>
                    {totales.balance >= 0 
                      ? 'Hay suficientes excedentes para cubrir la brecha.'
                      : 'Faltan testigos para cubrir la brecha mostrada.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* BARRA DE FILTROS DEL TABLERO */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: J.canvas, p: 2, border: `1px solid ${J.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: J.textMuted, textTransform: 'uppercase' }}>
                Puesto de Trabajo Actual:
              </Typography>
              <Select
                value={selectedPuestoId}
                onChange={(e) => setSelectedPuestoId(e.target.value)}
                input={<OutlinedInput size="small" />}
                sx={{ minWidth: 250, bgcolor: J.surface, borderRadius: 0, '& fieldset': { border: 'none' } }}
              >
                {allPuestos.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                ))}
              </Select>
            </Box>

            <FormControlLabel
              control={
                <Switch 
                  checked={soloVacias} 
                  onChange={(e) => setSoloVacias(e.target.checked)} 
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.ink }}>
                  Mostrar solo mesas sin ningún testigo (0)
                </Typography>
              }
            />
          </Box>

          {/* TABLERO PRINCIPAL (PUESTO ACTUAL) */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 0, border: `2px solid ${J.ink}`, boxShadow: 'none' }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 800, color: J.ink, mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enfrentamiento Cara a Cara: {allPuestos.find(p => p.id === selectedPuestoId)?.nombre}
            </Typography>

            <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
              {/* IZQUIERDA: Testigos */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonPinCircleIcon sx={{ color: J.warning }} /> 
                  Excedentes en este puesto ({testigosPuestoActual.length})
                </Typography>
                <Droppable droppableId="source-testigos-actual" isDropDisabled={true}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ bgcolor: J.surface, minHeight: '150px', border: `1px solid ${J.border}`, p: 2 }}
                    >
                      {testigosPuestoActual.length === 0 ? (
                        <Typography sx={{ fontSize: '12px', color: J.textMuted, fontStyle: 'italic', textAlign: 'center', mt: 4 }}>
                          Este puesto no tiene testigos excedentes para aportar.
                        </Typography>
                      ) : (
                        testigosPuestoActual.map((t, index) => renderDraggableTestigo(t, index))
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Grid>

              {/* CENTRO: Flechas visuales */}
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: { xs: 0, md: '200px' } }}>
                <CompareArrowsIcon sx={{ fontSize: 48, color: J.border, transform: { xs: 'rotate(90deg)', md: 'none' } }} />
              </Grid>

              {/* DERECHA: Mesas Vacías */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedInIcon sx={{ color: J.blue }} /> 
                  Mesas Necesitadas en este puesto
                </Typography>
                
                {puestoDestinoActual ? (
                  <Grid container spacing={2}>
                    {puestoDestinoActual.mesas.map((mesa: any) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={mesa.mesaId}>
                        <Droppable droppableId={`mesa-${mesa.mesaId}`}>
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{
                                border: `2px dashed ${snapshot.isDraggingOver ? J.success : mesa.ocupados === 0 ? J.warning : J.border}`,
                                bgcolor: snapshot.isDraggingOver ? 'rgba(45, 125, 78, 0.05)' : '#fff',
                                minHeight: '80px',
                                p: 1.5,
                                transition: 'all 0.2s',
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: J.ink }}>
                                  Mesa {mesa.numeroMesa}
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: mesa.ocupados === 0 ? J.warning : J.textMuted, fontWeight: 600 }}>
                                  {mesa.ocupados} / {mesa.capacidad} testigos
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px' }}>
                                {snapshot.isDraggingOver ? (
                                  <Typography sx={{ fontSize: '11px', color: J.success, fontWeight: 700 }}>
                                    Soltar aquí
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                                    Arrastra un testigo
                                  </Typography>
                                )}
                              </Box>
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ bgcolor: J.surface, minHeight: '150px', border: `1px dashed ${J.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '12px', color: J.success, fontWeight: 600 }}>
                      Este puesto no tiene mesas vacías.
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* BANCO DE OTROS PUESTOS */}
          <Divider sx={{ my: 4 }} />
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: J.textMuted, mb: 3, textTransform: 'uppercase' }}>
            Banco General (Otros Puestos)
          </Typography>

          <Grid container spacing={4}>
            {/* IZQ: Testigos de otros puestos */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.textMuted, mb: 2 }}>
                Testigos sobrantes en otros puestos ({testigosOtrosPuestos.length})
              </Typography>
              <Droppable droppableId="source-testigos-otros" isDropDisabled={true}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: '100px' }}>
                    {testigosOtrosPuestos.map((t, index) => renderDraggableTestigo(t, index))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Grid>
            
            {/* DER: Mesas de otros puestos */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: J.textMuted, mb: 2 }}>
                Mesas vacías en otros puestos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {puestosDestinoOtros.map((puesto) => (
                  <Card key={puesto.puestoId} sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none' }}>
                    <Box sx={{ px: 2, py: 1, bgcolor: J.surface, borderBottom: `1px solid ${J.border}` }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '12px', color: J.ink }}>{puesto.nombrePuesto}</Typography>
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        {puesto.mesas.map((mesa: any) => (
                          <Grid size={{ xs: 12, sm: 4 }} key={mesa.mesaId}>
                            <Droppable droppableId={`mesa-${mesa.mesaId}`}>
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{
                                    border: `1px dashed ${snapshot.isDraggingOver ? J.success : mesa.ocupados === 0 ? J.warning : J.border}`,
                                    bgcolor: snapshot.isDraggingOver ? 'rgba(45, 125, 78, 0.05)' : '#fff',
                                    p: 1,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>Mesa {mesa.numeroMesa}</Typography>
                                  {provided.placeholder}
                                </Box>
                              )}
                            </Droppable>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DragDropContext>
      )}
    </Box>
  );
}
