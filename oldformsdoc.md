# TRACTO — Documentación Técnica de Componentes
> Sistema de Control de Testigos Electorales  
> Archivos analizados: `MainLayout.tsx` · `TestigoFormPage.tsx` · `TestigosListPage.tsx` · `MesasReportPage.tsx`  
> **Propósito:** Especificación completa para que un agente de IA pueda reconstruir apariencia, comportamiento, validaciones e integraciones sin revisar el código original.

---

## Tabla de contenidos

1. [Arquitectura general](#1-arquitectura-general)
2. [Estilo visual — tokens completos](#2-estilo-visual--tokens-completos)
3. [Comportamiento funcional](#3-comportamiento-funcional)
4. [Configuración MUI](#4-configuración-mui)
5. [Estado y lógica React](#5-estado-y-lógica-react)
6. [Contrato de datos](#6-contrato-de-datos)
7. [Dependencias ocultas](#7-dependencias-ocultas)
8. [Guía de reconstrucción paso a paso](#8-guía-de-reconstrucción-paso-a-paso)
9. [Prompt final para migración](#9-prompt-final-para-migración)

---

## 1. Arquitectura general

### 1.1 Mapa de componentes

```
MainLayout.tsx          ← Layout raíz con React Router <Outlet />
├── Sidebar permanente (desktop) / Drawer temporal (mobile)
├── AppBar sticky con breadcrumb dinámico
└── <Outlet /> → páginas hijas:
    ├── /registro       → TestigoFormPage.tsx
    ├── /testigos       → TestigosListPage.tsx
    └── /reporte-mesas  → MesasReportPage.tsx
```

La app es una SPA con React Router. No hay Next.js ni SSR. El layout persiste entre rutas.

### 1.2 Componentes locales reutilizables

| Nombre | Archivo | Descripción |
|---|---|---|
| `SectionLabel` | `TestigoFormPage` | Encabezado de sección con número en caja cuadrada + texto gold uppercase |
| `StatMini` | `MesasReportPage` | Tarjeta de estadística con borde top coloreado, título pequeño uppercase, valor grande |
| `CoverageBadge` | `MesasReportPage` | Chip MUI de estado semáforo: Completa / Parcial / Sin Cobertura |
| `BarTooltip` | `MesasReportPage` | Tooltip dark personalizado para Recharts BarChart |
| `PieTooltip` | `MesasReportPage` | Tooltip dark personalizado para Recharts PieChart |
| `ChartSection` | `MesasReportPage` | Card completa con toggle Barras/Pastel + gráficas Recharts + leyenda |

### 1.3 Wrappers personalizados sobre MUI

**No existen.** Todos los `Select` son MUI nativos estándar, siempre dentro de `FormControl + InputLabel`. No hay Autocomplete en ninguno de los cuatro archivos.

### 1.4 Hooks, contextos y providers identificados

| Nombre | Tipo | Origen | Uso |
|---|---|---|---|
| `useWebSocket` | Hook personalizado | `../hooks/useWebSocket` | Expone `{ dashboardUpdates }`. Cuando cambia, dispara re-fetch de datos en `TestigosListPage` y `MesasReportPage` |
| `useToast` | Context hook | `../context/ToastContext` | Expone `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`. Solo usado en `TestigoFormPage` |
| `useNavigate` | React Router | react-router-dom | Navegación programática en `MainLayout` |
| `useLocation` | React Router | react-router-dom | Detectar ruta activa para breadcrumb y sidebar highlight |
| `useTheme` / `useMediaQuery` | MUI | @mui/material | Sólo en `ChartSection` para adaptar gráficas a mobile/tablet |

**No existe:** React Hook Form, Formik, Zustand, Redux, ni Context API propia para estado de formulario.

---

## 2. Estilo visual — tokens completos

### 2.1 Paleta de colores (objeto `J` / `JAGUAR`)

Todos los componentes definen localmente el mismo objeto de colores con nombre `J` (o `JAGUAR` en `MainLayout`):

```ts
const J = {
  ink:       '#1A1F2E',  // Azul muy oscuro — fondo sidebar, encabezados tabla, texto principal
  blue:      '#2952CC',  // Azul eléctrico — acento activo, hover botones, badge PRINCIPAL
  gold:      '#C9973A',  // Dorado — sidebar activo, etiquetas de sección, indicador tabs
  border:    '#E2DDD6',  // Beige claro — bordes de todas las cards, tablas, dialogs
  surface:   '#F8F7F4',  // Blanco cálido — fondo general de página, hover de filas
  muted:     '#F0EEE9',  // Beige más oscuro — hover de botones secundarios
  textMuted: '#7A7A7A',  // Gris medio — textos secundarios, labels, columnas de apoyo
  success:   '#2D7D4E',  // Verde — estado Completa, mesas cubiertas
  warning:   '#B97D1A',  // Ámbar — estado Parcial, badge SUPLENTE
  danger:    '#B83232',  // Rojo — Sin Cobertura, eliminar, errores
};
```

**Paleta auxiliar para gráfica de torta (`PIE_COLORS`):**
```ts
['#2952CC','#C9973A','#2D7D4E','#B83232','#7B4FA6',
 '#1A7A8A','#C45E1A','#4A7A2D','#8A2D6E','#2D5A8A',
 '#A67B2D','#3D8A6E','#8A3D3D','#5A3D8A','#3D6E8A']
```

### 2.2 Tabla completa de tokens visuales

| Token | Valor | Aplicación |
|---|---|---|
| `ink` | `#1A1F2E` | Fondo sidebar, thead tabla, texto primario, botón submit |
| `blue` | `#2952CC` | Nav activa, CircularProgress, hover botón submit, badge PRINCIPAL bg/color |
| `gold` | `#C9973A` | Borde activo sidebar (4px izq), subtítulos sección, indicador Tabs (height 2px) |
| `border` | `#E2DDD6` | Border `1px solid` de todas las cards, tablas, dialogs, divisores horizontales |
| `surface` | `#F8F7F4` | Fondo `<Box component="main">`, hover filas tabla, fondo ChartSection body |
| `muted` | `#F0EEE9` | Hover botones outlined/toggle cuando no están activos |
| `textMuted` | `#7A7A7A` | Labels uppercase, textos secundarios, placeholder icons |
| `success` | `#2D7D4E` | Chip Completa, columna "Cubiertas", borde top StatMini, barras Recharts cubiertas |
| `warning` | `#B97D1A` | Chip Parcial, badge SUPLENTE, ◑ Parcial en MenuItem mesa |
| `danger` | `#B83232` | Chip Sin Cobertura, botón Eliminar, "Pendiente asignar", barras Recharts vacías |
| `canvas` (#fff) | `#FFFFFF` | Fondo AppBar, cards de stats, card formulario |
| Sidebar nav activo bg | `rgba(255,255,255,0.055)` | Fondo item activo sidebar |
| Sidebar nav hover bg | `rgba(255,255,255,0.05)` | Fondo hover item sidebar |
| Sidebar nav hover border | `rgba(201,151,58,0.45)` | Borde izquierdo hover sidebar |
| Badge PRINCIPAL bg | `rgba(41,82,204,0.09)` | Fondo badge tipo testigo PRINCIPAL |
| Badge PRINCIPAL border | `rgba(41,82,204,0.22)` | Borde badge PRINCIPAL |
| Badge SUPLENTE bg | `rgba(185,125,26,0.1)` | Fondo badge SUPLENTE |
| Badge SUPLENTE border | `rgba(185,125,26,0.22)` | Borde badge SUPLENTE |
| Chip Completa bg | `rgba(45,125,78,0.1)` | Fondo chip estado |
| Chip Completa border | `rgba(45,125,78,0.25)` | Borde chip estado |
| Chip Parcial bg | `rgba(185,125,26,0.1)` | Fondo chip estado |
| Chip Parcial border | `rgba(185,125,26,0.25)` | Borde chip estado |
| Chip Sin Cob. bg | `rgba(184,50,50,0.1)` | Fondo chip estado |
| Chip Sin Cob. border | `rgba(184,50,50,0.25)` | Borde chip estado |
| Tooltip chart bg | `#1A1F2E` (`ink`) | Fondo tooltips Recharts |
| Tooltip chart shadow | `0 4px 12px rgba(0,0,0,0.25)` | Sombra tooltip |
| Botón disabled bg | `rgba(26,31,46,0.35)` | Botón "Guardar Traslado" deshabilitado |
| IconButton acción azul hover | `rgba(41,82,204,0.08)` | Hover botón Mover |
| IconButton acción rojo hover | `rgba(184,50,50,0.08)` | Hover botón Eliminar |
| Fondo página radial | `radial-gradient(rgba(26,31,46,0.03) 1px, transparent 1px)` | Patrón de puntos, `backgroundSize: '28px 28px'` |

### 2.3 Tipografía

No se declara una fuente base explícita para el cuerpo, salvo en un caso:

- **`"IBM Plex Mono", monospace`** — usado en botón "Exportar a Excel" (`MesasReportPage`) y en la celda vacía de tabla ("No hay mesas registradas...").
- El resto usa la fuente MUI por defecto (Roboto).

| Elemento | fontSize | fontWeight | letterSpacing | textTransform |
|---|---|---|---|---|
| Título de página | `36px` / `32px` (form) | `700` | — | — |
| Etiqueta gold eyebrow | `11–12px` | normal/`600` | `0.22em` | `uppercase` |
| SectionLabel texto | `12px` | `600` | `0.18em` | `uppercase` |
| SectionLabel número | `13px` | `600` | — | — |
| Labels internos de sección | `12px` | — | `0.15–0.18em` | `uppercase` |
| Encabezados columna tabla | `12px` | `600` | `0.12em` | `uppercase` |
| Celda dato principal | `15–16px` | `600` | — | — |
| Celda dato secundario | `14–15.5px` | normal | — | — |
| Celda muted | `14px` | normal | — | color `textMuted` |
| Badge tipo testigo | `12px` | `700` | `0.08em` | `uppercase` |
| Botón acción principal (submit) | `13px` | `600` | `0.14em` | `uppercase` |
| Botón acción secundario | `13px` | — | `0.1em` | `uppercase` |
| Botón export/toggle | `10px` | `600` | `0.12em` | `uppercase` |
| Tab navegación | `11px` | `600` | `0.14em` | `uppercase` |
| StatMini título | `12px` | — | `0.15em` | `uppercase` |
| StatMini valor | `2.6rem` | `700` | — | — |
| Sidebar "TRACTO" | `30px` | `700` | `0.08em` | — |
| Sidebar subtítulo | `17px` | `500` | — | — |
| Sidebar nav item | `17px` | `500` (normal) / `700` (activo) | — | — |
| AppBar breadcrumb parent | `13px` | — | `0.1em` | `uppercase` |
| AppBar breadcrumb current | `24–26px` | `700` | — | — |
| Tooltip chart título | `13px` | `700` | — | — |
| Tooltip chart texto | `12px` | — | — | — |
| Chip estado | `12px` | — | `0.08em` | — |
| MenuItem mesa (estado) | `13px` | — | — | — |

### 2.4 Dimensiones y espaciados de controles

| Propiedad | Valor |
|---|---|
| **Select / TextField size** | `"small"` en todos los selects y textfields del formulario y filtros. Sin `size` solo el TextField de búsqueda en `TestigosListPage` (usa default "medium") |
| **FormControl** | `fullWidth` en todos los casos |
| **Card formulario padding** | `p: { xs: 3, md: 4 }` |
| **Card filtros padding** | `p: 3.5` (28px) |
| **Grid spacing formulario** | `spacing={3}` |
| **Grid spacing filtros lista** | `spacing={2.5}` |
| **Grid spacing move dialog** | `spacing={2}` |
| **Grid spacing reporte** | `spacing={2}` |
| **Border radius — todo** | `borderRadius: 0` (cards, botones, dialogs, alerts) |
| **Sombra — todo** | `boxShadow: 'none'` |
| **Border cards** | `1px solid #E2DDD6` |
| **Border top StatMini** | `4px solid {color}` |
| **Border sidebar activo** | `4px solid #C9973A` (izquierdo) |
| **Borde sidebar inactivo** | `4px solid transparent` |
| **Dialog border** | `1px solid #E2DDD6` |
| **Divisor de sección en form** | `Box height: 1, bgcolor: border` |
| **Chip badge altura** | `height: 28` |
| **SectionLabel number box** | `26x26px`, `border: 1.5px solid border` |
| **Botón submit padding** | `px: 4, py: 1.4` |
| **AppBar height** | `xs: 76px`, `sm: 96px` |
| **Sidebar width** | `270px` (desktop), `85vw` max `300px` (mobile) |

### 2.5 Estados visuales de controles

| Estado | Detalle |
|---|---|
| **Hover fila tabla** | `bgcolor: '#F8F7F4'` via `hover` prop + sx |
| **Hover botón Mover** | `bgcolor: rgba(41,82,204,0.08)` |
| **Hover botón Eliminar** | `bgcolor: rgba(184,50,50,0.08)` |
| **Hover botón "Confirmar Eliminación"** | `bgcolor: '#8f2020'` |
| **Hover botón submit / Guardar Traslado** | `bgcolor: '#2952CC'` |
| **Hover botón Verificar (outlined)** | `bgcolor: J.muted (#F0EEE9)`, `borderColor: J.border` |
| **Hover nav sidebar** | `bgcolor: rgba(255,255,255,0.05)`, border gold 45% |
| **Nav sidebar activo** | `bgcolor: rgba(255,255,255,0.055)`, border `#C9973A`, texto+icono gold |
| **Select disabled** | MUI opacity nativa, aplicado vía `disabled` en `FormControl` |
| **Botón Guardar Traslado disabled** | `bgcolor: rgba(26,31,46,0.35)`, `color: '#fff'` |
| **MenuItem mesa llena** | `disabled={true}`, color `textMuted` (#7A7A7A) |
| **Mesa actual en move dialog** | `color: blue (#2952CC)`, `fontWeight: 700`, label " (Actual)" |
| **Error global** | MUI `<Alert severity="error">`, `borderRadius: 0` |
| **Success global** | MUI `<Alert severity="success">`, `borderRadius: 0` |
| **Error inline dialog** | MUI `<Alert severity="error">`, `borderRadius: 0`, dentro del dialog |

---

## 3. Comportamiento funcional

### 3.1 Cadenas de selects por página

#### TestigoFormPage — Sección "Asignación Electoral" (4 niveles, TODOS requeridos para submit)

```
Departamento (required)
  └─ carga → Municipio (required, disabled si !depto)
               └─ carga → Puesto (required, disabled si !mpio)
                            └─ carga → Mesa (required, disabled si !puesto)
```

- **Mesa filtra automáticamente:** solo muestra mesas con `m.ocupados < m.capacidad` (no muestra mesas llenas).
- Cada MenuItem de mesa muestra estado visual: `◑ Parcial` (gold) si hay algún ocupado, `○ Vacía` (danger) si está completamente vacía.

#### TestigosListPage — Filtros de búsqueda (3 niveles, todos opcionales)

```
Municipio (cargado por defecto al montar)
  └─ carga → Puesto (disabled si !municipio)
               └─ carga → Mesa (disabled si !puesto)
```

Nota: El departamento NO se expone al usuario en esta página. Se usa internamente solo para cargar los municipios del primer departamento disponible.

#### TestigosListPage — Move Dialog (4 niveles, todos requeridos para confirmar)

```
Departamento
  └─ carga → Municipio (disabled si !depto)
               └─ carga → Puesto (disabled si !mpio)
                            └─ carga → Mesa (disabled si !puesto)
```

El dialog se abre pre-cargado con la ubicación actual del testigo: hace fetch secuencial de deptos → mpios → puestos → mesas al abrir, y pre-selecciona los valores del testigo en cada nivel.

#### MesasReportPage — Tab 0 "Cobertura por Puesto" (3 niveles)

```
Departamento (auto-selecciona el primero al montar)
  └─ carga → Municipio (disabled si !depto)
               └─ carga → Puesto (disabled si !mpio)
                            └─ activa tabla de mesas
```

#### MesasReportPage — Tab 1 "Cobertura por Municipio" (1 nivel)

```
Departamento → carga tabla de cobertura + gráficas
```

### 3.2 Regla de reset en cascada

En todos los selects encadenados, al cambiar cualquier nivel N, todos los niveles N+1 en adelante se resetean a `''` y sus listas a `[]`:

```ts
// Ejemplo: cambio de municipio
setSelectedMunicipio(mpioId);
setSelectedPuesto('');
setSelectedMesa('');
setPuestos([]);
setMesas([]);
```

### 3.3 Filtrado client-side en TestigosListPage

La función `filteredTestigos` aplica todos los filtros simultáneamente con AND lógico sobre el array completo cargado:

```ts
const filteredTestigos = testigos.filter(t => {
  const q = searchQuery.trim().toLowerCase();
  const matchesSearch = q === '' 
    || t.documento.toLowerCase().includes(q) 
    || t.nombreCompleto.toLowerCase().includes(q);
  return matchesSearch
    && (selectedMunicipio === '' || String(t.municipioId) === String(selectedMunicipio))
    && (selectedPuesto    === '' || String(t.puestoId)    === String(selectedPuesto))
    && (selectedMesa      === '' || String(t.mesaId)      === String(selectedMesa));
});
```

Comparación de IDs siempre con `String()` en ambos lados para evitar mismatch de tipo.

### 3.4 Flujo completo de registro (TestigoFormPage)

1. Usuario ingresa cédula y pulsa **Verificar** → `GET /api/testigos/documento/{doc}`.
   - Si existe: pre-rellena campos personales, muestra warning en Alert + toast.
   - Si no existe: muestra mensaje de disponibilidad en Alert + toast.
2. Usuario completa datos personales (requeridos: nombre, primerApellido, celular).
3. Usuario selecciona Departamento → Municipio → Puesto → Mesa (todos requeridos).
4. Usuario pulsa **Registrar Testigo** → `POST /api/testigos` con body `{ ...formData, mesaId }`.
5. En éxito: limpia formulario (mantiene selects de ubicación excepto mesa), refresca lista de mesas del puesto actual para actualizar disponibilidad.
6. En error: muestra Alert + toast de error.

### 3.5 Flujo de traslado de mesa (Move Dialog en TestigosListPage)

1. Usuario pulsa icono SwapHoriz en fila → abre dialog con ubicación actual pre-cargada.
2. Usuario modifica la cadena de selects hasta llegar a una Mesa diferente a la actual.
3. Botón "Guardar Traslado" habilitado solo si `moveMesa !== ''` y `moveMesa !== String(testigo.mesaId)`.
4. Confirma → `PUT /api/testigos/{id}/mover?nuevaMesaId={mesaId}`.
5. En éxito: cierra dialog, refresca lista, muestra Alert success.

### 3.6 Flujo de eliminación (Delete Dialog en TestigosListPage)

1. Usuario pulsa icono Delete → abre dialog de confirmación.
2. Muestra nombre y documento del testigo seleccionado.
3. Confirma → `DELETE /api/testigos/{id}`.
4. En éxito: cierra dialog, refresca lista, muestra Alert success.

### 3.7 Ordenamiento de opciones en MenuItem

| Select | Ordenamiento |
|---|---|
| Departamento (form) | `localeCompare('es')` por `nombre` |
| Municipio (form y filtros) | `localeCompare('es')` por `nombre` |
| Puesto (form y filtros) | `localeCompare('es')` por `nombrePuesto` |
| Mesa (form y filtros) | numérico ascendente por `numeroMesa` |
| Move dialog (depto/mpio/puesto) | `localeCompare('es')` por nombre correspondiente |
| Move dialog (mesa) | numérico ascendente por `numeroMesa` |

### 3.8 Exportación a Excel (MesasReportPage)

Botón "Exportar a Excel" visible solo en Tab 1, deshabilitado si no hay `selectedDepartamento`.  
`GET /api/excel/export-cobertura?departamentoId={id}` → respuesta binaria Blob → descarga automática como `Cobertura_Municipios_Export.xlsx`.

---

## 4. Configuración MUI

### 4.1 Patrón estándar de Select (usado en todos los archivos)

```tsx
<FormControl fullWidth size="small" disabled={!nivelAnterior}>
  <InputLabel>{label}</InputLabel>
  <Select
    value={estadoLocal}
    label={label}           // ← requerido para label flotante correcto
    onChange={handlerFn}
    required                // solo en TestigoFormPage
  >
    <MenuItem value="">Texto vacío / Todos</MenuItem>
    {items
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(item => (
        <MenuItem key={item.id} value={item.id}>
          {item.nombre}
        </MenuItem>
      ))
    }
  </Select>
</FormControl>
```

**No se usan:** `renderValue`, `MenuProps`, `multiple`, `displayEmpty`, ni `Autocomplete` en ningún archivo.

### 4.2 TextField de búsqueda (TestigosListPage)

```tsx
<TextField
  fullWidth
  label="Buscar por Nombre o Documento"
  value={searchQuery}
  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
  slotProps={{
    input: {
      startAdornment: <SearchIcon sx={{ color: J.textMuted, mr: 1, fontSize: 20 }} />
    }
  }}
/>
// Sin size="small" → usa MUI default "medium"
```

### 4.3 TextField del formulario (TestigoFormPage)

```tsx
<TextField
  fullWidth
  required      // en campos obligatorios
  size="small"
  label="Primer Nombre"
  name="nombre"
  value={formData.nombre}
  onChange={handleChange}
  // type="email" solo en campo correo
/>
```

### 4.4 TextField de cédula con botón inline

```tsx
<Box sx={{ display: 'flex', gap: 1 }}>
  <TextField
    fullWidth required
    label="Cédula / Documento"
    name="documento"
    value={formData.documento}
    onChange={handleChange}
    size="small"
  />
  <Button
    variant="outlined"
    onClick={handleVerificarDocumento}
    disabled={!formData.documento || isVerifying}
    startIcon={<SearchIcon sx={{ fontSize: '16px !important' }} />}
    sx={{
      flexShrink: 0,
      borderColor: J.border,
      color: J.ink,
      borderRadius: 0,
      fontSize: '13px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      '&:hover': { bgcolor: J.muted, borderColor: J.border },
    }}
  >
    Verificar
  </Button>
</Box>
```

### 4.5 Dialogs

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"      // solo en Move Dialog
  fullWidth          // solo en Move Dialog
  slotProps={{
    paper: {
      sx: { borderRadius: 0, border: `1px solid ${J.border}` }
    }
  }}
>
  <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', borderBottom: `1px solid ${J.border}` }}>
    Título
  </DialogTitle>
  <DialogContent dividers sx={{ borderColor: J.border }}>  {/* dividers solo en Move */}
    {/* contenido */}
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
    <Button onClick={handleClose} sx={{ borderRadius: 0, color: J.textMuted, fontSize: '13px', letterSpacing: '0.1em' }}>
      Cancelar
    </Button>
    <Button onClick={handleConfirm} sx={{ /* ver tokens por botón */ }}>
      Confirmar
    </Button>
  </DialogActions>
</Dialog>
```

### 4.6 Tabs (MesasReportPage)

```tsx
<Tabs
  value={activeTab}
  onChange={(_, v) => setActiveTab(v)}
  sx={{
    mb: 4,
    borderBottom: `1px solid ${J.border}`,
    '& .MuiTabs-indicator': { bgcolor: J.gold, height: 2 }
  }}
>
  <Tab
    label="Cobertura por Puesto"
    sx={{
      fontSize: '11px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontWeight: 600,
      color: J.textMuted,
      '&.Mui-selected': { color: J.ink }
    }}
  />
</Tabs>
```

### 4.7 TablePagination (TestigosListPage)

```tsx
<TablePagination
  rowsPerPageOptions={[5, 10, 25, 50]}
  component="div"
  count={filteredTestigos.length}
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={(_, p) => setPage(p)}
  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
  labelRowsPerPage="Filas por página:"
  sx={{ fontSize: '13px', borderTop: `1px solid ${J.border}` }}
/>
```

### 4.8 MenuItem especial — Mesa en Move Dialog

```tsx
<MenuItem
  key={m.id}
  value={m.id}
  disabled={!isAvailable && !isCurrent}
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: isCurrent ? J.blue : (!isAvailable ? J.textMuted : 'inherit'),
    fontWeight: isCurrent ? 700 : 400,
  }}
>
  <span>Mesa {m.numeroMesa}{isCurrent ? ' (Actual)' : ''}</span>
  <span style={{ opacity: 0.65 }}>({m.ocupados}/{m.capacidad} ocupados)</span>
</MenuItem>
```

### 4.9 MenuItem especial — Mesa en formulario de registro

```tsx
// Solo muestra mesas con m.ocupados < m.capacidad (mesas llenas filtradas)
{[...mesas]
  .filter((m: any) => m.ocupados < m.capacidad)
  .sort((a, b) => a.numeroMesa - b.numeroMesa)
  .map((m: any) => {
    const isPartial = m.ocupados > 0 && m.ocupados < m.capacidad;
    return (
      <MenuItem key={m.id} value={m.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <span>Mesa {m.numeroMesa}</span>
        <span style={{ fontSize: '13px', color: isPartial ? J.gold : J.danger }}>
          {isPartial ? '◑ Parcial' : '○ Vacía'}
        </span>
      </MenuItem>
    );
  })
}
```

---

## 5. Estado y lógica React

### 5.1 TestigoFormPage — useState

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `departamentos` | `any[]` | `[]` | Lista de departamentos del catálogo |
| `municipios` | `any[]` | `[]` | Lista de municipios del depto seleccionado |
| `puestos` | `any[]` | `[]` | Lista de puestos del municipio seleccionado |
| `mesas` | `any[]` | `[]` | Lista de mesas disponibles del puesto |
| `selectedDepto` | `string` | `''` | ID del departamento seleccionado |
| `selectedMpio` | `string` | `''` | ID del municipio seleccionado |
| `selectedPuesto` | `string` | `''` | ID del puesto seleccionado |
| `selectedMesa` | `string` | `''` | ID de la mesa seleccionada |
| `formData` | `object` | ver abajo | Campos del formulario personal |
| `error` | `string` | `''` | Mensaje de error global |
| `success` | `string` | `''` | Mensaje de éxito global |
| `isVerifying` | `boolean` | `false` | Loading del botón Verificar |

**formData valor inicial:**
```ts
{
  documento: '', nombre: '', segundoNombre: '',
  primerApellido: '', segundoApellido: '',
  celular: '', correo: '', tipoTestigo: 'PRINCIPAL',
}
```

### 5.1.1 TestigoFormPage — useEffect

```ts
// Al montar: carga departamentos del catálogo
useEffect(() => {
  fetch(`${API_URL}/api/catalogo/departamentos`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(d => { if (d.success) setDepartamentos(d.data); });
}, []);
```

### 5.2 TestigosListPage — useState

| Variable | Tipo | Descripción |
|---|---|---|
| `testigos` | `Testigo[]` | Array completo de testigos del backend |
| `loading` | `boolean` | Loading inicial de la tabla |
| `error` / `success` | `string` | Alertas globales |
| `searchQuery` | `string` | Texto del input de búsqueda |
| `selectedMunicipio` | `string` | Filtro seleccionado |
| `selectedPuesto` | `string` | Filtro seleccionado |
| `selectedMesa` | `string` | Filtro seleccionado |
| `municipios` / `puestos` / `mesas` | `any[]` | Opciones de filtros |
| `deleteDialogOpen` | `boolean` | Visibilidad del dialog eliminar |
| `selectedTestigoForDelete` | `Testigo \| null` | Testigo a eliminar |
| `moveDialogOpen` | `boolean` | Visibilidad del dialog mover |
| `selectedTestigoForMove` | `Testigo \| null` | Testigo a mover |
| `moveDepto/Mpio/Puesto/Mesa` | `string` | Selects del move dialog |
| `moveDeptos/Mpios/Puestos/MesasList` | `any[]` | Opciones del move dialog |
| `moveError` | `string` | Error dentro del dialog |
| `page` / `rowsPerPage` | `number` | Paginación: `0` / `10` |

### 5.2.1 TestigosListPage — useEffect

```ts
// Recarga todo cuando cambia dashboardUpdates (WebSocket)
useEffect(() => { fetchTestigos(); fetchFilterCatalog(); }, [dashboardUpdates]);
```

### 5.3 MesasReportPage — useState

| Variable | Tipo | Descripción |
|---|---|---|
| `activeTab` | `number` | Tab activo: 0 = por Puesto, 1 = por Municipio |
| `departamentos` / `municipios` / `puestos` | `any[]` | Opciones de selects |
| `selectedDepartamento` / `selectedMunicipio` / `selectedPuesto` | `string` | Valores seleccionados |
| `mesas` | `Mesa[]` | Mesas del puesto seleccionado |
| `allWitnesses` | `Witness[]` | Todos los testigos cargados al inicio |
| `municipioCoberturas` | `CoberturaMunicipio[]` | Datos para Tab 1 y gráficas |
| `loadingMesas` / `loadingWitnesses` / `loadingCoberturas` | `boolean` | Estados de carga |
| `exportingCoberturas` | `boolean` | Loading botón exportar |
| `error` | `string` | Alerta de error |
| `stats` | `object` | Totales calculados al cargar mesas |

### 5.3.1 MesasReportPage — useEffect

```ts
// Al montar y cuando dashboardUpdates cambia: carga testigos + deptos + pre-selecciona primer depto
useEffect(() => { fetchInitialData(); }, [dashboardUpdates]);

// Cuando selectedPuesto cambia o allWitnesses cambia: recarga mesas
useEffect(() => {
  if (selectedPuesto) fetchMesas(selectedPuesto);
  else setMesas([]);
}, [selectedPuesto, allWitnesses]);

// Cuando cambia el tab a 1 o cambia el departamento: carga coberturas
useEffect(() => {
  if (activeTab === 1 && selectedDepartamento) fetchMunicipioCoberturas(selectedDepartamento);
}, [activeTab, selectedDepartamento]);
```

---

## 6. Contrato de datos

### 6.1 Endpoints de catálogo (shared entre todos los archivos)

| Endpoint | Método | Respuesta |
|---|---|---|
| `GET /api/catalogo/departamentos` | GET | `{ success: boolean, data: Departamento[] }` |
| `GET /api/catalogo/departamentos/{id}/municipios` | GET | `{ success: boolean, data: Municipio[] }` |
| `GET /api/catalogo/municipios/{id}/puestos` | GET | `{ success: boolean, data: Puesto[] }` |
| `GET /api/catalogo/puestos/{id}/mesas` | GET | `{ success: boolean, data: Mesa[] }` |

**Estructuras de catálogo:**
```ts
Departamento: { id: number, nombre: string }
Municipio:    { id: number, nombre: string }
Puesto:       { id: number, nombrePuesto: string, zona?: string }
Mesa:         { id: number, numeroMesa: number, capacidad: number, ocupados: number, estadoSemaforo: string }
```

### 6.2 Endpoints de testigos

| Endpoint | Método | Descripción |
|---|---|---|
| `GET /api/testigos` | GET | Lista completa de testigos |
| `GET /api/testigos/documento/{doc}` | GET | Verificar/buscar testigo por cédula |
| `POST /api/testigos` | POST | Registrar nuevo testigo |
| `DELETE /api/testigos/{id}` | DELETE | Eliminar testigo |
| `PUT /api/testigos/{id}/mover?nuevaMesaId={mesaId}` | PUT | Mover testigo de mesa |

**Body POST /api/testigos:**
```ts
{
  documento: string,
  nombre: string,
  segundoNombre: string,
  primerApellido: string,
  segundoApellido: string,
  celular: string,
  correo: string,
  tipoTestigo: 'PRINCIPAL' | 'SUPLENTE',
  mesaId: string,   // ← ID de la mesa seleccionada (string, no number)
}
```

**Respuesta estándar de backend:**
```ts
{ success: boolean, data?: any, message?: string }
```

**Interfaz Testigo (usada en lista y move dialog):**
```ts
interface Testigo {
  id: number;
  documento: string;
  nombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreCompleto: string;     // campo calculado por el backend
  celular: string;
  correo: string;
  nombreOrganizacion: string;
  tipoTestigo: string;        // 'PRINCIPAL' | 'SUPLENTE'
  fechaRegistro: string;
  mesaId: number;
  numeroMesa: number;
  puestoId: number;
  nombrePuesto: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  registradoPor: string;
}
```

### 6.3 Endpoint de cobertura por municipio

```
GET /api/dashboard/cobertura-municipios?departamentoId={id}
```
**Respuesta:**
```ts
interface CoberturaMunicipio {
  municipioId: number;
  municipioNombre: string;
  codigoMunicipio: string;
  departamentoId: number;
  departamentoNombre: string;
  totalMesas: number;
  mesasConTestigo: number;
  mesasSinTestigo: number;
  porcentajeCobertura: number;  // 0–100
}
```

### 6.4 Endpoint de exportación Excel

```
GET /api/excel/export-cobertura?departamentoId={id}
→ Respuesta binaria (Blob), Content-Disposition: attachment
→ Descarga como Cobertura_Municipios_Export.xlsx
```

### 6.5 Autenticación

Todas las llamadas usan JWT Bearer token:
```ts
const token = localStorage.getItem('token');
headers: { 'Authorization': `Bearer ${token}` }
```

---

## 7. Dependencias ocultas

### 7.1 Hooks personalizados

| Hook | Path | Contrato |
|---|---|---|
| `useWebSocket` | `../hooks/useWebSocket` | Retorna `{ dashboardUpdates: any }`. Se usa como dependency en `useEffect` para forzar re-fetch cuando hay actualizaciones en tiempo real vía WebSocket. |

### 7.2 Context / Providers

| Context | Path | Contrato |
|---|---|---|
| `useToast` | `../context/ToastContext` | Retorna `toast` con métodos: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`, `toast.info(msg)`. Solo usado en `TestigoFormPage`. |

### 7.3 Variables de entorno

```ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```
Presente en los tres archivos de página. Es un proyecto Vite.

### 7.4 Assets / imágenes

Usados solo en `MainLayout`:
```ts
import logo    from "../assets/logo_tracto.png";    // imagen cuadrada en sidebar
import logoBox from "../assets/logobox_tracto.png"; // imagen rectangular en AppBar
```

### 7.5 Librerías externas

| Librería | Uso |
|---|---|
| `@mui/material` | Todos los componentes UI |
| `@mui/icons-material` | Iconos SVG |
| `react-router-dom` | `Outlet`, `useNavigate`, `useLocation` |
| `recharts` | Gráficas en `MesasReportPage`: `BarChart`, `PieChart`, `ResponsiveContainer`, `LabelList`, `Cell` |

### 7.6 Tipos TypeScript no declarados explícitamente

Los arrays de catálogos (`departamentos`, `municipios`, `puestos`, `mesas` en `TestigoFormPage`) se tipan como `useState([])` sin tipo genérico, por lo que quedan como `never[]`. En la práctica son `any[]`. Solo `TestigosListPage` y `MesasReportPage` usan `any[]` explícito y definen interfaces propias.

### 7.7 Breadcrumb map (MainLayout)

```ts
const breadcrumbMap: Record<string, { parent: string; current: string }> = {
  '/dashboard':      { parent: 'MÓDULO PRINCIPAL /', current: 'Panel General' },
  '/registro':       { parent: 'REGISTRO /',         current: 'Alta de Testigo' },
  '/testigos':       { parent: 'REGISTRO /',         current: 'Listado de Testigos' },
  '/reporte-mesas':  { parent: 'MONITOREO /',        current: 'Reporte de Mesas' },
};
```

### 7.8 Rutas de navegación (MainLayout navItems)

```ts
[
  { label: 'Dashboard',          path: '/dashboard',      icon: <DashboardIcon /> },
  { label: 'Registrar Testigo',  path: '/registro',       icon: <PersonAddIcon /> },
  { label: 'Listado de Testigos',path: '/testigos',       icon: <PeopleIcon /> },
  { label: 'Reporte de Mesas',   path: '/reporte-mesas',  icon: <AssessmentIcon /> },
]
```

---

## 8. Guía de reconstrucción paso a paso

### Paso 1: Configurar el sistema de diseño

Crear el objeto de tokens de color en un archivo compartido o definirlo localmente en cada componente como constante `J`:

```ts
const J = {
  ink: '#1A1F2E', blue: '#2952CC', gold: '#C9973A',
  border: '#E2DDD6', surface: '#F8F7F4', muted: '#F0EEE9',
  textMuted: '#7A7A7A', success: '#2D7D4E', warning: '#B97D1A', danger: '#B83232',
};
```

Aplicar `borderRadius: 0` y `boxShadow: 'none'` a todas las Cards, Dialogs, Buttons y Alerts sin excepción.

### Paso 2: Construir el Layout principal

1. Sidebar fijo 270px en desktop (Drawer `variant="permanent"`), temporal en mobile (`variant="temporary"`, ancho `85vw` max `300px`).
2. Fondo sidebar `#1A1F2E`. Nav items con borde izquierdo 4px: `transparent` inactivo, `#C9973A` activo.
3. AppBar sticky, fondo blanco, borde inferior `1px solid #E2DDD6`, altura 76px/96px.
4. Breadcrumb dinámico usando `useLocation` + mapa de rutas.
5. Fondo del área de contenido: `#F8F7F4` con patrón `radial-gradient(rgba(26,31,46,0.03) 1px, transparent 1px)` y `backgroundSize: 28px 28px`.

### Paso 3: Implementar el patrón de selects encadenados

Estructura base repetida en las cuatro variantes:

```tsx
// Estado
const [lista, setLista] = useState<any[]>([]);
const [selected, setSelected] = useState('');

// Handler
const handleChange = async (e) => {
  const id = e.target.value;
  setSelected(id);
  // reset niveles inferiores
  setListaSiguiente([]); setSelectedSiguiente('');
  if (!id) return;
  const res = await fetch(`${API_URL}/api/catalogo/recurso/${id}/subitems`, { headers: auth });
  const data = await res.json();
  if (data.success) setListaSiguiente(data.data);
};

// Render
<FormControl fullWidth size="small" disabled={!selectedNivelAnterior}>
  <InputLabel>Etiqueta</InputLabel>
  <Select value={selected} label="Etiqueta" onChange={handleChange}>
    <MenuItem value="">Todos</MenuItem>
    {[...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(item => (
      <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>
    ))}
  </Select>
</FormControl>
```

**Regla de sort:** siempre `.sort()` sobre una copia (`[...array]`) antes de renderizar. Textos con `localeCompare('es')`, números con `a.numero - b.numero`.

### Paso 4: Formulario de registro (TestigoFormPage)

1. Envolver en `<form onSubmit={handleSubmit}>`.
2. Organizar en tres secciones con `SectionLabel` (número en cuadro 26x26px + texto gold uppercase).
3. Separar secciones con `<Box sx={{ height: 1, bgcolor: J.border, mt: 1 }} />`.
4. Campo cédula con botón Verificar en fila flex con `gap: 1`.
5. Campos personales con `size="small"`, `required` en obligatorios.
6. Select "Tipo Testigo" con solo dos opciones: `PRINCIPAL` (default) y `SUPLENTE`.
7. Selects de ubicación encadenados, todos `required`.
8. Select de mesa: filtrar `m.ocupados < m.capacidad`, mostrar indicadores `◑ Parcial` y `○ Vacía`.
9. Botón submit alineado a la derecha, `bgcolor: ink`, hover `bgcolor: blue`, `borderRadius: 0`, `boxShadow: 'none'`.

### Paso 5: Listado de testigos (TestigosListPage)

1. Filtros en Card con `borderRadius: 0`, padding `p: 3.5`.
2. TextField de búsqueda (tamaño medium) con `startAdornment: <SearchIcon>`.
3. Selects de Municipio/Puesto/Mesa (size="small"), encadenados, con "Todos/Todas" como primera opción.
4. Tabla con `TableHead` de fondo `#1A1F2E`, texto blanco uppercase 12px.
5. Filas con hover `bgcolor: #F8F7F4`.
6. Badge de tipo testigo: inline-block, `px: 1.5, py: 0.5`, colores según `tipoTestigo === 'PRINCIPAL'`.
7. Columna acciones con dos IconButtons: Mover (azul) y Eliminar (rojo), con hover de fondo translúcido.
8. `TablePagination` con opciones `[5, 10, 25, 50]`, label en español.
9. Implementar Delete Dialog y Move Dialog según especificación de sección 3.5 y 3.6.

### Paso 6: Reporte de mesas (MesasReportPage)

1. Tabs con indicador gold `height: 2`, label uppercase `fontWeight: 600`.
2. Tab 0: selects Departamento → Municipio → Puesto. Al seleccionar Puesto, mostrar 5 StatMini + tabla.
3. StatMini: borde top `4px solid {color}`, valor en `2.6rem fontWeight: 700`.
4. CoverageBadge: lógica `ocupados >= capacidad` → Completa, `ocupados === 1` → Parcial, `else` → Sin Cobertura.
5. Tabla de mesas: 4 columnas (Mesa, Estado, Testigo Principal, Testigo Suplente). Asociar testigos a mesas filtrando `allWitnesses` por `w.mesaId === m.id`, ordenados por `id asc`, primero = Principal, segundo = Suplente.
6. Tab 1: select Departamento → carga `ChartSection` + tabla de cobertura + botón exportar Excel.
7. ChartSection: toggle Barras/Pastel. Barras con `J.success` y `J.danger`. Pastel con colores del array `PIE_COLORS`. Tooltips dark personalizados.

### Paso 7: Conectar WebSocket y Toast

1. Implementar `useWebSocket` que exponga `dashboardUpdates` como estado reactivo.
2. Incluir `dashboardUpdates` en el array de dependencias de los `useEffect` de carga de datos.
3. Implementar `ToastContext` con métodos `success/error/warning/info`.
4. Consumir solo en `TestigoFormPage`.

---

## 9. Prompt final para migración

> Copia este prompt completo y entrégalo al agente de IA desarrollador:

---

```
Eres un desarrollador frontend React con Material UI. Debes reconstruir un sistema llamado TRACTO (Control de Testigos Electorales) compuesto por cuatro componentes: MainLayout, TestigoFormPage, TestigosListPage y MesasReportPage. Sigue estrictamente estas especificaciones:

## SISTEMA DE DISEÑO

Usa siempre este objeto de colores (sin MUI theme, declarado localmente como `const J`):
```ts
const J = {
  ink: '#1A1F2E', blue: '#2952CC', gold: '#C9973A',
  border: '#E2DDD6', surface: '#F8F7F4', muted: '#F0EEE9',
  textMuted: '#7A7A7A', success: '#2D7D4E', warning: '#B97D1A', danger: '#B83232',
};
```

Reglas de estilo que aplican a TODOS los componentes:
- `borderRadius: 0` en Cards, Dialogs, Buttons, Alerts, TableContainer
- `boxShadow: 'none'` en Cards, Buttons, TableContainer
- Border de cards: `1px solid #E2DDD6`
- Fuente base: Roboto (MUI default). Usar `"IBM Plex Mono", monospace` solo en botones de exportación y celdas de tabla vacías específicas
- Fondo de área de contenido: `#F8F7F4` con patrón radial-gradient de puntos a 28px

## PATRÓN DE SELECT ENCADENADO

Todas las cascadas de selects siguen este patrón exacto:
1. `FormControl fullWidth size="small" disabled={!nivelAnterior}`
2. `InputLabel` + `Select value={estado} label={mismo} onChange={handler}`
3. Los `MenuItem` siempre se renderizan desde una copia ordenada: `[...lista].sort(...)`
4. Textos: `localeCompare('es')`. Números: `a.numero - b.numero`
5. Al cambiar un nivel: resetear TODOS los niveles inferiores a `''` y sus listas a `[]`
6. Autenticación en cada fetch: `headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }`

Cadenas existentes:
- Formulario: Departamento → Municipio → Puesto → Mesa (todos `required`)
- Filtros lista: Municipio → Puesto → Mesa (todos opcionales, primer nivel carga al montar)
- Move Dialog: Departamento → Municipio → Puesto → Mesa (4 niveles, pre-cargados con datos del testigo)
- Reporte Tab 0: Departamento → Municipio → Puesto
- Reporte Tab 1: Departamento (único)

## ENDPOINTS API

Base: `import.meta.env.VITE_API_URL || 'http://localhost:8080'`

Catálogos:
- GET /api/catalogo/departamentos → `{ success, data: [{id, nombre}] }`
- GET /api/catalogo/departamentos/{id}/municipios → `{ success, data: [{id, nombre}] }`
- GET /api/catalogo/municipios/{id}/puestos → `{ success, data: [{id, nombrePuesto, zona}] }`
- GET /api/catalogo/puestos/{id}/mesas → `{ success, data: [{id, numeroMesa, capacidad, ocupados, estadoSemaforo}] }`

Testigos:
- GET /api/testigos → lista completa con todos los campos de la interfaz Testigo
- GET /api/testigos/documento/{doc} → verificar cédula existente
- POST /api/testigos → body: `{documento, nombre, segundoNombre, primerApellido, segundoApellido, celular, correo, tipoTestigo, mesaId}`
- DELETE /api/testigos/{id}
- PUT /api/testigos/{id}/mover?nuevaMesaId={mesaId}

Cobertura:
- GET /api/dashboard/cobertura-municipios?departamentoId={id} → `{ success, data: CoberturaMunicipio[] }`
- GET /api/excel/export-cobertura?departamentoId={id} → Blob para descarga

Respuesta estándar: `{ success: boolean, data?: any, message?: string }`

## COMPONENTE: TestigoFormPage

Formulario de 3 secciones con `SectionLabel` (componente local: número en Box 26x26px con borde 1.5px solid border + texto gold 12px uppercase letterSpacing 0.18em).

Sección 01: Campo cédula (size="small", required) + Botón "Verificar" en flex row gap:1.
  - Botón: variant="outlined", borderColor=border, color=ink, borderRadius=0, hover bg=muted
  - Al verificar: si existe → pre-rellena datos + toast.warning. Si no → toast.info
Sección 02: 6 TextFields (size="small") + Select "Tipo Testigo" (PRINCIPAL/SUPLENTE, default PRINCIPAL)
  - Requeridos: nombre, primerApellido, celular. Opcionales: segundoNombre, segundoApellido, correo (type="email")
Sección 03: 4 Selects encadenados Departamento→Municipio→Puesto→Mesa
  - Mesa: FILTRAR mesas llenas (solo `m.ocupados < m.capacidad`). En cada MenuItem mostrar "◑ Parcial" (gold) u "○ Vacía" (danger) en texto de 13px.

Botón submit: alineado a derecha, bgcolor=ink, hover bgcolor=blue, borderRadius=0, boxShadow=none, px:4, py:1.4, fontSize=13px, letterSpacing=0.14em, uppercase, fontWeight=600, startIcon=SaveIcon.

Al guardar exitoso: limpiar formData (mantener selects de ubicación menos mesa), refrescar mesas del puesto.

## COMPONENTE: TestigosListPage

Card de filtros (borderRadius=0, boxShadow=none, border border, p:3.5):
- TextField búsqueda (size=medium/default, fullWidth, startAdornment=SearchIcon color textMuted)
- Selects Municipio/Puesto/Mesa con opción "Todos/Todas" como primer MenuItem (value="")
- Filtrado client-side con AND lógico sobre array completo. Comparar IDs con String() en ambos lados.

Tabla: thead bgcolor=ink, texto blanco 12px uppercase letterSpacing=0.12em, fontWeight=600. Filas hover bgcolor=surface.
Badge tipoTestigo: inline-block, px:1.5 py:0.5, fontSize=12px, fontWeight=700, uppercase, letterSpacing=0.08em.
- PRINCIPAL: bgcolor=rgba(41,82,204,0.09), color=blue, border=rgba(41,82,204,0.22)
- SUPLENTE: bgcolor=rgba(185,125,26,0.1), color=warning, border=rgba(185,125,26,0.22)

Acciones: IconButton Mover (color=blue, hover bg rgba(41,82,204,0.08)) + IconButton Eliminar (color=danger, hover bg rgba(184,50,50,0.08)).
TablePagination: rowsPerPageOptions=[5,10,25,50], labelRowsPerPage="Filas por página:".

Delete Dialog: DialogTitle color=danger. Botón confirmar: bgcolor=danger, hover bgcolor='#8f2020'.
Move Dialog: maxWidth="sm" fullWidth. 4 selects encadenados pre-cargados con ubicación actual del testigo. MenuItem de mesa: mostrar "Mesa X (Actual)" para la mesa actual en color blue fontWeight=700; deshabilitar mesas llenas que no sean la actual; mostrar "(ocupados/capacidad ocupados)" a la derecha con opacity=0.65. Botón "Guardar Traslado": disabled si moveMesa==='' o moveMesa===String(testigo.mesaId); disabled sx: bgcolor=rgba(26,31,46,0.35) color=#fff; hover: bgcolor=blue.

Re-fetch de datos al cambiar `dashboardUpdates` del hook `useWebSocket`.

## COMPONENTE: MesasReportPage

Tabs MUI: indicador gold height=2, borderBottom=border. Labels: 11px, fontWeight=600, uppercase, letterSpacing=0.14em, color=textMuted, Mui-selected color=ink.

Tab 0 (Cobertura por Puesto):
- Filtros Departamento→Municipio→Puesto (size="small"). Auto-selecciona primer departamento al montar.
- Al seleccionar puesto: mostrar 5 StatMini en grid + tabla.
- StatMini: Card con borderTop=4px solid {color}, borderRadius=0, título 12px uppercase letterSpacing=0.15em textMuted, valor 2.6rem fontWeight=700.
- Stats: Total(ink), Cubiertas/Verde(success), Parciales/Amarillo(warning), Faltantes/Rojo(danger), %Cobertura(blue).
- Tabla: columnas Mesa/Estado/TestigoPrincipal/TestigoSuplente. Asociar testigos filtrando allWitnesses por mesaId, ordenar por id asc, índice 0=Principal, índice 1=Suplente.
- CoverageBadge: Chip size="small", height=28. Lógica: ocupados>=capacidad→Completa(success), ocupados===1→Parcial(warning), else→Sin Cobertura(danger).

Tab 1 (Cobertura por Municipio):
- Un select Departamento (size="small"). Botón "Exportar a Excel" deshabilitado si !selectedDepartamento.
- Al seleccionar: cargar ChartSection + tabla cobertura.
- Tabla: columnas Municipio/Total Mesas/Cubiertas/Vacías/%Cobertura. En %Cobertura: barra progreso height=4px con color dinámico (>=80%=success, >=40%=warning, else=danger) + texto porcentaje coloreado igual.
- ChartSection: Card con toggle Barras/Pastel (dos botones en fila con border, borderRadius=0). Activo: bgcolor=ink color=#fff. Inactivo: transparent, color=textMuted, hover=muted.
- BarChart (Recharts): barras "Cubiertas"=success, "Vacías"=danger, radio=[2,2,0,0], tooltip dark personalizado.
- PieChart: colores del array PIE_COLORS, label interno de porcentaje (ocultar si slice <4%), tooltip dark personalizado con nombre+valor+porcentaje.
- ResponsiveContainer con altura adaptada a mobile (useMediaQuery).

## DEPENDENCIAS EXTERNAS REQUERIDAS

- `../hooks/useWebSocket` → retorna `{ dashboardUpdates }` (disparador de re-fetch)
- `../context/ToastContext` → retorna `useToast()` con métodos `success/error/warning/info`
- `recharts` para MesasReportPage
- `react-router-dom` para MainLayout
- `@mui/material` y `@mui/icons-material`
- Variables de entorno Vite: `VITE_API_URL`

## REGLAS FINALES

1. No usar React Hook Form ni Formik. Gestionar estado con useState puro.
2. No usar Axios. Solo fetch nativo.
3. Siempre `[...array].sort(...)` (copia antes de ordenar, nunca mutar el estado).
4. Comparar IDs con String() en ambos lados en filtros client-side.
5. `borderRadius: 0` y `boxShadow: 'none'` SIEMPRE en cards, botones y dialogs.
6. Todos los `Select` con `size="small"` y `fullWidth` dentro de `FormControl`.
7. Pasar `label` tanto a `InputLabel` como al prop `label` de `Select` para el label flotante correcto.
8. Mostrar `<CircularProgress size={32} sx={{ color: J.blue }} />` centrado durante cargas.
9. Alerts con `severity` correspondiente y `borderRadius: 0`, con `onClose` para cerrarlas.
10. Paginación siempre a 0 al cambiar filtros de búsqueda.
```

---

*Fin del documento — TRACTO Component Documentation v1.0*