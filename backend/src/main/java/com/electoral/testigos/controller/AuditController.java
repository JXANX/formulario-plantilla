package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.AuditLogResponse;
import com.electoral.testigos.model.AuditLog;
import com.electoral.testigos.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getLogs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> logs = auditLogRepository.findAllWithUsuario(pageable);

            List<AuditLogResponse> data = logs.getContent().stream()
                    .map(l -> AuditLogResponse.builder()
                            .id(l.getId())
                            .accion(l.getAccion() != null ? l.getAccion().name() : "")
                            .detalle(l.getDetalle())
                            .entidad(l.getEntidad())
                            .entidadId(l.getEntidadId())
                            .fecha(l.getFecha())
                            .usuario(l.getUsuario() != null ? l.getUsuario().getNombre() : "Sistema")
                            .ip(l.getIp())
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>(true, "Logs obtenidos", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
