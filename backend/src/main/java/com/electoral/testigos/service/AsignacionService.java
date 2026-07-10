package com.electoral.testigos.service;

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
    public List<AsignacionOperario> obtenerTodas() {
        return asignacionRepository.findAllWithEagerRelationships();
    }

    @Transactional(readOnly = true)
    public List<AsignacionOperario> obtenerPorOperario(Long operarioId) {
        return asignacionRepository.findByOperarioId(operarioId);
    }

    @Transactional
    public AsignacionOperario crearAsignacion(Long operarioId, Long puestoId, Long mesaId) {
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

        return asignacionRepository.save(builder.build());
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
