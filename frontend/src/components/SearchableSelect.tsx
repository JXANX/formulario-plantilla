import { useState, useMemo } from 'react';
import { Select, ListSubheader, TextField, InputAdornment } from '@mui/material';
import type { SelectProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * SearchableSelect — basado en GuardedSelect, mantiene la misma accesibilidad
 * y diseño, pero añade un campo de búsqueda en la parte superior del menú desplegable.
 * Ideal para listas largas como puestos de votación o municipios.
 */
export default function SearchableSelect({ children, ...props }: SelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtramos los children en base al texto que renderizan
  const filteredChildren = useMemo(() => {
    if (!searchTerm) return children;
    
    const items = Array.isArray(children) ? children.flat() : [children];
    return items.filter((child: any) => {
      // Mantenemos siempre la opción por defecto (ej. "Seleccione...")
      if (child?.props?.value === '') return true;

      let text = '';
      if (child && typeof child === 'object' && 'props' in child) {
        const childText = child.props?.children;
        if (typeof childText === 'string') {
          text = childText;
        } else if (Array.isArray(childText)) {
          const stringParts = childText.filter(c => typeof c === 'string');
          if (stringParts.length > 0) {
            text = stringParts.join(' ');
          }
        }
      }
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [children, searchTerm]);

  return (
    <Select
      {...props}
      // Reutilizamos la lógica de GuardedSelect para renderizar el valor seleccionado
      renderValue={(selected) => {
        if (selected === '' || selected === undefined || selected === null) return '';
        let label: string = String(selected);
        if (children) {
          const items = Array.isArray(children) ? (children as any[]).flat() : [children];
          for (const child of items) {
            if (
              child &&
              typeof child === 'object' &&
              'props' in child &&
              String((child as any).props?.value) === String(selected)
            ) {
              const childText = (child as any).props?.children;
              if (typeof childText === 'string') label = childText;
              else if (Array.isArray(childText)) {
                const text = childText.find((c: any) => typeof c === 'string');
                if (text) label = text;
              }
              break;
            }
          }
        }
        return label;
      }}
      MenuProps={{
        autoFocus: false, // Evita que MUI quite el foco del input de búsqueda
        ...props.MenuProps,
      }}
      onClose={(e) => {
        // Limpiamos la búsqueda al cerrar
        setSearchTerm('');
        if (props.onClose) props.onClose(e as any);
      }}
    >
      <ListSubheader
        sx={{
          pt: 1, pb: 1, bgcolor: '#fff', zIndex: 2, top: 0,
          lineHeight: 'normal'
        }}
        // Detenemos la propagación para que al hacer clic o escribir no se cierre el Select
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <TextField
          size="small"
          autoFocus
          placeholder="Buscar..."
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              backgroundColor: '#F8F7F4', // color J.surface
            }
          }}
        />
      </ListSubheader>
      {filteredChildren}
    </Select>
  );
}
