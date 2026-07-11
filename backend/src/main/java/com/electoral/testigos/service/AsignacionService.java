package com.electoral.testigos.service;

import com.electoral.testigos.dto.response.AsignacionResponse;
import com.electoral.testigos.model.AsignacionOperario;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.model.enums.Rol;
import com.electoral.testigos.repository.AsignacionOperarioRepository;
import com.electoral.testigos.repository.MesaRepository;
import com.electoral.testigos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AsignacionService {

    @Autowired
    private AsignacionOperarioRepository asignacionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Transactional(readOnly = true)
    public List<AsignacionResponse> obtenerTodas() {
        return asignacionRepository.findAllWithEagerRelationships().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsignacionResponse> obtenerPorOperario(Long operarioId) {
        return asignacionRepository.findByOperarioId(operarioId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AsignacionResponse crearAsignacion(Long operarioId, Long puestoId, Long mesaId) {
        Usuario operario = usuarioRepository.findById(operarioId)
                .orElseThrow(() -> new RuntimeException("Usuario operario no encontrado"));
        
        if (operario.getRol() != Rol.OPERARIO) {
            throw new RuntimeException("El usuario seleccionado no tiene rol OPERARIO");
        }

        AsignacionOperario.AsignacionOperarioBuilder builder = AsignacionOperario.builder().operario(operario);

        if (mesaId != null) {
            Mesa mesa = mesaRepository.findById(mesaId)
                    .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
            builder.mesa(mesa);
        } else if (puestoId != null) {
            throw new RuntimeException("Asignación por puesto no implementada directamente, asigne por mesa.");
        }

        AsignacionOperario saved = asignacionRepository.save(builder.build());
        return mapToResponse(saved);
    }

    public AsignacionResponse mapToResponse(AsignacionOperario entity) {
        if (entity == null) return null;

        AsignacionResponse.UsuarioDTO operarioDTO = null;
        if (entity.getOperario() != null) {
            operarioDTO = AsignacionResponse.UsuarioDTO.builder()
                    .id(entity.getOperario().getId())
                    .nombre(entity.getOperario().getNombre())
                    .correo(entity.getOperario().getCorreo())
                    .rol(entity.getOperario().getRol() != null ? entity.getOperario().getRol().name() : null)
                    .build();
        }

        AsignacionResponse.MesaDTO mesaDTO = null;
        if (entity.getMesa() != null) {
            AsignacionResponse.PuestoDTO puestoDTO = null;
            if (entity.getMesa().getPuesto() != null) {
                AsignacionResponse.MunicipioDTO municipioDTO = null;
                if (entity.getMesa().getPuesto().getMunicipio() != null) {
                    municipioDTO = AsignacionResponse.MunicipioDTO.builder()
                            .id(entity.getMesa().getPuesto().getMunicipio().getId())
                            .nombre(entity.getMesa().getPuesto().getMunicipio().getNombre())
                            .build();
                }
                puestoDTO = AsignacionResponse.PuestoDTO.builder()
                        .id(entity.getMesa().getPuesto().getId())
                        .nombrePuesto(entity.getMesa().getPuesto().getNombrePuesto())
                        .municipio(municipioDTO)
                        .build();
            }
            mesaDTO = AsignacionResponse.MesaDTO.builder()
                    .id(entity.getMesa().getId())
                    .numeroMesa(entity.getMesa().getNumeroMesa())
                    .puesto(puestoDTO)
                    .build();
        }

        return AsignacionResponse.builder()
                .id(entity.getId())
                .operario(operarioDTO)
                .mesa(mesaDTO)
                .build();
    }

    @Transactional
    public void eliminarAsignacion(Long id) {
        asignacionRepository.deleteById(id);
    }

    @Transactional
    public void limpiarAsignaciones() {
        asignacionRepository.deleteAll();
    }

    @Transactional
    public void autoBalancear() {
        // 1. Obtener operarios activos
        List<Usuario> operarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == Rol.OPERARIO && u.getActivo())
                .sorted(Comparator.comparing(Usuario::getId))
                .collect(Collectors.toList());

        if (operarios.isEmpty()) {
            throw new RuntimeException("No hay operarios activos registrados en el sistema");
        }

        // 2. Obtener todas las mesas estándar (numeroMesa > 0), con orden geográfico para que queden agrupadas
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        if (mesas.isEmpty()) {
            throw new RuntimeException("No hay mesas registradas en el sistema para balancear");
        }

        // 3. Limpiar asignaciones previas
        asignacionRepository.deleteAll();

        // 4. Distribuir mesas round-robin
        for (int i = 0; i < mesas.size(); i++) {
            Mesa mesa = mesas.get(i);
            Usuario operario = operarios.get(i % operarios.size());

            AsignacionOperario asignacion = AsignacionOperario.builder()
                    .operario(operario)
                    .mesa(mesa)
                    .build();
            asignacionRepository.save(asignacion);
        }
    }
}
