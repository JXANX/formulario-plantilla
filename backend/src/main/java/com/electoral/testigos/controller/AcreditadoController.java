package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.AcreditadoDashboardStats;
import com.electoral.testigos.dto.response.AcreditadoResponse;
import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.CoberturaMunicipioResponse;
import com.electoral.testigos.dto.response.CoberturaPuestoResponse;
import com.electoral.testigos.service.AcreditadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/acreditados")
public class AcreditadoController {

    @Autowired
    private AcreditadoService acreditadoService;

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> importAcreditados(@RequestParam("file") MultipartFile file) {
        try {
            acreditadoService.importarAcreditados(file.getInputStream());
            return ResponseEntity.ok(new ApiResponse<>(true, "Excel de acreditados importado exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error al importar acreditados: " + e.getMessage(), null));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStats() {
        try {
            AcreditadoDashboardStats stats = acreditadoService.getGeneralStats();
            return ResponseEntity.ok(new ApiResponse<>(true, "Métricas de acreditados obtenidas", stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/cobertura-municipios")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getCoberturaMunicipios(@RequestParam(required = false) Long departamentoId) {
        try {
            List<CoberturaMunicipioResponse> list = acreditadoService.getCoberturaMunicipios(departamentoId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Cobertura de acreditados por municipio obtenida", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/cobertura-puestos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getCoberturaPuestos(@RequestParam(required = false) Long municipioId) {
        try {
            List<CoberturaPuestoResponse> list = acreditadoService.getCoberturaPuestos(municipioId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Cobertura de acreditados por puesto obtenida", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> listarAcreditados() {
        try {
            List<AcreditadoResponse> list = acreditadoService.obtenerTodosLosAcreditados();
            return ResponseEntity.ok(new ApiResponse<>(true, "Listado de acreditados obtenido correctamente", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/comparativa")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getComparativa() {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Comparativa obtenida", acreditadoService.getComparativaTestigos()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/clear")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> limpiarAcreditados() {
        try {
            acreditadoService.limpiarAcreditados();
            return ResponseEntity.ok(new ApiResponse<>(true, "Listado de acreditados borrado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Resource> exportExcel() {
        try {
            File file = acreditadoService.exportarDatos();
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/export-cobertura")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Resource> exportCobertura(@RequestParam(required = false) Long departamentoId) {
        try {
            File file = acreditadoService.exportarCobertura(departamentoId);
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/export-testigos-municipio")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Resource> exportTestigosMunicipio(@RequestParam Long municipioId) {
        try {
            File file = acreditadoService.exportarTestigosPorMunicipio(municipioId);
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
