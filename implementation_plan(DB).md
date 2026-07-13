# Migración de almacenamiento de E14 a PostgreSQL

Actualmente, las fotos E14 se guardan localmente en la carpeta `./uploads/E14`. Esto causa que al reiniciar el servidor en entornos Cloud (como Render o Railway), las fotos desaparezcan ya que los contenedores son efímeros.

Para solucionar esto, migraremos el almacenamiento de las fotos para que los "bytes" se guarden directamente en la base de datos PostgreSQL, lo que garantizará la persistencia y disponibilidad desde cualquier dispositivo.

## User Review Required

> [!WARNING]
> Las fotos que ya se hayan subido anteriormente y que estén guardadas en la carpeta `uploads` no se migrarán automáticamente a la base de datos, por lo que **se perderán (solo las fotos, no los conteos)**. Solo las nuevas fotos que se suban a partir de ahora se guardarán en la base de datos.
>
> ¿Estás de acuerdo con perder el acceso a las imágenes de prueba actuales a cambio de tener la solución definitiva?

## Proposed Changes

### Database Entity

#### [MODIFY] [FotoE14.java](file:///c:/Users/shinm/OneDrive/Escritorio/formulario-plantilla/backend/src/main/java/com/electoral/testigos/model/FotoE14.java)
- Agregar el campo `@Lob private byte[] archivoData;` para guardar los bytes del archivo en PostgreSQL.
- Agregar el campo `private String contentType;` para saber si es un PDF o una imagen JPG.
- Remover el requerimiento de que `rutaArchivo` no sea nulo (o ignorarlo para nuevas inserciones), ya que no usaremos rutas físicas.

### Service Layer

#### [MODIFY] [VotosService.java](file:///c:/Users/shinm/OneDrive/Escritorio/formulario-plantilla/backend/src/main/java/com/electoral/testigos/service/VotosService.java)
- En el método `guardarFotoE14`: Eliminar la lógica de crear carpetas (`dir.mkdirs()`) y escribir en disco (`Files.write`). En su lugar, extraer los bytes del archivo (`file.getBytes()`) y guardarlos directamente en el nuevo campo de la entidad `FotoE14`.
- En el método de obtención (`obtenerArchivoFoto`): Cambiar la firma para que devuelva directamente la entidad `FotoE14` (con sus bytes y `contentType`) en lugar de devolver un objeto `java.io.File`.

### Controller Layer

#### [MODIFY] [VotosController.java](file:///c:/Users/shinm/OneDrive/Escritorio/formulario-plantilla/backend/src/main/java/com/electoral/testigos/controller/VotosController.java)
- Actualizar el endpoint `/fotos/ver/{id}/archivo` para que, en lugar de intentar leer un `FileSystemResource`, devuelva directamente los bytes leídos de la base de datos usando un `ResponseEntity<byte[]>` configurando los headers correctos (`Content-Type` y `Content-Disposition`).

## Verification Plan

### Manual Verification
1. Eliminar una foto de prueba existente e intentar subirla nuevamente.
2. Comprobar que en consola ya no se crean carpetas locales.
3. Previsualizar la foto recién subida tanto desde la PC como desde el celular para comprobar que cargue correctamente y se persista en la base de datos.
