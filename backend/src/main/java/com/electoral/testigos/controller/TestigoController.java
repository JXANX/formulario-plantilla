package com.electoral.testigos.controller;

import com.electoral.testigos.dto.request.TestigoRequest;
import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.TestigoResponse;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.service.TestigoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/testigos")
public class TestigoController {

    @Autowired
    private TestigoService testigoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> listarTestigos() {
        try {
            List<TestigoResponse> testigos = testigoService.obtenerTodosLosTestigos();
            return ResponseEntity.ok(new ApiResponse<>(true, "Listado de testigos obtenido correctamente", testigos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/documento/{documento}")
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> buscarPorDocumento(@PathVariable String documento) {
        try {
            java.util.Optional<Testigo> testigo = testigoService.buscarPorDocumento(documento);
            if (testigo.isPresent()) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Testigo encontrado", testigo.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "Testigo no encontrado", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> registrarTestigo(@Valid @RequestBody TestigoRequest request) {
        try {
            Testigo testigo = testigoService.registrarTestigo(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Testigo registrado correctamente", testigo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> eliminarTestigo(@PathVariable Long id) {
        try {
            testigoService.eliminarTestigo(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Testigo eliminado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> actualizarTestigo(@PathVariable Long id, @Valid @RequestBody TestigoRequest request) {
        try {
            Testigo testigo = testigoService.actualizarTestigo(id, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Testigo actualizado correctamente", testigo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/mover")
    @PreAuthorize("hasAnyRole('COORDINADOR_TESTIGOS', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> moverTestigo(@PathVariable Long id, @RequestParam Long nuevaMesaId) {
        try {
            Testigo testigo = testigoService.moverTestigo(id, nuevaMesaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Testigo reubicado correctamente", testigo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
