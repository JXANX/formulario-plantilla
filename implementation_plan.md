# Plan de Optimización de Consultas (Refactorización JPA)

He analizado el código fuente de los servicios backend y he identificado un problema grave de rendimiento (anti-patrón N+1 y cargas masivas en memoria). Actualmente, servicios críticos como `VotosService`, `DashboardService` y `AcreditadoService` están utilizando métodos como `findAll()` o `findAllWithEagerRelationships()` para cargar miles de registros en la memoria de Java (RAM) y luego calcular totales, porcentajes y agrupaciones usando *Streams* dentro de ciclos `for`. 

A medida que el volumen de datos crezca (más de 100,000 mesas o millones de votos), esto provocará que el servidor se quede sin memoria (`OutOfMemoryError`) y que los tiempos de respuesta del Dashboard pasen de milisegundos a minutos.

## Open Questions
> [!IMPORTANT]
> 1. **Alcance de la Optimización:** Dado que el problema de rendimiento es sistémico en varios servicios, sugiero empezar por los dos cuellos de botella más críticos que afectan la carga de la interfaz en tiempo real: `VotosService` (Estadísticas de Avance) y `DashboardService` (Panel General). ¿Estás de acuerdo en priorizar estos dos primero y luego extenderlo a los reportes de `AcreditadoService`?
> 2. **Caché Adicional:** Mover la carga a SQL mejorará dramáticamente el rendimiento, pero para dashboards de uso intensivo también se suele implementar una caché (ej. `@Cacheable` de Spring con Redis o Ehcache). Por ahora me enfocaré estrictamente en la **optimización de consultas JPQL nativas**. ¿Deseas que implementemos caché también o solo refactorizar el JPQL por ahora?

## Proposed Changes

La optimización consistirá en delegar las agrupaciones (`GROUP BY`), conteos (`COUNT`) y sumatorias (`SUM`) a la base de datos a través de consultas JPQL, evitando instanciar los objetos completos (`Entity`) en memoria.

### 1. Repositorios (Capa de Acceso a Datos)

#### [MODIFY] `RegistroVotoRegistraduriaRepository.java` y `RegistroVotoTestigoRepository.java`
- Añadir consultas para sumar votos y contar mesas distintas sin cargar los registros.
- Ejemplo: `@Query("SELECT COUNT(DISTINCT r.mesa.id) FROM RegistroVotoRegistraduria r")`
- Ejemplo de agrupación: `@Query("SELECT p.municipio.id, COUNT(DISTINCT r.mesa.id) FROM RegistroVotoRegistraduria r JOIN r.mesa.puesto p GROUP BY p.municipio.id")`

#### [MODIFY] `MesaRepository.java`
- Añadir consultas para contar mesas agrupadas por municipio y por puesto, evitando cargar las relaciones anidadas solo para hacer un `count()`.
- Añadir consultas para obtener estadísticas de cobertura agregadas (mesas verdes, rojas, amarillas agrupadas por ID).

#### [MODIFY] `AsignacionOperarioRepository.java`
- Añadir consultas que devuelvan directamente la cuenta de mesas asignadas por operario, en lugar de descargar todas las asignaciones a la memoria.

### 2. Servicios (Capa de Lógica de Negocio)

#### [MODIFY] `VotosService.java`
- **Refactorizar `obtenerResumenConteo()`:** Se eliminarán los bucles `for (Municipio m : munis)` que hacen `findAll().stream().filter(...)` internamente.
- Se reemplazarán por llamadas a las nuevas funciones de repositorio que devuelven mapas (`Map<Long, Long>`) o proyecciones (`DTOs`) con los totales pre-calculados por la base de datos (PostgreSQL/MySQL/H2).

#### [MODIFY] `DashboardService.java`
- **Refactorizar `getCoberturaMunicipios()` y `getCoberturaPuestos()`:** Actualmente cargan `mesaRepository.findAllWithEagerRelationships()` para luego agruparlas usando el API de Streams de Java. 
- Esto se cambiará por consultas agregadas que devuelvan directamente objetos `CoberturaMunicipioResponse` construidos desde la consulta SQL, reduciendo el tráfico de red con la base de datos de megabytes a unos pocos kilobytes.

---

## Verification Plan

### Automated Tests
- Si existen pruebas unitarias para `DashboardService` o `VotosService`, se ejecutarán para asegurar que los resultados estadísticos de las consultas optimizadas coincidan 100% con los métodos antiguos en memoria.

### Manual Verification
- Compilar y ejecutar el servidor Spring Boot.
- Iniciar sesión en el frontend.
- Cargar la página `/dashboard` y verificar que los números globales y las tablas de cobertura cuadran perfectamente.
- Cargar la página `/control-votos` (pestaña de Estadísticas de Avance) y verificar que los números cuadran y cargan más rápido.
- (Opcional) Revisar los logs de Hibernate (activando `show_sql`) para confirmar que se están ejecutando consultas con `GROUP BY`, `SUM` y `COUNT`, en lugar de cientos de sentencias `SELECT`.
