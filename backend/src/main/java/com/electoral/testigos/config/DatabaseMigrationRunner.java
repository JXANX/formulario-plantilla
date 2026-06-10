package com.electoral.testigos.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Corrige el CHECK CONSTRAINT de audit_logs.accion para incluir todos los
 * valores actuales del enum AccionAuditoria.
 * Hibernate ddl-auto=update NO modifica constraints existentes, así que
 * este runner lo hace manualmente al arrancar la aplicación.
 */
@Component
@Order(1)
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String[] ACCIONES = {
        "LOGIN", "LOGOUT",
        "REGISTRO_TESTIGO", "EDICION_TESTIGO", "ELIMINACION_TESTIGO", "TRASLADO_TESTIGO",
        "EXPORTACION_EXCEL", "IMPORTACION_EXCEL",
        "CREACION_USUARIO", "EDICION_USUARIO", "ELIMINACION_USUARIO",
        "DUPLICADO_DETECTADO"
    };

    @Override
    public void run(ApplicationArguments args) {
        try {
            // 1. Drop constraint si existe
            jdbcTemplate.execute(
                "ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_accion_check"
            );

            // 2. Construir lista de valores para el nuevo constraint
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < ACCIONES.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append("'").append(ACCIONES[i]).append("'");
            }

            // 3. Recrear constraint con todos los valores actuales
            String sql = "ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_accion_check " +
                         "CHECK (accion IN (" + sb + "))";
            jdbcTemplate.execute(sql);

            log.info("✔ audit_logs_accion_check constraint actualizado correctamente");
        } catch (Exception e) {
            log.warn("No se pudo actualizar audit_logs_accion_check: {}", e.getMessage());
        }
    }
}
