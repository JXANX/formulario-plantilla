import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  FormControl, InputLabel, MenuItem, CircularProgress,
  Chip, Paper
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
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
  const [puestosNecesitados, setPuestosNecesitados] = useState<any[]>([]);

  // Para evitar bugs visuales con React StrictMode y dnd
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
          setPuestosNecesitados(data.data.puestosNecesitados);
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
    setPuestosNecesitados([]);
    loadMunicipios(Number(val));
  };

  const handleMpioChange = (e: any) => {
    const val = e.target.value;
    setSelectedMpio(val);
    loadDistribucion(val);
  };

  // Agrupar testigos por Puesto Origen para priorizar cercanía
  const testigosAgrupados = useMemo(() => {
    const map = new Map<string, any[]>();
    testigosMovibles.forEach(t => {
      if (!map.has(t.nombrePuestoOrigen)) map.set(t.nombrePuestoOrigen, []);
      map.get(t.nombrePuestoOrigen)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [testigosMovibles]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return; // No mover en el mismo contenedor origen

    // droppableId de destino es "mesa-{mesaId}"
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
            loadDistribucion(selectedMpio); // Recargar
          } else {
            toast.error(data.message || 'Error al reubicar el testigo');
          }
        })
        .catch(() => {
          toast.error('Error de red al reubicar el testigo');
        });
    }
  };

  if (!enabled) return null;

  return (
    <Box sx={{ minHeight: '80vh' }}>
      {/* HEADER */}
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
              <Typography sx={{ fontSize: '13px', color: J.textMuted, mt: 1 }}>
                Arrastra testigos desde puestos con sobrecupo hacia mesas vacías. Prioriza ubicarlos en el mismo puesto o zona.
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
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={3}>
            {/* LEFT COLUMN: Testigos Movibles */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: J.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonPinCircleIcon sx={{ color: J.warning }} /> 
                Testigos Excedentes ({testigosMovibles.length})
              </Typography>
              
              <Droppable droppableId="source-testigos" isDropDisabled={true}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                      minHeight: '400px',
                      borderRadius: 1,
                      transition: 'background-color 0.2s ease',
                      pb: 10
                    }}
                  >
                    {testigosMovibles.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: J.surface, border: `1px dashed ${J.border}`, boxShadow: 'none' }}>
                        <Typography sx={{ color: J.textMuted, fontSize: '13px' }}>
                          No hay testigos excedentes en este municipio. Todas las mesas tienen 0 o 1 testigo.
                        </Typography>
                      </Paper>
                    ) : (
                      testigosAgrupados.map(([puestoNombre, testigos]) => (
                        <Box key={puestoNombre} sx={{ mb: 3 }}>
                          <Typography sx={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700, color: J.ink, mb: 1, textTransform: 'uppercase', bgcolor: J.muted, px: 1.5, py: 0.5, display: 'inline-block' }}>
                            {puestoNombre}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {testigos.map((t) => (
                              <Draggable key={t.id} draggableId={`testigo-${t.id}`} index={testigosMovibles.indexOf(t)}>
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
                                      </Box>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                          </Box>
                        </Box>
                      ))
                    )}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Grid>

            {/* RIGHT COLUMN: Mesas Destino */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: J.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentTurnedInIcon sx={{ color: J.blue }} /> 
                Puestos con Mesas Incompletas
              </Typography>

              {puestosNecesitados.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: J.surface, border: `1px dashed ${J.border}`, boxShadow: 'none' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: J.success, mb: 2 }} />
                  <Typography sx={{ color: J.ink, fontWeight: 600 }}>¡Cobertura Completa!</Typography>
                  <Typography sx={{ color: J.textMuted, fontSize: '13px', mt: 1 }}>
                    Todas las mesas de este municipio tienen al menos 2 testigos.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {puestosNecesitados.map((puesto) => (
                    <Card key={puesto.puestoId} sx={{ borderRadius: 0, border: `1px solid ${J.border}`, boxShadow: 'none' }}>
                      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${J.border}`, bgcolor: J.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '14px', color: J.ink }}>
                            {puesto.nombrePuesto}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: J.textMuted }}>
                            Zona {puesto.zona}
                          </Typography>
                        </Box>
                        <Chip label={`${puesto.mesas.length} mesas por cubrir`} size="small" sx={{ borderRadius: 0, bgcolor: J.ink, color: '#fff', fontSize: '11px', fontWeight: 600, height: '24px' }} />
                      </Box>
                      
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          {puesto.mesas.map((mesa: any) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mesa.mesaId}>
                              <Droppable droppableId={`mesa-${mesa.mesaId}`}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                      border: `2px dashed ${snapshot.isDraggingOver ? J.success : J.border}`,
                                      bgcolor: snapshot.isDraggingOver ? 'rgba(45, 125, 78, 0.05)' : '#fff',
                                      minHeight: '80px',
                                      p: 1.5,
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
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
                                    
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {snapshot.isDraggingOver ? (
                                        <Typography sx={{ fontSize: '11px', color: J.success, fontWeight: 700 }}>
                                          Soltar testigo aquí
                                        </Typography>
                                      ) : (
                                        <Typography sx={{ fontSize: '11px', color: J.textMuted, fontStyle: 'italic', opacity: 0.7 }}>
                                          Faltan {mesa.faltantes} testigo(s)
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
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DragDropContext>
      )}
    </Box>
  );
}
