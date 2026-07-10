package com.electoral.testigos.service;

import com.electoral.testigos.dto.request.UsuarioRequest;
import com.electoral.testigos.dto.response.UsuarioResponse;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.model.enums.Rol;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("El correo/usuario ya se encuentra registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        
        String plainPassword = request.getPassword();
        if (plainPassword == null || plainPassword.isBlank()) {
            throw new RuntimeException("La contraseña es obligatoria al crear un usuario");
        }
        usuario.setPassword(passwordEncoder.encode(plainPassword));
        usuario.setRol(Rol.valueOf(request.getRol()));
        usuario.setActivo(request.getActivo() != null ? request.getActivo() : true);

        Usuario saved = usuarioRepository.save(usuario);
        
        auditService.log(AccionAuditoria.CREACION_USUARIO, 
                "Se creó el usuario: " + saved.getCorreo() + " con rol: " + saved.getRol(), 
                "Usuario", saved.getId());

        return mapToResponse(saved);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        // Check unique username if changing
        if (!usuario.getCorreo().equalsIgnoreCase(request.getCorreo()) && 
            usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("El correo/usuario ya se encuentra registrado");
        }

        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setRol(Rol.valueOf(request.getRol()));
        if (request.getActivo() != null) {
            usuario.setActivo(request.getActivo());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Usuario updated = usuarioRepository.save(usuario);

        auditService.log(AccionAuditoria.EDICION_USUARIO, 
                "Se editó el usuario: " + updated.getCorreo(), 
                "Usuario", updated.getId());

        return mapToResponse(updated);
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        // Por seguridad, en vez de borrar físicamente si está asociado a auditorías, lo desactivamos.
        // Pero si el cliente pide "crear/editar/desactivar", simplemente podemos desactivarlo o borrarlo.
        // Desactivémoslo para evitar violaciones de FK en audit_logs.
        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        auditService.log(AccionAuditoria.ELIMINACION_USUARIO, 
                "Se desactivó el usuario: " + usuario.getCorreo(), 
                "Usuario", usuario.getId());
    }

    private UsuarioResponse mapToResponse(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .nombre(u.getNombre())
                .correo(u.getCorreo())
                .rol(u.getRol().name())
                .activo(u.getActivo())
                .build();
    }
}
