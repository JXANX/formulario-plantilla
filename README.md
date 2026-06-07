# Sistema de Gestión de Testigos Electorales - Quindío 2026

Aplicación web profesional para la gestión integral de testigos electorales.

## Arquitectura

- **Backend**: Spring Boot 3, Java 21, Spring Security (JWT), PostgreSQL
- **Frontend**: React, Vite, TypeScript, Material UI (MUI)
- **Infraestructura**: Docker, Docker Compose, Nginx (Proxy)

## Requisitos Previos

- Docker y Docker Compose instalados
- Puertos disponibles: `80` (Frontend), `8080` (Backend), `5432` (PostgreSQL)

## Despliegue con Docker (Monolítico para Producción)

El sistema está configurado para desplegarse fácilmente usando Docker Compose.

1. Navegar al directorio del proyecto:
   ```bash
   cd "C:\Users\JXANX\Desktop\Formulario Plantilla"
   ```

2. Ejecutar Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

Esto levantará los siguientes servicios:
- Base de datos PostgreSQL en el puerto 5432
- API Backend en el puerto 8080
- Frontend y Nginx Proxy en el puerto 80

## Usuarios por Defecto

Al iniciar el sistema por primera vez, se creará automáticamente un usuario administrador:

- **Correo:** admin@electoral.com
- **Contraseña:** Admin123!
- **Rol:** SUPER_ADMIN

## Funcionalidades Principales

1. **Importación Automática**: Carga masiva de la estructura electoral (Departamentos, Municipios, Zonas, Puestos y Mesas) desde el archivo Excel original.
2. **Registro de Testigos**: Formulario dinámico con selectores en cascada y prevención avanzada de duplicados.
3. **Semáforo Electoral**: Indicadores visuales en tiempo real del estado de cobertura de cada mesa (Rojo: 0, Amarillo: 1, Verde: 2+).
4. **Dashboard en Tiempo Real**: Estadísticas generales de cobertura mediante WebSockets.
5. **Exportación Avanzada**: Generación de archivo Excel conservando al 100% el formato, diseño y estructura visual de la plantilla original.
6. **Auditoría Integral**: Registro de todas las acciones de los usuarios en el sistema.

## Backups

Para ejecutar un backup de la base de datos (se mantendrán los últimos 30):
```bash
./backup.sh
```

> **Nota:** Para entornos Linux, puedes añadir el script de backup a crontab para ejecución horaria:
> `0 * * * * /ruta/al/proyecto/backup.sh`
