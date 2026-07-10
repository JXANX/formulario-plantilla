package com.electoral.testigos.config;

import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.model.enums.Rol;
import com.electoral.testigos.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Desactivar el antiguo admin@electoral.com si existe (no se puede borrar por FK en audit_logs)
        usuarioRepository.findByCorreo("admin@electoral.com").ifPresent(admin -> {
            admin.setActivo(false);
            usuarioRepository.save(admin);
            logger.info("Usuario antiguo admin@electoral.com desactivado");
        });

        // 1. Patricia (Admin normal 1)
        Usuario patricia = usuarioRepository.findByCorreo("Patricia").orElseGet(() -> {
            Usuario u = new Usuario();
            u.setCorreo("Patricia");
            return u;
        });
        patricia.setNombre("Patricia");
        patricia.setPassword(passwordEncoder.encode("Patricia.Electoral"));
        patricia.setRol(Rol.COORDINADOR_TESTIGOS);
        patricia.setActivo(true);
        usuarioRepository.save(patricia);
        logger.info("Usuario COORDINADOR_TESTIGOS Patricia inicializado/actualizado");

        // 2. Angela (Admin normal 2)
        Usuario angela = usuarioRepository.findByCorreo("Angela").orElseGet(() -> {
            Usuario u = new Usuario();
            u.setCorreo("Angela");
            return u;
        });
        angela.setNombre("Angela");
        angela.setPassword(passwordEncoder.encode("Angela.Electoral"));
        angela.setRol(Rol.COORDINADOR_TESTIGOS);
        angela.setActivo(true);
        usuarioRepository.save(angela);
        logger.info("Usuario COORDINADOR_TESTIGOS Angela inicializado/actualizado");

        // 3. AdminSuperior (Admin superior)
        Usuario adminSuperior = usuarioRepository.findByCorreo("AdminSuperior").orElseGet(() -> {
            Usuario u = new Usuario();
            u.setCorreo("AdminSuperior");
            return u;
        });
        adminSuperior.setNombre("AdminSuperior");
        adminSuperior.setPassword(passwordEncoder.encode("AdminJSD"));
        adminSuperior.setRol(Rol.SUPER_ADMIN);
        adminSuperior.setActivo(true);
        usuarioRepository.save(adminSuperior);
        logger.info("Usuario SUPER_ADMIN AdminSuperior inicializado/actualizado");

        // 4. Seed Tipos de Voto
        seedTiposVoto();

        // 5. Seed Candidatos
        seedCandidatos();
    }

    @Autowired
    private com.electoral.testigos.repository.TipoVotoRepository tipoVotoRepository;

    @Autowired
    private com.electoral.testigos.repository.CandidatoRepository candidatoRepository;

    private void seedTiposVoto() {
        if (tipoVotoRepository.count() == 0) {
            tipoVotoRepository.save(com.electoral.testigos.model.TipoVoto.builder().nombre("Voto por Candidato").codigo("CANDIDATO").activo(true).build());
            tipoVotoRepository.save(com.electoral.testigos.model.TipoVoto.builder().nombre("Voto en Blanco").codigo("BLANCO").activo(true).build());
            tipoVotoRepository.save(com.electoral.testigos.model.TipoVoto.builder().nombre("Voto Nulo").codigo("NULO").activo(true).build());
            tipoVotoRepository.save(com.electoral.testigos.model.TipoVoto.builder().nombre("Voto no Marcado").codigo("NO_MARCADO").activo(true).build());
            logger.info("Tipos de voto predeterminados creados");
        }
    }

    private void seedCandidatos() {
        if (candidatoRepository.count() == 0) {
            candidatoRepository.save(com.electoral.testigos.model.Candidato.builder().nombre("Juan Carlos Giraldo").partido("Pacto Histórico").numeroTarjeton(1).activo(true).build());
            candidatoRepository.save(com.electoral.testigos.model.Candidato.builder().nombre("María Elena Restrepo").partido("Partido Liberal").numeroTarjeton(2).activo(true).build());
            candidatoRepository.save(com.electoral.testigos.model.Candidato.builder().nombre("Andrés Felipe Uribe").partido("Partido Conservador").numeroTarjeton(3).activo(true).build());
            candidatoRepository.save(com.electoral.testigos.model.Candidato.builder().nombre("Soraya Helena Toro").partido("Centro Democrático").numeroTarjeton(4).activo(true).build());
            logger.info("Candidatos predeterminados creados");
        }
    }
}

