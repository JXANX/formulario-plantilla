package com.electoral.testigos.service;

import com.electoral.testigos.dto.request.TestigoRequest;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.MesaRepository;
import com.electoral.testigos.repository.TestigoRepository;
import com.electoral.testigos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TestigoService {

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private DuplicadoService duplicadoService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private WebSocketNotificationService wsNotificationService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public Testigo registrarTestigo(TestigoRequest request) {
        // Validar duplicados
        duplicadoService.verificarDuplicadoExacto(request.getDocumento());
        duplicadoService.verificarDuplicadoMesa(request.getMesaId(), request.getDocumento());

        // Obtener mesa y validar capacidad
        Mesa mesa = mesaRepository.findById(request.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        if (!mesa.tieneDisponibilidad()) {
            throw new RuntimeException("La mesa seleccionada ya alcanzó su capacidad máxima de testigos.");
        }

        Usuario currentUser = getCurrentUser();

        // Crear testigo
        Testigo testigo = Testigo.builder()
                .documento(request.getDocumento())
                .nombre(request.getNombre().trim().toUpperCase())
                .segundoNombre(request.getSegundoNombre() != null ? request.getSegundoNombre().trim().toUpperCase() : null)
                .primerApellido(request.getPrimerApellido().trim().toUpperCase())
                .segundoApellido(request.getSegundoApellido() != null ? request.getSegundoApellido().trim().toUpperCase() : null)
                .celular(request.getCelular())
                .correo(request.getCorreo())
                .tipoTestigo(request.getTipoTestigo())
                .mesa(mesa)
                .nombreOrganizacion("Grupo Significativo de Ciudadanos Defensores de la Patria") // Default for now
                .fechaRegistro(LocalDateTime.now())
                .usuarioRegistro(currentUser)
                .build();

        testigo = testigoRepository.save(testigo);

        // Actualizar ocupación de mesa
        mesa.setOcupados(mesa.getOcupados() + 1);
        mesaRepository.save(mesa);

        // Auditoría
        auditService.log(AccionAuditoria.REGISTRO_TESTIGO, 
                "Testigo registrado: " + testigo.getDocumento(), "Testigo", testigo.getId());

        // Notificaciones WebSocket
        wsNotificationService.notificarCambioMesa(mesa.getId(), mesa.getEstadoSemaforo());
        wsNotificationService.notificarNuevoTestigo(mesa.getPuesto().getMunicipio().getNombre(), mesa.getPuesto().getNombrePuesto());
        wsNotificationService.notificarDashboardUpdate();

        return testigo;
    }

    private Usuario getCurrentUser() {
        try {
            String correo = SecurityContextHolder.getContext().getAuthentication().getName();
            return usuarioRepository.findByCorreo(correo).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
