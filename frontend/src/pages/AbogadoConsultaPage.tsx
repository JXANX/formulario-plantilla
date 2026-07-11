import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

import RefreshIcon from '@mui/icons-material/Refresh';
import GavelIcon from '@mui/icons-material/Gavel';

import { useToast } from '../context/ToastContext';
import { J } from '../theme/theme';
import { votosService } from '../services/votos.service';
import type { VotosResumen, VotosDetalleMesa } from '../services/votos.service';

export default function AbogadoConsultaPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<VotosResumen | null>(null);
  const [discrepancias, setDiscrepancias] = useState<any[]>([]);

  // Comparison Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [detalleMesa, setDetalleMesa] = useState<VotosDetalleMesa | null>(null);
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    // Fetch stats
    votosService.obtenerResumen()
      .then(res => {
        if (res.success) setResumen(res.data);
      })
      .catch(() => toast.error('Error al cargar métricas'));

    // Fetch discrepancies
    votosService.obtenerDiscrepancias()
      .then(res => {
        if (res.success) setDiscrepancias(res.data);
      })
      .catch(() => toast.error('Error al cargar discrepancias'))
      .finally(() => setLoading(false));
  };

  const handleOpenDetail = (mesaId: number) => {
    setDetalleMesa(null);
    setOpenDialog(true);
    votosService.obtenerDetalleMesa(mesaId)
      .then(res => {
        if (res.success) {
          setDetalleMesa(res.data);
        } else {
          toast.error('Error al cargar detalles de la mesa');
          setOpenDialog(false);
        }
      })
      .catch(() => {
        toast.error('Error al cargar detalles');
        setOpenDialog(false);
      });
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const handleViewImage = (fotoId: number) => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/votos/fotos/ver/${fotoId}/archivo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      setZoomImgUrl(url);
    })
    .catch(() => toast.error('Error al cargar foto'));
  };

  const handleDownloadImage = (fotoId: number, originName: string, mesaNum: number) => {
    const token = localStorage.getItem('token');
    const filename = `E14_Mesa_${mesaNum}_${originName}.jpg`;
    
    fetch(`${API_URL}/api/votos/fotos/ver/${fotoId}/archivo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Descarga iniciada');
    })
    .catch(() => toast.error('Error al descargar archivo'));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '28px', mb: 1 }}>Consulta Jurídica — Control de Votos</Typography>
          <Typography variant="body2" sx={{ color: J.textMuted }}>
            Visualización de discrepancias y descarga de actas E14 de la Registraduría vs. Testigos
          </Typography>
        </Box>
        <IconButton onClick={loadData} sx={{ color: J.blue }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* General Stats summary */}
          {resumen && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1.2fr 1fr 1fr 1.2fr 1.2fr' }, gap: 3 }}>
              <Box>
                <Card sx={{ borderLeft: `6px solid ${J.blue}` }}>
                  <CardContent>
                    <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Mesas Reportadas
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700 }}>
                      {resumen.mesasReportadasRegistraduria} / {resumen.totalMesas}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ borderLeft: `6px solid ${J.gold}` }}>
                  <CardContent>
                    <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Informes de Testigos
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.gold }}>
                      {resumen.mesasReportadasTestigo}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ borderLeft: `6px solid ${J.danger}` }}>
                  <CardContent>
                    <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Conflictos Activos
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.danger }}>
                      {resumen.mesasConDiscrepancias}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ borderLeft: `6px solid ${J.blue}` }}>
                  <CardContent>
                    <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Votos Registraduría
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.blue }}>
                      {resumen.totalVotosRegistraduria?.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ borderLeft: `6px solid ${J.gold}` }}>
                  <CardContent>
                    <Typography sx={{ color: J.textMuted, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      Votos Testigo
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: '32px', mt: 1, fontWeight: 700, color: J.gold }}>
                      {resumen.totalVotosTestigo?.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {/* Active conflicts list */}
          <Card>
            <CardContent sx={{ px: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', px: 3, mb: 2 }}>
                Listado de Discrepancias Activas
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Municipio</TableCell>
                      <TableCell>Puesto</TableCell>
                      <TableCell align="center">Mesa</TableCell>
                      <TableCell>Candidato / Tipo Voto</TableCell>
                      <TableCell align="center">Registraduría</TableCell>
                      <TableCell align="center">Testigo</TableCell>
                      <TableCell align="center">Diferencia</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {discrepancias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: J.textMuted }}>
                          No hay discrepancias registradas por el momento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      discrepancias.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{d.mesa?.puesto?.municipio?.nombre}</TableCell>
                          <TableCell>{d.mesa?.puesto?.nombrePuesto}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Mesa #{d.mesa?.numeroMesa}</TableCell>
                          <TableCell>
                            {d.candidato ? (
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.candidato.nombre}</Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: J.textMuted }}>#{d.candidato.numeroTarjeton}</Typography>
                              </Box>
                            ) : (
                              <Typography sx={{ fontWeight: 600 }}>{d.tipoVoto?.nombre}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: J.blue }}>{d.votosRegistraduria}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: J.gold }}>{d.votosTestigo}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ color: J.danger, fontWeight: 700 }}>
                              {d.diferencia > 0 ? `+${d.diferencia}` : d.diferencia}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<GavelIcon />}
                              onClick={() => handleOpenDetail(d.mesa.id)}
                            >
                              Comparar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Comparison Dialog (Read-Only) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Detalle de Discrepancias E14</span>
          <IconButton onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {detalleMesa ? (
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
                Mesa #{detalleMesa.numeroMesa} — {detalleMesa.puestoNombre}
              </Typography>
              <Typography variant="body2" sx={{ color: J.textMuted }}>
                Consulte las actas E14 y los conteos registrados para el análisis jurídico.
              </Typography>
            </Box>

            {/* E14 Side-By-Side Documents */}
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Actas Digitales (E14)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
              <Box>
                <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: J.surface }}>
                  <Typography sx={{ fontWeight: 600, mb: 1.5 }}>E14 Registraduría</Typography>
                  {detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA') ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewImage(detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA')!.id)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadImage(
                          detalleMesa.fotos.find(f => f.origen === 'REGISTRADURIA')!.id, 
                          'REGISTRADURIA', 
                          detalleMesa.numeroMesa
                        )}
                      >
                        Descargar
                      </Button>
                    </Box>
                  ) : (
                    <Typography sx={{ color: J.danger, fontSize: '0.9rem', fontWeight: 600 }}>No disponible</Typography>
                  )}
                </Paper>
              </Box>
              <Box>
                <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: J.surface }}>
                  <Typography sx={{ fontWeight: 600, mb: 1.5 }}>E14 Testigo</Typography>
                  {detalleMesa.fotos.find(f => f.origen === 'TESTIGO') ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewImage(detalleMesa.fotos.find(f => f.origen === 'TESTIGO')!.id)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadImage(
                          detalleMesa.fotos.find(f => f.origen === 'TESTIGO')!.id, 
                          'TESTIGO', 
                          detalleMesa.numeroMesa
                        )}
                      >
                        Descargar
                      </Button>
                    </Box>
                  ) : (
                    <Typography sx={{ color: J.danger, fontSize: '0.9rem', fontWeight: 600 }}>No disponible</Typography>
                  )}
                </Paper>
              </Box>
            </Box>

            {/* Read-Only Counts Table */}
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Conteos Registrados</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidato / Tipo Voto</TableCell>
                    <TableCell align="center">Registraduría</TableCell>
                    <TableCell align="center">Testigo</TableCell>
                    <TableCell align="center">Diferencia</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalleMesa.renglones.map((r, idx) => {
                    const diff = r.votosRegistraduria - r.votosTestigo;
                    return (
                      <TableRow key={idx} sx={{ bgcolor: diff !== 0 ? J.dangerBg : 'inherit' }}>
                        <TableCell>
                          {r.candidatoNombre ? (
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.candidatoNombre}</Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: J.textMuted }}>{r.candidatoPartido} • #{r.candidatoNumeroTarjeton}</Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontWeight: 600 }}>{r.tipoVotoNombre}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{r.votosRegistraduria}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{r.votosTestigo}</TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: diff !== 0 ? J.danger : J.success }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {diff === 0 ? (
                            <Typography sx={{ color: J.success, fontWeight: 700, fontSize: '0.85rem' }}>COINCIDE</Typography>
                          ) : (
                            <Typography sx={{ color: J.danger, fontWeight: 700, fontSize: '0.85rem' }}>DIFERENCIA</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Zoom Image Dialog */}
      <Dialog open={zoomImgUrl !== null} onClose={() => setZoomImgUrl(null)} maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Visualizador Acta E14</span>
          <IconButton onClick={() => setZoomImgUrl(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
          {zoomImgUrl && (
            <img 
              src={zoomImgUrl} 
              alt="Zoom E14" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
