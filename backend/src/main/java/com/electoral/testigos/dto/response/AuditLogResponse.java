package com.electoral.testigos.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {
    private Long id;
    private String accion;
    private String detalle;
    private String entidad;
    private Long entidadId;
    private LocalDateTime fecha;
    private String usuario;
    private String ip;
}
