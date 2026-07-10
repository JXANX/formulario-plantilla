package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.distribucion.DistribucionMunicipioResponse;
import com.electoral.testigos.service.DistribucionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/distribucion")
public class DistribucionController {

    @Autowired
    private DistribucionService distribucionService;

    @GetMapping("/municipio/{municipioId}")
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getDistribucionByMunicipio(@PathVariable Long municipioId) {
        try {
            DistribucionMunicipioResponse response = distribucionService.getDistribucion(municipioId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Datos de distribución obtenidos", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
