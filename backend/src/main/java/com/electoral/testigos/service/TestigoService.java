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

    @Autowired private TestigoRepository testigoRepository;
    @Autowired private MesaRepository mesaRepository;
    @Autowired private DuplicadoService duplicadoService;
    @Autowired private AuditService auditService;
    @Autowired private WebSocketNotificationService wsNotificationService;
    @Autowired private UsuarioRepository usuarioRepository;

    public java.util.Optional<Testigo> buscarPorDocumento(String documento) {
        return testigoRepository.findByDocumento(documento);
    }

    @Transactional
    public Testigo registrarTestigo(TestigoRequest request) {
        duplicadoService.verificarDuplicadoExacto(request.getDocumento());
        duplicadoService.verificarDuplicadoMesa(request.getMesaId(), request.getDocumento());

        Mesa mesa = mesaRepository.findById(request.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        if (!mesa.tieneDisponibilidad()) {
            throw new RuntimeException("La mesa seleccionada ya alcanzó su capacidad máxima de testigos.");
        }

        Usuario currentUser = getCurrentUser();

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
                .nombreOrganizacion("Grupo Significativo de Ciudadanos Defensores de la Patria")
                .fechaRegistro(LocalDateTime.now())
                .usuarioRegistro(currentUser)
                .build();

        testigo = testigoRepository.save(testigo);

        mesa.setOcupados(mesa.getOcupados() + 1);
        mesaRepository.save(mesa);

        auditService.log(AccionAuditoria.REGISTRO_TESTIGO,
                "Testigo registrado: " + testigo.getDocumento() + " — " + testigo.getNombreCompleto()
                + " en Mesa " + mesa.getNumeroMesa() + " (" + mesa.getPuesto().getNombrePuesto() + ")",
                "Testigo", testigo.getId());

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
                    String deptoNombre = ""; Long deptoId = null;
                    String mpioNombre  = ""; Long mpioId  = null;
                    String puestoNombre= ""; Long puestoId= null;

                    if (mesa != null && mesa.getPuesto() != null) {
                        puestoNombre = mesa.getPuesto().getNombrePuesto();
                        puestoId     = mesa.getPuesto().getId();
                        if (mesa.getPuesto().getMunicipio() != null) {
                            mpioNombre = mesa.getPuesto().getMunicipio().getNombre();
                            mpioId     = mesa.getPuesto().getMunicipio().getId();
                            if (mesa.getPuesto().getMunicipio().getDepartamento() != null) {
                                deptoNombre = mesa.getPuesto().getMunicipio().getDepartamento().getNombre();
                                deptoId     = mesa.getPuesto().getMunicipio().getDepartamento().getId();
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
        String mesaInfo = mesa != null
                ? "Mesa " + mesa.getNumeroMesa() + " (" + mesa.getPuesto().getNombrePuesto() + ")"
                : "sin mesa";

        if (mesa != null) {
            mesa.setOcupados(Math.max(0, mesa.getOcupados() - 1));
            mesaRepository.save(mesa);
        }

        String docNombre = testigo.getDocumento() + " — " + testigo.getNombreCompleto();
        testigoRepository.delete(testigo);

        auditService.log(AccionAuditoria.ELIMINACION_TESTIGO,
                "Testigo eliminado: " + docNombre + " | Ubicación: " + mesaInfo,
                "Testigo", id);

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
            return testigo;
        }

        if (!newMesa.tieneDisponibilidad()) {
            throw new RuntimeException("La mesa destino ya alcanzó su capacidad máxima.");
        }

        String origenDesc = oldMesa != null
                ? "Mesa " + oldMesa.getNumeroMesa() + " (" + oldMesa.getPuesto().getNombrePuesto() + ")"
                : "sin mesa";
        String destinoDesc = "Mesa " + newMesa.getNumeroMesa()
                + " (" + newMesa.getPuesto().getNombrePuesto() + ", "
                + newMesa.getPuesto().getMunicipio().getNombre() + ")";

        if (oldMesa != null) {
            oldMesa.setOcupados(Math.max(0, oldMesa.getOcupados() - 1));
            mesaRepository.save(oldMesa);
        }

        newMesa.setOcupados(newMesa.getOcupados() + 1);
        mesaRepository.save(newMesa);

        testigo.setMesa(newMesa);
        testigo = testigoRepository.save(testigo);

        auditService.log(AccionAuditoria.TRASLADO_TESTIGO,
                "Testigo " + testigo.getDocumento() + " — " + testigo.getNombreCompleto()
                + " | De: " + origenDesc + " → A: " + destinoDesc,
                "Testigo", id);

        if (oldMesa != null) {
            wsNotificationService.notificarCambioMesa(oldMesa.getId(), oldMesa.getEstadoSemaforo());
        }
        wsNotificationService.notificarCambioMesa(newMesa.getId(), newMesa.getEstadoSemaforo());
        wsNotificationService.notificarDashboardUpdate();
        return testigo;
    }

    @Transactional
    public Testigo actualizarTestigo(Long id, TestigoRequest request) {
        Testigo testigo = testigoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testigo no encontrado"));

        // Solo valida duplicado de documento si cambió
        if (!testigo.getDocumento().equals(request.getDocumento())) {
            duplicadoService.verificarDuplicadoExacto(request.getDocumento());
        }

        String cambios = buildCambiosDesc(testigo, request);

        testigo.setDocumento(request.getDocumento());
        testigo.setNombre(request.getNombre().trim().toUpperCase());
        testigo.setSegundoNombre(request.getSegundoNombre() != null ? request.getSegundoNombre().trim().toUpperCase() : null);
        testigo.setPrimerApellido(request.getPrimerApellido().trim().toUpperCase());
        testigo.setSegundoApellido(request.getSegundoApellido() != null ? request.getSegundoApellido().trim().toUpperCase() : null);
        testigo.setCelular(request.getCelular());
        testigo.setCorreo(request.getCorreo());
        testigo.setTipoTestigo(request.getTipoTestigo());

        testigo = testigoRepository.save(testigo);

        auditService.log(AccionAuditoria.EDICION_TESTIGO,
                "Testigo editado: " + testigo.getDocumento() + " — " + testigo.getNombreCompleto()
                + (cambios.isEmpty() ? "" : " | Cambios: " + cambios),
                "Testigo", id);

        wsNotificationService.notificarDashboardUpdate();
        return testigo;
    }

    private String buildCambiosDesc(Testigo t, TestigoRequest r) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        if (!t.getDocumento().equals(r.getDocumento()))
            parts.add("doc: " + t.getDocumento() + "→" + r.getDocumento());
        if (!t.getCelular().equals(r.getCelular()))
            parts.add("cel: " + t.getCelular() + "→" + r.getCelular());
        if (t.getTipoTestigo() != r.getTipoTestigo())
            parts.add("tipo: " + t.getTipoTestigo() + "→" + r.getTipoTestigo());
        return String.join(", ", parts);
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