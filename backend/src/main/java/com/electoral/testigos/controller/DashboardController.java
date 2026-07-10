package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.DashboardStats;
import com.electoral.testigos.dto.response.CoberturaMunicipioResponse;
import com.electoral.testigos.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<?> getGeneralStats() {
        DashboardStats stats = dashboardService.getGeneralStats();
        return ResponseEntity.ok(new ApiResponse<>(true, "Estadísticas obtenidas", stats));
    }

    @GetMapping("/cobertura-municipios")
    public ResponseEntity<?> getCoberturaMunicipios(@RequestParam(required = false) Long departamentoId) {
        List<CoberturaMunicipioResponse> data = dashboardService.getCoberturaMunicipios(departamentoId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cobertura por municipio obtenida", data));
    }

    @GetMapping("/cobertura-puestos")
    public ResponseEntity<?> getCoberturaPuestos(@RequestParam(required = false) Long municipioId) {
        List<com.electoral.testigos.dto.response.CoberturaPuestoResponse> data = dashboardService.getCoberturaPuestos(municipioId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cobertura por puesto obtenida", data));
    }
}
