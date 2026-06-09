package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.model.Departamento;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Municipio;
import com.electoral.testigos.model.Puesto;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.service.CatalogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    @Autowired
    private CatalogoService catalogoService;

    @GetMapping("/departamentos")
    public ResponseEntity<?> getDepartamentos() {
        List<Departamento> departamentos = catalogoService.getAllDepartamentos();
        return ResponseEntity.ok(new ApiResponse<>(true, "Departamentos obtenidos", departamentos));
    }

    @GetMapping("/departamentos/{id}/municipios")
    public ResponseEntity<?> getMunicipiosByDepartamento(@PathVariable Long id) {
        List<Municipio> municipios = catalogoService.getMunicipiosByDepartamento(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Municipios obtenidos", municipios));
    }

    @GetMapping("/municipios/{id}/puestos")
    public ResponseEntity<?> getPuestosByMunicipio(@PathVariable Long id) {
        List<Puesto> puestos = catalogoService.getPuestosByMunicipio(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Puestos obtenidos", puestos));
    }

    @GetMapping("/puestos/{id}/mesas")
    public ResponseEntity<?> getMesasByPuesto(@PathVariable Long id) {
        List<Mesa> mesas = catalogoService.getMesasByPuesto(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Mesas obtenidas", mesas));
    }

    @PutMapping("/puestos/{puestoId}/coordinador")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> asignarCoordinador(
            @PathVariable Long puestoId,
            @RequestParam(required = false) Long testigoId) {
        try {
            Puesto puesto = catalogoService.asignarCoordinador(puestoId, testigoId);
            // Eagerly initialize lazy properties to avoid LazyInitializationException during JSON writing
            if (puesto.getCoordinador() != null) {
                puesto.getCoordinador().getNombreCompleto(); // triggers load
                if (puesto.getCoordinador().getMesa() != null) {
                    puesto.getCoordinador().getMesa().getNumeroMesa();
                }
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Coordinador asignado exitosamente", puesto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/puestos/{puestoId}/testigos")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getTestigosPorPuesto(@PathVariable Long puestoId) {
        try {
            List<Testigo> testigos = catalogoService.getTestigosPorPuesto(puestoId);
            // Eagerly initialize lazy relationships for serialization
            for (Testigo t : testigos) {
                if (t.getMesa() != null) {
                    t.getMesa().getNumeroMesa();
                }
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Testigos del puesto obtenidos", testigos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
