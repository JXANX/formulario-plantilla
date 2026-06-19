package com.electoral.testigos.repository;

import com.electoral.testigos.model.Acreditado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcreditadoRepository extends JpaRepository<Acreditado, Long> {
    Optional<Acreditado> findByDocumento(String documento);
    List<Acreditado> findByMesaId(Long mesaId);

    @Query("SELECT a FROM Acreditado a " +
           "LEFT JOIN FETCH a.mesa m " +
           "LEFT JOIN FETCH m.puesto p " +
           "LEFT JOIN FETCH p.municipio mu " +
           "LEFT JOIN FETCH mu.departamento d " +
           "ORDER BY d.codigoDepartamento, mu.codigoMunicipio, p.codigoPuesto, p.zona, m.numeroMesa")
    List<Acreditado> findAllWithEagerRelationships();

    @Query("SELECT a FROM Acreditado a " +
           "JOIN FETCH a.mesa m " +
           "JOIN FETCH m.puesto p " +
           "WHERE p.municipio.id = :municipioId")
    List<Acreditado> findByMunicipioIdWithEagerRelationships(@Param("municipioId") Long municipioId);
}
