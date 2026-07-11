import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useToast } from '../context/ToastContext';
import { J } from '../theme/theme';
import { api } from '../services/api';

interface Candidato {
  id: number;
  nombre: string;
  partido: string;
  numeroTarjeton: number;
  activo: boolean;
}

export default function CandidatosPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', partido: '', numeroTarjeton: 1 });

  useEffect(() => { loadCandidatos(); }, []);

  const loadCandidatos = () => {
    setLoading(true);
    api.get('/api/candidatos')
      .then((res: any) => {
        if (res.success) setCandidatos(res.data);
        else toast.error('Error al cargar candidatos');
      })
      .catch(() => toast.error('Error al cargar candidatos'))
      .finally(() => setLoading(false));
  };

  const handleOpenDialog = (candidato?: Candidato) => {
    if (candidato) {
      setEditingId(candidato.id);
      setForm({ nombre: candidato.nombre, partido: candidato.partido, numeroTarjeton: candidato.numeroTarjeton });
    } else {
      setEditingId(null);
      const nextNum = candidatos.length > 0 ? Math.max(...candidatos.map(c => c.numeroTarjeton)) + 1 : 1;
      setForm({ nombre: '', partido: '', numeroTarjeton: nextNum });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.partido.trim()) {
      toast.error('Complete todos los campos');
      return;
    }
    const body = { nombre: form.nombre, partido: form.partido, numeroTarjeton: form.numeroTarjeton, activo: true };
    const promise = editingId
      ? api.put(`/api/candidatos/${editingId}`, body)
      : api.post('/api/candidatos', body);

    promise
      .then((res: any) => {
        if (res.success) {
          toast.success(editingId ? 'Candidato actualizado' : 'Candidato creado');
          setOpenDialog(false);
          loadCandidatos();
        } else {
          toast.error(res.message || 'Error');
        }
      })
      .catch(() => toast.error('Error al guardar'));
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('¿Desactivar este candidato?')) return;
    api.delete(`/api/candidatos/${id}`)
      .then((res: any) => {
        if (res.success) {
          toast.success('Candidato desactivado');
          loadCandidatos();
        } else {
          toast.error(res.message || 'Error');
        }
      })
      .catch(() => toast.error('Error al desactivar'));
  };

  return (
    <Box>
      <Typography variant="h2" sx={{ fontSize: '28px', mb: 3 }}>
        Gestión de Candidatos
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Candidatos Registrados ({candidatos.filter(c => c.activo).length} activos)
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Agregar Candidato
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>N° Tarjetón</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Partido</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidatos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: J.textMuted }}>
                        No hay candidatos registrados. Agregue el primer candidato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidatos.map(c => (
                      <TableRow key={c.id} sx={{ opacity: c.activo ? 1 : 0.5 }}>
                        <TableCell>
                          <Box sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            bgcolor: J.blue, color: '#fff', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700
                          }}>
                            {c.numeroTarjeton}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{c.nombre}</TableCell>
                        <TableCell>{c.partido}</TableCell>
                        <TableCell align="center">
                          <Box sx={{
                            display: 'inline-block', px: 1.5, py: 0.3, borderRadius: '12px',
                            fontSize: '0.78rem', fontWeight: 700,
                            bgcolor: c.activo ? '#E8F5E9' : '#FFEBEE',
                            color: c.activo ? J.success : J.danger,
                          }}>
                            {c.activo ? 'Activo' : 'Inactivo'}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpenDialog(c)} sx={{ mr: 1 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {c.activo && (
                            <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>{editingId ? 'Editar Candidato' : 'Nuevo Candidato'}</Typography>
          <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <TextField
              label="Partido Político"
              fullWidth
              value={form.partido}
              onChange={e => setForm({ ...form, partido: e.target.value })}
              required
            />
            <TextField
              label="Número de Tarjetón"
              type="number"
              fullWidth
              value={form.numeroTarjeton}
              onChange={e => setForm({ ...form, numeroTarjeton: Number(e.target.value) })}
              required
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
