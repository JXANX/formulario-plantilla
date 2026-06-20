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
            List<com.electoral.testigos.dto.response.TestigoResponse> responses = testigos.stream()
                .map(t -> {
                    Mesa mesa = t.getMesa();
                    return com.electoral.testigos.dto.response.TestigoResponse.builder()
                            .id(t.getId())
                            .documento(t.getDocumento())
                            .nombre(t.getNombre())
                            .segundoNombre(t.getSegundoNombre())
                            .primerApellido(t.getPrimerApellido())
                            .segundoApellido(t.getSegundoApellido())
                            .nombreCompleto(t.getNombreCompleto())
                            .celular(t.getCelular())
                            .correo(t.getCorreo())
                            .nombreOrganizacion(t.getNombreOrganizacion())
                            .tipoTestigo(t.getTipoTestigo())
                            .fechaRegistro(t.getFechaRegistro())
                            .mesaId(mesa != null ? mesa.getId() : null)
                            .numeroMesa(mesa != null ? mesa.getNumeroMesa() : null)
                            .puestoId(mesa != null && mesa.getPuesto() != null ? mesa.getPuesto().getId() : null)
                            .nombrePuesto(mesa != null && mesa.getPuesto() != null ? mesa.getPuesto().getNombrePuesto() : "")
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "Testigos del puesto obtenidos", responses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    @PutMapping("/puestos/{puestoId}/coordinador-acreditado")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> asignarCoordinadorAcreditado(
            @PathVariable Long puestoId,
            @RequestParam(required = false) Long acreditadoId) {
        try {
            Puesto puesto = catalogoService.asignarCoordinadorAcreditado(puestoId, acreditadoId);
            if (puesto.getCoordinadorAcreditado() != null) {
                puesto.getCoordinadorAcreditado().getNombreCompleto(); // triggers load
                if (puesto.getCoordinadorAcreditado().getMesa() != null) {
                    puesto.getCoordinadorAcreditado().getMesa().getNumeroMesa();
                }
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Coordinador Acreditado asignado exitosamente", puesto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/puestos/{puestoId}/acreditados")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getAcreditadosPorPuesto(@PathVariable Long puestoId) {
        try {
            List<com.electoral.testigos.model.Acreditado> acreditados = catalogoService.getAcreditadosPorPuesto(puestoId);
            List<com.electoral.testigos.dto.response.TestigoResponse> responses = acreditados.stream()
                .map(a -> {
                    Mesa mesa = a.getMesa();
                    return com.electoral.testigos.dto.response.TestigoResponse.builder()
                            .id(a.getId())
                            .documento(a.getDocumento())
                            .nombreCompleto(a.getNombreCompleto())
                            .celular(a.getCelular())
                            .correo(a.getCorreo())
                            .nombreOrganizacion(a.getNombreOrganizacion())
                            .tipoTestigo(a.getTipoTestigo())
                            .fechaRegistro(a.getFechaRegistro())
                            .mesaId(mesa != null ? mesa.getId() : null)
                            .numeroMesa(mesa != null ? mesa.getNumeroMesa() : null)
                            .puestoId(mesa != null && mesa.getPuesto() != null ? mesa.getPuesto().getId() : null)
                            .nombrePuesto(mesa != null && mesa.getPuesto() != null ? mesa.getPuesto().getNombrePuesto() : "")
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "Acreditados del puesto obtenidos", responses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
