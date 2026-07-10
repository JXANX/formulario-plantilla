package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.model.TipoVoto;
import com.electoral.testigos.repository.TipoVotoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-voto")
@PreAuthorize("isAuthenticated()")
public class TipoVotoController {

    @Autowired
    private TipoVotoRepository tipoVotoRepository;

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        try {
            List<TipoVoto> tipos = tipoVotoRepository.findAll();
            return ResponseEntity.ok(new ApiResponse<>(true, "Tipos de voto obtenidos", tipos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> crear(@Valid @RequestBody TipoVoto tipoVoto) {
        try {
            tipoVoto.setId(null);
            TipoVoto guardado = tipoVotoRepository.save(tipoVoto);
            return ResponseEntity.ok(new ApiResponse<>(true, "Tipo de voto creado", guardado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody TipoVoto request) {
        try {
            TipoVoto tipoVoto = tipoVotoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Tipo de voto no encontrado"));
            tipoVoto.setNombre(request.getNombre());
            tipoVoto.setCodigo(request.getCodigo());
            tipoVoto.setActivo(request.getActivo() != null ? request.getActivo() : true);
            TipoVoto guardado = tipoVotoRepository.save(tipoVoto);
            return ResponseEntity.ok(new ApiResponse<>(true, "Tipo de voto actualizado", guardado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> desactivar(@PathVariable Long id) {
        try {
            TipoVoto tipoVoto = tipoVotoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Tipo de voto no encontrado"));
            tipoVoto.setActivo(false);
            tipoVotoRepository.save(tipoVoto);
            return ResponseEntity.ok(new ApiResponse<>(true, "Tipo de voto desactivado", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
