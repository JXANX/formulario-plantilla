package com.electoral.testigos.service;

import com.electoral.testigos.model.DuplicadoLog;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.repository.DuplicadoLogRepository;
import com.electoral.testigos.repository.TestigoRepository;
import com.electoral.testigos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DuplicadoService {

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private DuplicadoLogRepository duplicadoLogRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public void verificarDuplicadoExacto(String documento) {
        if (testigoRepository.findByDocumento(documento).isPresent()) {
            registrarAlertaDuplicado("DOCUMENTO", documento, "Intento de registro rechazado: Documento ya existe");
            throw new RuntimeException("El documento " + documento + " ya se encuentra registrado.");
        }
    }

    public void verificarDuplicadoMesa(Long mesaId, String documento) {
        Optional<Testigo> existente = testigoRepository.findByDocumento(documento);
        if (existente.isPresent() && existente.get().getMesa().getId().equals(mesaId)) {
            registrarAlertaDuplicado("MESA", documento, "Intento de registro rechazado: Testigo ya está en la misma mesa");
            throw new RuntimeException("El testigo ya se encuentra registrado en esta mesa.");
        }
    }

    public List<Testigo> buscarPosiblesDuplicadosNombre(String nombre, String primerApellido) {
        return testigoRepository.findByNombreContainingIgnoreCaseOrPrimerApellidoContainingIgnoreCase(nombre, primerApellido);
    }

    public void registrarAlertaDuplicado(String tipo, String datosIngresados, String accionTomada) {
        Usuario currentUser = getCurrentUser();
        
        DuplicadoLog log = DuplicadoLog.builder()
                .usuario(currentUser)
                .fecha(LocalDateTime.now())
                .tipoDuplicado(tipo)
                .registroIngresado(datosIngresados)
                .accionTomada(accionTomada)
                .build();
                
        duplicadoLogRepository.save(log);
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
