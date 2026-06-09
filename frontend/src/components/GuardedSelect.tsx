/**
 * GuardedSelect
 *
 * Wrapper sobre MUI <Select> que resuelve el bug de touchpad / pantalla táctil
 * donde el menú se cierra de inmediato al abrirse.
 *
 * Causa: el touchpad emite mousedown (abre el menú) seguido de mouseup
 * (~50-150 ms después) que aterriza sobre el backdrop o el primer MenuItem,
 * disparando onClose antes de que el usuario pueda mover el dedo.
 *
 * Solución: se mide el instante de apertura (onOpen) y se descarta cualquier
 * evento onClose que llegue dentro de GUARD_MS milisegundos, dando tiempo
 * suficiente para que el cursor/dedo salga del área de activación.
 */
import { useRef } from 'react';
import { Select } from '@mui/material';
import type { SelectProps } from '@mui/material';

const GUARD_MS = 500; // ms a ignorar clics en el fondo tras abrir

export default function GuardedSelect<T = unknown>({
  onOpen,
  onClose,
  MenuProps,
  ...props
}: SelectProps<T>) {
  const openedAt = useRef<number>(0);

  const handleOpen: SelectProps['onOpen'] = (event) => {
    openedAt.current = Date.now();
    onOpen?.(event);
  };

  const handleClose = (event: React.SyntheticEvent, reason?: string) => {
    // Solo ignoramos el cierre si es un clic en el fondo (backdrop) OCURRIDO
    // justo después de abrir. Esto permite que seleccionar una opción real
    // (donde reason es undefined) cierre el menú de inmediato, sin importar
    // qué tan rápido se hizo el toque.
    if (reason === 'backdropClick' && Date.now() - openedAt.current < GUARD_MS) {
      return;
    }
    
    // Para SelectProps, onClose espera solo (event), pero internamente MUI
    // pasa (event, reason) que casteamos de forma segura.
    if (onClose) {
      (onClose as any)(event, reason);
    }
  };

  return (
    <Select<T>
      onOpen={handleOpen}
      onClose={handleClose as any}
      MenuProps={{
        disableAutoFocusItem: true,
        disableScrollLock: true,
        marginThreshold: 0,
        ...MenuProps,
        slotProps: {
          paper: {
            sx: {
              borderRadius: 0,
              mt: 0.5,
              boxShadow: '0 4px 20px rgba(26,31,46,0.12)',
            },
            // Evita que el click en el paper propague al backdrop
            onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
          },
          ...MenuProps?.slotProps,
        },
      }}
      {...props}
    />
  );
}
