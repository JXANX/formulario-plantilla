package com.electoral.testigos.repository;

import com.electoral.testigos.model.Testigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestigoRepository extends JpaRepository<Testigo, Long>, JpaSpecificationExecutor<Testigo> {
    Optional<Testigo> findByDocumento(String documento);
    List<Testigo> findByCelular(String celular);
    List<Testigo> findByCorreo(String correo);
    
    // For fuzzy matching logic
    List<Testigo> findByNombreContainingIgnoreCaseOrPrimerApellidoContainingIgnoreCase(String nombre, String primerApellido);
}
