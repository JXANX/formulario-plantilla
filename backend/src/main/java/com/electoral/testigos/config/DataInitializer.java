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
        patricia.setRol(Rol.ADMIN);
        patricia.setActivo(true);
        usuarioRepository.save(patricia);
        logger.info("Usuario ADMIN Patricia inicializado/actualizado");

        // 2. Angela (Admin normal 2)
        Usuario angela = usuarioRepository.findByCorreo("Angela").orElseGet(() -> {
            Usuario u = new Usuario();
            u.setCorreo("Angela");
            return u;
        });
        angela.setNombre("Angela");
        angela.setPassword(passwordEncoder.encode("Angela.Electoral"));
        angela.setRol(Rol.ADMIN);
        angela.setActivo(true);
        usuarioRepository.save(angela);
        logger.info("Usuario ADMIN Angela inicializado/actualizado");

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
    }
}

