Necesito que implementes dos mejoras en el módulo de reportes de la aplicación de registro y control de testigos electorales:

---

## MEJORA 1: Nuevo reporte — Cobertura por Municipio

Crea una nueva vista/reporte llamada "Reporte de Cobertura por Municipio" dentro de la sección de reportes de mesas. Este reporte debe:

- Agrupar los datos por Departamento → Municipio → Puestos → Mesas
- Mostrar por cada municipio:
  - Total de mesas registradas en ese municipio
  - Total de mesas con al menos un testigo asignado
  - Total de mesas sin testigo (sin cobertura)
  - Porcentaje de cobertura del municipio ( mesas_con_testigo / total_mesas \* 100 )
- Permitir filtrar por departamento
- Ordenar los municipios de menor a mayor cobertura (para identificar prioridades)
- El reporte debe ser exportable (si ya existe funcionalidad de exportación en otros reportes, replicar el mismo mecanismo)

---

## MEJORA 2: Cambio de lógica en el Reporte por Puesto — Eliminación del rol "Testigo Suplente"

En el reporte por puesto, modifica la lógica de visualización de testigos así:

1. **Eliminar el estado "Testigo Suplente"**: todos los testigos registrados actualmente como "suplente" deben pasar a mostrarse con el rol "Testigo Principal" (o "Director" según el nombre que use el sistema internamente).

2. **Mostrar siempre dos columnas de testigo por mesa**: en lugar de mostrar el rol (principal/suplente), mostrar las posiciones como:
   - Testigo 1
   - Testigo 2
     Ambos con el mismo nivel jerárquico, sin distinción de suplencia.

3. Si una mesa tiene solo un testigo registrado, mostrar "Testigo 1" con sus datos y "Testigo 2" como vacío o "Sin asignar".

4. Si una mesa tiene más de dos testigos registrados, mostrar solo los dos primeros (ordenados por fecha de registro o por ID ascendente).

5. Esta lógica aplica solo a la capa de presentación del reporte — no modificar los datos almacenados en la base de datos ni el modelo de datos subyacente.

---

## CONTEXTO TÉCNICO

- La aplicación gestiona testigos electorales organizados por: Departamento > Municipio > Puesto de votación > Mesa
- Ya existen reportes por Puesto y por Mesa; esta mejora agrega el nivel de Municipio
- Respetar los patrones de código, naming conventions y estructura de componentes/servicios ya existentes en el proyecto
- Si hay un servicio o repositorio de datos centralizado para los reportes, agregar la nueva consulta ahí
- Revisar si existe algún enum o constante para los roles de testigo (Principal, Suplente, Director) y actualizar la lógica de mapeo en el reporte sin alterar los valores persistidos

---

Por favor revisa primero la estructura actual del módulo de reportes antes de implementar, e indica qué archivos vas a modificar o crear.
