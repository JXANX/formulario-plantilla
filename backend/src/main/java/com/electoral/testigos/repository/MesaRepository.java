package com.electoral.testigos.repository;

import com.electoral.testigos.model.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MesaRepository extends JpaRepository<Mesa, Long> {
    List<Mesa> findByPuestoId(Long puestoId);
    Optional<Mesa> findByPuestoIdAndNumeroMesa(Long puestoId, Integer numeroMesa);
    
    @Query("SELECT COUNT(m) FROM Mesa m WHERE m.ocupados = 0")
    long countMesasRojas();
    
    @Query("SELECT COUNT(m) FROM Mesa m WHERE m.ocupados = 1")
    long countMesasAmarillas();
    
    @Query("SELECT COUNT(m) FROM Mesa m WHERE m.ocupados >= m.capacidad")
    long countMesasVerdes();

    @Query("SELECT m FROM Mesa m " +
           "LEFT JOIN FETCH m.puesto p " +
           "LEFT JOIN FETCH p.municipio mu " +
           "LEFT JOIN FETCH mu.departamento d " +
           "ORDER BY d.codigoDepartamento, mu.codigoMunicipio, p.codigoPuesto, p.zona, m.numeroMesa")
    List<Mesa> findAllWithEagerRelationships();

    @Query("SELECT DISTINCT m FROM Mesa m " +
           "JOIN FETCH m.puesto p " +
           "LEFT JOIN FETCH m.testigos t " +
           "WHERE p.municipio.id = :municipioId")
    List<Mesa> findByMunicipioIdWithEagerRelationships(@Param("municipioId") Long municipioId);
}
