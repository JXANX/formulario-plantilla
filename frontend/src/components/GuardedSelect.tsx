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

const GUARD_MS = 400; // ms a ignorar onClose tras abrir

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

  const handleClose: SelectProps['onClose'] = (event) => {
    // Si el cierre llega antes de GUARD_MS desde la apertura, lo ignoramos
    if (Date.now() - openedAt.current < GUARD_MS) return;
    onClose?.(event);
  };

  return (
    <Select<T>
      onOpen={handleOpen}
      onClose={handleClose}
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
