import { Select, SelectProps } from '@mui/material';

/**
 * GuardedSelect — wrapper de MUI Select que suprime el warning
 * "You have provided an out-of-range value" cuando las opciones
 * aún no han cargado pero ya hay un value seleccionado.
 *
 * Úsalo exactamente igual que <Select>: mismos props, mismos children.
 */
export default function GuardedSelect({ value, children, ...props }: SelectProps) {
  return (
    <Select
      value={value}
      // renderValue vacío evita que MUI tire warning cuando el value
      // todavía no existe entre los MenuItem hijos.
      renderValue={(selected) => {
        if (selected === '' || selected === undefined || selected === null) return '';
        // Buscar el label del MenuItem que coincide con el value actual.
        // Si no lo encuentra (opciones aún cargando) devuelve el value como texto.
        let label: string = String(selected);
        if (children) {
          const items = Array.isArray(children) ? children.flat() : [children];
          for (const child of items) {
            if (
              child &&
              typeof child === 'object' &&
              'props' in child &&
              String(child.props?.value) === String(selected)
            ) {
              // Extraer texto plano del children del MenuItem
              const childText = child.props?.children;
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
      {...props}
    >
      {children}
    </Select>
  );
}
