import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, CircularProgress, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PhoneIcon from '@mui/icons-material/Phone';

import { useToast } from '../context/ToastContext';
import { J } from '../theme/theme';
import { authService } from '../services/auth.service';
import { votosService } from '../services/votos.service';
import type { VotosDetalleMesa, VotoRenglon } from '../services/votos.service';
import { usuariosService } from '../services/usuarios.service';

export default function OperarioConteoPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  
  // List of tables assigned to operario
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [detalleMesa, setDetalleMesa] = useState<VotosDetalleMesa | null>(null);
  
  // Admin monitoring states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [operarios, setOperarios] = useState<any[]>([]);
  const [selectedOperarioId, setSelectedOperarioId] = useState<number | ''>('');

  // Form states
  const [registraduriaInputs, setRegistraduriaInputs] = useState<Record<string, number>>({});
  const [testigoInputs, setTestigoInputs] = useState<Record<string, number>>({});

  // Image/PDF Zoom Modal
  const [zoomFile, setZoomFile] = useState<{ url: string, type: string } | null>(null);

  useEffect(() => {
    const session = authService.getCurrentUser();
    setCurrentUser(session);
    if (session) {
      if (session.rol === 'SUPER_ADMIN') {
        usuariosService.listar()
          .then(res => {
            if (res.success) {
              const ops = res.data.filter((u: any) => u.rol === 'OPERARIO' && u.activo);
              setOperarios(ops);
              if (ops.length > 0) {
                setSelectedOperarioId(ops[0].id);
                loadAsignaciones(ops[0].id);
              }
            }
          });
      } else {
        loadAsignaciones(session.id);
      }
    }
  }, []);

  const handleOperarioChange = (opId: number) => {
    setSelectedOperarioId(opId);
    setAsignaciones([]);
    setDetalleMesa(null);
    setSelectedMesaId(null);
    loadAsignaciones(opId);
  };

  const loadAsignaciones = (operarioId: number) => {
    setLoading(true);
    votosService.obtenerAsignacionesOperario(operarioId)
      .then(res => {
        if (res.success) {
          setAsignaciones(res.data);
          if (res.data.length > 0 && res.data[0].mesa) {
            handleSelectMesa(res.data[0].mesa.id);
          }
        } else {
          toast.error(res.message || 'Error al cargar asignaciones');
        }
      })
      .catch(() => toast.error('Error al cargar asignaciones'))
      .finally(() => setLoading(false));
  };

  const handleSelectMesa = (mesaId: number) => {
    setSelectedMesaId(mesaId);
    setDetalleMesa(null);
    votosService.obtenerDetalleMesa(mesaId)
      .then(res => {
        if (res.success) {
          const detail: VotosDetalleMesa = res.data;
          setDetalleMesa(detail);
          
          // Pre-populate input states
          const regMap: Record<string, number> = {};
          const testMap: Record<string, number> = {};
          
          detail.renglones.forEach(r => {
            const key = getRenglonKey(r);
            regMap[key] = r.votosRegistraduria;
            testMap[key] = r.votosTestigo;
          });
          
          setRegistraduriaInputs(regMap);
          setTestigoInputs(testMap);
        } else {
          toast.error(res.message || 'Error al cargar detalles de la mesa');
        }
      })
      .catch(() => toast.error('Error al cargar detalles de la mesa'));
  };

  const getRenglonKey = (r: VotoRenglon) => {
    return `${r.tipoVotoId}_${r.candidatoId || 'null'}`;
  };

  const handleInputChange = (key: string, value: string, isRegistraduria: boolean) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;
    
    if (isRegistraduria) {
      setRegistraduriaInputs(prev => ({ ...prev, [key]: numValue }));
    } else {
      setTestigoInputs(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSaveVotos = async () => {
    if (!selectedMesaId || !detalleMesa) return;
    setSubmitting(true);
    try {
      // Save Registraduría votes
      for (const r of detalleMesa.renglones) {
        const key = getRenglonKey(r);
        const votosReg = registraduriaInputs[key] || 0;
        const votosTest = testigoInputs[key] || 0;

        await votosService.registrarVotosRegistraduria(selectedMesaId, r.candidatoId || null, r.tipoVotoId, votosReg);
        await votosService.registrarVotosTestigo(selectedMesaId, r.candidatoId || null, r.tipoVotoId, votosTest, detalleMesa.testigoId);
      }
      toast.success('Conteos y discrepancias guardados correctamente');
      handleSelectMesa(selectedMesaId);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los votos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, origen: string) => {
    if (!selectedMesaId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setSubmitting(true);
    votosService.subirFotoE14(selectedMesaId, origen, file)
      .then(res => {
        if (res.success) {
          toast.success(`Foto E14 (${origen}) subida con éxito`);
          handleSelectMesa(selectedMesaId);
        } else {
          toast.error(res.message || 'Error al subir foto');
        }
      })
      .catch(() => toast.error('Error de red al subir foto'))
      .finally(() => setSubmitting(false));
  };

  const handleConfirmWitnessReport = () => {
    if (!detalleMesa) return;
    // Copy Registraduría counts to Testigo or vice-versa to easily confirm
    // Commonly, if witness is correct, operator wants to match them.
    // Let's copy witness to Registraduria:
    const newReg = { ...registraduriaInputs };
    Object.keys(testigoInputs).forEach(k => {
      newReg[k] = testigoInputs[k] || 0;
    });
    setRegistraduriaInputs(newReg);
    toast.success('Conteos copiados desde el Testigo para confirmación');
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const viewImage = (fotoId: number) => {
    const token = localStorage.getItem('token');
    // Fetch the blob and create a URL for the zoom dialog
    
    // Fetch with header is safer, but standard image element can fetch with authorization or we can download it as blob.
    // Let's fetch the blob and create a URL to bypass token query param issues!
    fetch(`${API_URL}/api/votos/fotos/ver/${fotoId}/archivo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      const contentType = res.headers.get('Content-Type') || 'image/jpeg';
      return res.blob().then(blob => ({ blob, contentType }));
    })
    .then(({ blob, contentType }) => {
      const blobUrl = URL.createObjectURL(blob);
      setZoomFile({ url: blobUrl, type: contentType });
    })
    .catch(() => toast.error('Error al abrir el archivo'));
  };



  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h2" sx={{ fontSize: '28px' }}>
          Trabajo del Operario — Control de E14
        </Typography>
        
        {currentUser?.rol === 'SUPER_ADMIN' && operarios.length > 0 && (
          <TextField
            select
            label="Visualizar Operario"
            value={selectedOperarioId}
            onChange={(e) => handleOperarioChange(Number(e.target.value))}
            sx={{ minWidth: 220, bgcolor: '#fff' }}
            size="small"
          >
            {operarios.map(op => (
              <MenuItem key={op.id} value={op.id}>{op.nombre}</MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : asignaciones.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <HowToVoteIcon sx={{ fontSize: 60, color: J.textMuted, mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>Sin Mesas Asignadas</Typography>
            <Typography variant="body2" sx={{ color: J.textMuted }}>
              No tiene mesas asignadas para conteo hoy. Comuníquese con el Administrador.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table Selector Dropdown (visible only on mobile/tablet) */}
          <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 3 }}>
            <TextField
              select
              fullWidth
              label="Seleccionar Mesa Asignada"
              value={selectedMesaId || ''}
              onChange={(e) => handleSelectMesa(Number(e.target.value))}
              size="small"
              sx={{ bgcolor: '#fff' }}
            >
              {asignaciones.map((asig) => {
                if (!asig.mesa) return null;
                return (
                  <MenuItem key={asig.mesa.id} value={asig.mesa.id}>
                    Mesa #{asig.mesa.numeroMesa} — {asig.mesa.puesto?.nombrePuesto || 'Puesto'} ({asig.mesa.puesto?.municipio?.nombre || 'Municipio'})
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, width: '100%' }}>
            {/* Left Column: List of assigned tables (visible only on desktop) */}
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', width: { lg: '280px' }, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Mis Mesas Asignadas ({asignaciones.length})</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto' }}>
              {asignaciones.map((asig) => {
                if (!asig.mesa) return null;
                const active = selectedMesaId === asig.mesa.id;
                return (
                  <Card 
                    key={asig.id}
                    onClick={() => handleSelectMesa(asig.mesa.id)}
                    sx={{ 
                      cursor: 'pointer',
                      flexShrink: 0,
                      borderLeft: active ? `6px solid ${J.gold}` : '1px solid transparent',
                      borderColor: active ? J.border : J.border,
                      bgcolor: active ? 'rgba(201,151,58,0.04)' : '#fff',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    <CardContent sx={{ p: '18px !important' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                        Mesa #{asig.mesa.numeroMesa}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: J.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {asig.mesa.puesto?.nombrePuesto || 'Puesto'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: J.gold, fontWeight: 600 }}>
                        {asig.mesa.puesto?.municipio?.nombre || 'Municipio'}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Right Column: Vote entry details */}
          <Box sx={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
            {detalleMesa ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Table Header Info */}
                 <Card sx={{ bgcolor: J.ink, color: '#fff' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography sx={{ color: J.gold, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Mesa en digitación
                        </Typography>
                        <Typography variant="h3" sx={{ color: '#fff', fontSize: '24px', mt: 0.5 }}>
                          Mesa #{detalleMesa.numeroMesa} — {detalleMesa.puestoNombre}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', mt: 0.5 }}>
                          Municipio: {detalleMesa.municipioNombre}
                        </Typography>
                      </Box>
                      {detalleMesa.testigoNombre && (
                        <Box>
                          <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <VerifiedIcon sx={{ color: J.gold, fontSize: 18 }} />
                              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                                Testigo en Mesa
                              </Typography>
                            </Box>
                            <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                              {detalleMesa.testigoNombre}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#fff', mt: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 14 }} />
                              <Typography sx={{ fontSize: '0.8rem', color: '#fff' }}>{detalleMesa.testigoCelular}</Typography>
                            </Box>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* E14 Photo Uploads */}
                <Card>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>Imágenes E14 de la Mesa</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                      {/* Registraduría upload */}
                      <Box>
                        <Paper sx={{ p: 3, border: `2px dashed ${J.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>E14 Registraduría</Typography>
                          
                          {detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA') ? (
                            <Box sx={{ textAlign: 'center' }}>
                              <IconButton 
                                color="primary" 
                                onClick={() => viewImage(detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA')!.id)}
                                sx={{ mb: 1 }}
                              >
                                <VisibilityIcon sx={{ fontSize: 32 }} />
                              </IconButton>
                              <Typography sx={{ fontSize: '0.8rem', color: J.textMuted }}>Ver archivo subido</Typography>
                              <Button
                                size="small"
                                variant="text"
                                component="label"
                                sx={{ mt: 1, fontSize: '0.75rem' }}
                              >
                                Reemplazar
                                <input type="file" hidden accept=".pdf, image/png, image/jpeg, image/jpg" onChange={(e) => handleFileUpload(e, 'REGISTRADURIA')} />
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={<CloudUploadIcon />}
                            >
                              Subir Archivo
                              <input type="file" hidden accept=".pdf, image/png, image/jpeg, image/jpg" onChange={(e) => handleFileUpload(e, 'REGISTRADURIA')} />
                            </Button>
                          )}
                        </Paper>
                      </Box>

                      {/* Testigo upload */}
                      <Box>
                        <Paper sx={{ p: 3, border: `2px dashed ${J.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>E14 Testigo</Typography>
                          
                          {detalleMesa.fotos.find(f => f.origen === 'TESTIGO') ? (
                            <Box sx={{ textAlign: 'center' }}>
                              <IconButton 
                                color="primary" 
                                onClick={() => viewImage(detalleMesa.fotos.find(f => f.origen === 'TESTIGO')!.id)}
                                sx={{ mb: 1 }}
                              >
                                <VisibilityIcon sx={{ fontSize: 32 }} />
                              </IconButton>
                              <Typography sx={{ fontSize: '0.8rem', color: J.textMuted }}>Ver archivo subido</Typography>
                              <Button
                                size="small"
                                variant="text"
                                component="label"
                                sx={{ mt: 1, fontSize: '0.75rem' }}
                              >
                                Reemplazar
                                <input type="file" hidden accept=".pdf, image/png, image/jpeg, image/jpg" onChange={(e) => handleFileUpload(e, 'TESTIGO')} />
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={<CloudUploadIcon />}
                            >
                              Subir Archivo
                              <input type="file" hidden accept=".pdf, image/png, image/jpeg, image/jpg" onChange={(e) => handleFileUpload(e, 'TESTIGO')} />
                            </Button>
                          )}
                        </Paper>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Vote Counts Form Table */}
                <Card>
                  <CardContent sx={{ px: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, mb: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Conteos por Candidato / Tipo de Voto</Typography>
                      {detalleMesa.testigoNombre && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={handleConfirmWitnessReport}
                        >
                          Confirmar con Testigo
                        </Button>
                      )}
                    </Box>

                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 500 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Candidato / Tarjeta</TableCell>
                            <TableCell>Registraduría</TableCell>
                            <TableCell>Testigo</TableCell>
                            <TableCell align="center">Diferencia</TableCell>
                            <TableCell align="center">Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detalleMesa.renglones.map((r) => {
                            const key = getRenglonKey(r);
                             const valReg = registraduriaInputs[key] ?? 0;
                             const valTest = testigoInputs[key] ?? 0;
                             const diff = valReg - valTest;


                            return (
                              <TableRow key={key}>
                                <TableCell>
                                  {r.candidatoNombre ? (
                                    <Box>
                                      <Typography sx={{ fontWeight: 600 }}>{r.candidatoNombre}</Typography>
                                      <Typography sx={{ fontSize: '0.8rem', color: J.textMuted }}>
                                        {r.candidatoPartido} • #{r.candidatoNumeroTarjeton}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography sx={{ fontWeight: 600 }}>{r.tipoVotoNombre}</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={valReg}
                                    onChange={(e) => handleInputChange(key, e.target.value, true)}
                                    disabled={submitting}
                                    slotProps={{ htmlInput: { min: 0, style: { width: 60 } } }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={valTest}
                                    onChange={(e) => handleInputChange(key, e.target.value, false)}
                                    disabled={submitting}
                                    slotProps={{ htmlInput: { min: 0, style: { width: 60 } } }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography sx={{ fontWeight: 700, color: diff !== 0 ? J.danger : J.success }}>
                                    {diff > 0 ? `+${diff}` : diff}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title={diff === 0 ? "Coincide" : "Discrepancia"}>
                                    <IconButton size="small">
                                      {diff === 0 ? (
                                        <CheckCircleIcon sx={{ color: J.success }} />
                                      ) : (
                                        <ErrorIcon sx={{ color: J.danger }} />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, pt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveVotos}
                        disabled={submitting}
                        sx={{ minWidth: 200 }}
                      >
                        {submitting ? 'Guardando...' : 'Guardar Conteos'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </Box>
        </>
      )}

      {/* Zoom File Dialog */}
      <Dialog open={zoomFile !== null} onClose={() => setZoomFile(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Archivo E14</span>
          <IconButton onClick={() => setZoomFile(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: zoomFile?.type.includes('pdf') ? '#fff' : '#000', height: '80vh' }}>
          {zoomFile && zoomFile.type.includes('pdf') ? (
            <iframe src={zoomFile.url} width="100%" height="100%" style={{ border: 'none' }} title="PDF E14" />
          ) : zoomFile ? (
            <img 
              src={zoomFile.url} 
              alt="Zoom E14" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
