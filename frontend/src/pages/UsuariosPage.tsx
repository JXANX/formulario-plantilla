import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, CircularProgress, Tooltip, MenuItem, InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useToast } from '../context/ToastContext';
import { J, sxSelect } from '../theme/theme';
import { usuariosService } from '../services/usuarios.service';
import type { Usuario } from '../services/usuarios.service';

export default function UsuariosPage() {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('OPERARIO');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = () => {
    setLoading(true);
    usuariosService.listar()
      .then(res => {
        if (res.success) {
          setUsuarios(res.data);
        } else {
          toast.error(res.message || 'Error al cargar usuarios');
        }
      })
      .catch(() => toast.error('Error de conexión al cargar usuarios'))
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombre('');
    setCorreo('');
    setPassword('');
    setRol('OPERARIO');
    setActivo(true);
    setOpenDialog(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setNombre(user.nombre);
    setCorreo(user.correo);
    setPassword('');
    setRol(user.rol);
    setActivo(user.activo);
    setOpenDialog(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !rol) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!editingUser && !password.trim()) {
      toast.error('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    setSubmitting(true);
    const data: Usuario = {
      nombre,
      correo,
      rol,
      activo,
      ...(password.trim() ? { password } : {})
    };

    const promise = editingUser && editingUser.id
      ? usuariosService.actualizar(editingUser.id, data)
      : usuariosService.crear(data);

    promise
      .then(res => {
        if (res.success) {
          toast.success(editingUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
          setOpenDialog(false);
          loadUsuarios();
        } else {
          toast.error(res.message || 'Error al guardar el usuario');
        }
      })
      .catch(err => toast.error(err.message || 'Error al guardar el usuario'))
      .finally(() => setSubmitting(false));
  };

  const handleToggleActivo = (user: Usuario) => {
    if (!user.id) return;
    const confirmMessage = user.activo
      ? `¿Está seguro de que desea desactivar al usuario ${user.nombre}?`
      : `¿Está seguro de que desea activar al usuario ${user.nombre}?`;

    if (window.confirm(confirmMessage)) {
      const data: Usuario = {
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        activo: !user.activo
      };
      usuariosService.actualizar(user.id, data)
        .then(res => {
          if (res.success) {
            toast.success(user.activo ? 'Usuario desactivado' : 'Usuario activado');
            loadUsuarios();
          } else {
            toast.error(res.message || 'Error al cambiar estado de usuario');
          }
        })
        .catch(() => toast.error('Error al cambiar estado de usuario'));
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '28px', mb: 1 }}>Usuarios del Sistema</Typography>
          <Typography variant="body2" sx={{ color: J.textMuted }}>
            Gestione las credenciales de Patricia, Angela, operarios y abogados
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCreate}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ py: '16px !important' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, usuario o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: J.textMuted }} />
                  </InputAdornment>
                ),
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Usuario / Correo</TableCell>
                <TableCell>Rol asignado</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: J.textMuted }}>
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{u.nombre}</TableCell>
                    <TableCell>{u.correo}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 18, color: J.gold }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {u.rol.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {u.activo ? (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: J.success, bgcolor: J.successBg, border: `1px solid ${J.successBorder}`, px: 1.5, py: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Activo</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: J.danger, bgcolor: J.dangerBg, border: `1px solid ${J.dangerBorder}`, px: 1.5, py: 0.5 }}>
                          <CancelIcon sx={{ fontSize: 16 }} />
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Inactivo</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar Usuario">
                        <IconButton onClick={() => handleOpenEdit(u)} sx={{ color: J.blue }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={u.activo ? "Desactivar" : "Activar"}>
                        <IconButton
                          onClick={() => handleToggleActivo(u)}
                          sx={{ color: u.activo ? J.danger : J.success }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
          <IconButton onClick={() => setOpenDialog(false)} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={submitting}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Nombre de Usuario / Correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  disabled={submitting}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label={editingUser ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                  disabled={submitting}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon sx={{ color: J.textMuted }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Box>
              <Box>
                <TextField
                  select
                  fullWidth
                  label="Rol de Usuario"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  required
                  disabled={submitting}
                  sx={sxSelect}
                >
                  <MenuItem value="SUPER_ADMIN">SUPER ADMIN</MenuItem>
                  <MenuItem value="COORDINADOR_TESTIGOS">COORDINADOR TESTIGOS (Patricia/Angela)</MenuItem>
                  <MenuItem value="OPERARIO">OPERARIO</MenuItem>
                  <MenuItem value="ABOGADO">ABOGADO</MenuItem>
                </TextField>
              </Box>
              <Box>
                <TextField
                  select
                  fullWidth
                  label="Estado de cuenta"
                  value={activo ? 'si' : 'no'}
                  onChange={(e) => setActivo(e.target.value === 'si')}
                  required
                  disabled={submitting}
                  sx={sxSelect}
                >
                  <MenuItem value="si">Activo / Habilitado</MenuItem>
                  <MenuItem value="no">Inactivo / Desactivado</MenuItem>
                </TextField>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="inherit" disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
