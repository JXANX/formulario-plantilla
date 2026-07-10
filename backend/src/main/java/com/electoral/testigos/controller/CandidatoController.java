package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.model.Candidato;
import com.electoral.testigos.repository.CandidatoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatos")
@PreAuthorize("isAuthenticated()")
public class CandidatoController {

    @Autowired
    private CandidatoRepository candidatoRepository;

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        try {
            List<Candidato> candidatos = candidatoRepository.findAll();
            return ResponseEntity.ok(new ApiResponse<>(true, "Candidatos obtenidos", candidatos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> crear(@Valid @RequestBody Candidato candidato) {
        try {
            candidato.setId(null);
            Candidato guardado = candidatoRepository.save(candidato);
            return ResponseEntity.ok(new ApiResponse<>(true, "Candidato creado", guardado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody Candidato request) {
        try {
            Candidato candidato = candidatoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Candidato no encontrado"));
            candidato.setNombre(request.getNombre());
            candidato.setPartido(request.getPartido());
            candidato.setNumeroTarjeton(request.getNumeroTarjeton());
            candidato.setActivo(request.getActivo() != null ? request.getActivo() : true);
            Candidato guardado = candidatoRepository.save(candidato);
            return ResponseEntity.ok(new ApiResponse<>(true, "Candidato actualizado", guardado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> desactivar(@PathVariable Long id) {
        try {
            Candidato candidato = candidatoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Candidato no encontrado"));
            candidato.setActivo(false);
            candidatoRepository.save(candidato);
            return ResponseEntity.ok(new ApiResponse<>(true, "Candidato desactivado", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
