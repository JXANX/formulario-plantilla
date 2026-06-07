package com.electoral.testigos.service;

import com.electoral.testigos.model.AuditLog;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.AuditLogRepository;
import com.electoral.testigos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public void log(AccionAuditoria accion, String detalle, String entidad, Long entidadId) {
        Usuario currentUser = getCurrentUser();
        String ipAddress = getClientIp();

        AuditLog log = AuditLog.builder()
                .usuario(currentUser)
                .fecha(LocalDateTime.now())
                .ip(ipAddress)
                .accion(accion)
                .detalle(detalle)
                .entidad(entidad)
                .entidadId(entidadId)
                .build();

        auditLogRepository.save(log);
    }

    private Usuario getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String correo = auth.getName();
            return usuarioRepository.findByCorreo(correo).orElse(null);
        }
        return null;
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(",")[0];
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
