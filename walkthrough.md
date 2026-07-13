# Migración a Base de Datos Completada

He completado los cambios en el código para que, a partir de ahora, todas las fotos E14 se almacenen como datos binarios en PostgreSQL.

## Cambios Realizados

1. **Entidad `FotoE14`**: Se agregaron los campos `archivoData` (`@Lob byte[]`) y `contentType` para almacenar la información de la imagen/PDF directamente en base de datos.
2. **Servicio `VotosService`**: Se eliminó toda la lógica relacionada con el sistema de archivos local (`Files.write`, `new File()`). Ahora la imagen se inyecta directamente al objeto Java que se guarda en la base de datos.
3. **Controlador `VotosController`**: Ahora el endpoint `/fotos/ver/{id}/archivo` busca los bytes directamente desde PostgreSQL y se los sirve al frontend, en lugar de intentar leer el disco duro.

## Siguientes Pasos

> [!WARNING]
> Dado que cambiamos la estructura de la base de datos (`FotoE14`), es obligatorio que **reinicies el servidor Spring Boot** para que Hibernate detecte los cambios en el código y agregue automáticamente las nuevas columnas a tu tabla PostgreSQL.

1. Reinicia tu servidor Backend (Spring Boot).
2. Entra con el rol de Operario y sube una foto nueva a cualquier mesa.
3. Entra con el rol de Abogado y verifica que puedas ver y descargar esa nueva foto sin problemas.
4. Si quieres limpiar datos antiguos rotos, deberías borrar de tu base de datos los registros viejos en la tabla `fotos_e14` que hacían referencia a la ruta local.
