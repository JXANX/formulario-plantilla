package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.AsignacionResponse;
import com.electoral.testigos.service.AsignacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asignaciones")
@PreAuthorize("isAuthenticated()")
public class AsignacionController {

    @Autowired
    private AsignacionService asignacionService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> obtenerTodas() {
        try {
            List<AsignacionResponse> asignaciones = asignacionService.obtenerTodas();
            return ResponseEntity.ok(new ApiResponse<>(true, "Asignaciones obtenidas", asignaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/operario/{operarioId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OPERARIO')")
    public ResponseEntity<?> obtenerPorOperario(@PathVariable Long operarioId) {
        try {
            List<AsignacionResponse> asignaciones = asignacionService.obtenerPorOperario(operarioId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Asignaciones del operario obtenidas", asignaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> crearAsignacion(
            @RequestParam Long operarioId,
            @RequestParam(required = false) Long puestoId,
            @RequestParam(required = false) Long mesaId) {
        try {
            AsignacionResponse asignacion = asignacionService.crearAsignacion(operarioId, puestoId, mesaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Asignación creada exitosamente", asignacion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> eliminarAsignacion(@PathVariable Long id) {
        try {
            asignacionService.eliminarAsignacion(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Asignación eliminada", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/auto-balance")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> autoBalancear() {
        try {
            asignacionService.autoBalancear();
            return ResponseEntity.ok(new ApiResponse<>(true, "Balanceo automático realizado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/limpiar")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> limpiar() {
        try {
            asignacionService.limpiarAsignaciones();
            return ResponseEntity.ok(new ApiResponse<>(true, "Asignaciones limpiadas correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
