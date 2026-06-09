import { Select } from '@mui/material';
import type { SelectProps } from '@mui/material';

/**
 * GuardedSelect — wrapper de MUI Select que suprime el warning
 * "You have provided an out-of-range value" cuando las opciones
 * aún no han cargado pero ya hay un value seleccionado.
 */
export default function GuardedSelect({ value, children, ...props }: SelectProps) {
  return (
    <Select
      value={value}
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
      {...props}
    >
      {children}
    </Select>
  );
}