package com.electoral.testigos.repository;

import com.electoral.testigos.model.Testigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
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

    @Query("SELECT t FROM Testigo t WHERE " +
           "UPPER(TRIM(t.nombre)) = UPPER(:nombre) AND " +
           "COALESCE(UPPER(TRIM(t.segundoNombre)), '') = UPPER(:segundoNombre) AND " +
           "UPPER(TRIM(t.primerApellido)) = UPPER(:primerApellido) AND " +
           "COALESCE(UPPER(TRIM(t.segundoApellido)), '') = UPPER(:segundoApellido)")
    List<Testigo> findByNombreCompletoExacto(@org.springframework.data.repository.query.Param("nombre") String nombre,
                                             @org.springframework.data.repository.query.Param("segundoNombre") String segundoNombre,
                                             @org.springframework.data.repository.query.Param("primerApellido") String primerApellido,
                                             @org.springframework.data.repository.query.Param("segundoApellido") String segundoApellido);

    @Query("SELECT t FROM Testigo t " +
           "LEFT JOIN FETCH t.usuarioRegistro " +
           "LEFT JOIN FETCH t.mesa m " +
           "LEFT JOIN FETCH m.puesto p " +
           "LEFT JOIN FETCH p.municipio mu " +
           "LEFT JOIN FETCH mu.departamento d")
    List<Testigo> findAllWithEagerRelationships();

    @Query("SELECT t FROM Testigo t " +
           "LEFT JOIN FETCH t.mesa m " +
           "LEFT JOIN FETCH m.puesto p " +
           "WHERE p.id = :puestoId")
    List<Testigo> findByPuestoId(@org.springframework.data.repository.query.Param("puestoId") Long puestoId);
    @Query("SELECT t FROM Testigo t " +
           "LEFT JOIN FETCH t.mesa m " +
           "LEFT JOIN FETCH m.puesto p " +
           "LEFT JOIN FETCH p.municipio mu " +
           "LEFT JOIN FETCH mu.departamento d " +
           "WHERE mu.id = :municipioId " +
           "ORDER BY p.nombrePuesto, m.numeroMesa")
    List<Testigo> findByMunicipioId(@org.springframework.data.repository.query.Param("municipioId") Long municipioId);
}
