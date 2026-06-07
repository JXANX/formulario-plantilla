package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.model.Departamento;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Municipio;
import com.electoral.testigos.model.Puesto;
import com.electoral.testigos.service.CatalogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
