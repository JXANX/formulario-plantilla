package com.electoral.testigos.controller;

import com.electoral.testigos.dto.request.UsuarioRequest;
import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.UsuarioResponse;
import com.electoral.testigos.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<UsuarioResponse> usuarios = usuarioService.obtenerTodos();
            return ResponseEntity.ok(new ApiResponse<>(true, "Usuarios obtenidos exitosamente", usuarios));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody UsuarioRequest request) {
        try {
            UsuarioResponse creado = usuarioService.crear(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Usuario creado exitosamente", creado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest request) {
        try {
            UsuarioResponse actualizado = usuarioService.actualizar(id, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Usuario actualizado exitosamente", actualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            usuarioService.eliminar(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Usuario desactivado exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
