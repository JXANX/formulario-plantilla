package com.electoral.testigos.service;

import com.electoral.testigos.dto.request.TestigoRequest;
import com.electoral.testigos.dto.response.TestigoResponse;
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
import java.util.List;
import java.util.stream.Collectors;

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

    public java.util.Optional<Testigo> buscarPorDocumento(String documento) {
        return testigoRepository.findByDocumento(documento);
    }

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

    @Transactional(readOnly = true)
    public List<TestigoResponse> obtenerTodosLosTestigos() {
        return testigoRepository.findAllWithEagerRelationships().stream()
                .map(t -> {
                    Mesa mesa = t.getMesa();
                    String deptoNombre = "";
                    Long deptoId = null;
                    String mpioNombre = "";
                    Long mpioId = null;
                    String puestoNombre = "";
                    Long puestoId = null;
                    
                    if (mesa != null && mesa.getPuesto() != null) {
                        puestoNombre = mesa.getPuesto().getNombrePuesto();
                        puestoId = mesa.getPuesto().getId();
                        if (mesa.getPuesto().getMunicipio() != null) {
                            mpioNombre = mesa.getPuesto().getMunicipio().getNombre();
                            mpioId = mesa.getPuesto().getMunicipio().getId();
                            if (mesa.getPuesto().getMunicipio().getDepartamento() != null) {
                                deptoNombre = mesa.getPuesto().getMunicipio().getDepartamento().getNombre();
                                deptoId = mesa.getPuesto().getMunicipio().getDepartamento().getId();
                            }
                        }
                    }
                    
                    String registradoPor = t.getUsuarioRegistro() != null ? t.getUsuarioRegistro().getNombre() : "Sistema";

                    return TestigoResponse.builder()
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
                            .puestoId(puestoId)
                            .nombrePuesto(puestoNombre)
                            .municipioId(mpioId)
                            .nombreMunicipio(mpioNombre)
                            .departamentoId(deptoId)
                            .nombreDepartamento(deptoNombre)
                            .registradoPor(registradoPor)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarTestigo(Long id) {
        Testigo testigo = testigoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testigo no encontrado"));

        Mesa mesa = testigo.getMesa();
        if (mesa != null) {
            mesa.setOcupados(Math.max(0, mesa.getOcupados() - 1));
            mesaRepository.save(mesa);
        }

        testigoRepository.delete(testigo);

        // Auditoría
        auditService.log(AccionAuditoria.ELIMINACION_TESTIGO, 
                "Testigo eliminado: " + testigo.getDocumento(), "Testigo", id);

        // Notificaciones WebSocket
        if (mesa != null) {
            wsNotificationService.notificarCambioMesa(mesa.getId(), mesa.getEstadoSemaforo());
        }
        wsNotificationService.notificarDashboardUpdate();
    }

    @Transactional
    public Testigo moverTestigo(Long id, Long nuevaMesaId) {
        Testigo testigo = testigoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testigo no encontrado"));

        Mesa oldMesa = testigo.getMesa();
        Mesa newMesa = mesaRepository.findById(nuevaMesaId)
                .orElseThrow(() -> new RuntimeException("Mesa destino no encontrada"));

        if (oldMesa != null && oldMesa.getId().equals(newMesa.getId())) {
            return testigo; // Ya está en esa mesa
        }

        if (!newMesa.tieneDisponibilidad()) {
            throw new RuntimeException("La mesa destino ya alcanzó su capacidad máxima.");
        }

        // Decrementar en la mesa vieja
        if (oldMesa != null) {
            oldMesa.setOcupados(Math.max(0, oldMesa.getOcupados() - 1));
            mesaRepository.save(oldMesa);
        }

        // Incrementar en la mesa nueva
        newMesa.setOcupados(newMesa.getOcupados() + 1);
        mesaRepository.save(newMesa);

        testigo.setMesa(newMesa);
        testigo = testigoRepository.save(testigo);

        // Auditoría
        auditService.log(AccionAuditoria.EDICION_TESTIGO, 
                "Testigo movido: " + testigo.getDocumento() + " a mesa " + newMesa.getNumeroMesa(), "Testigo", id);

        // Notificaciones WebSocket
        if (oldMesa != null) {
            wsNotificationService.notificarCambioMesa(oldMesa.getId(), oldMesa.getEstadoSemaforo());
        }
        wsNotificationService.notificarCambioMesa(newMesa.getId(), newMesa.getEstadoSemaforo());
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
