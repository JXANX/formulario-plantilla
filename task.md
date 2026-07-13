# Tareas de Migración a DB (E14)

- [x] Modificar entidad `FotoE14.java`
  - Agregar `@Lob byte[] archivoData`
  - Agregar `String contentType`
- [x] Modificar `VotosService.java`
  - Cambiar `guardarFotoE14` para guardar en DB
  - Cambiar `obtenerArchivoFoto` a `obtenerFotoEntity`
- [x] Modificar `VotosController.java`
  - Cambiar respuesta de `verArchivoFoto` a `ResponseEntity<byte[]>`
- [ ] Validar compilación
