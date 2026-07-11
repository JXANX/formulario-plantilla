package com.electoral.testigos.repository;

import com.electoral.testigos.model.AsignacionOperario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignacionOperarioRepository extends JpaRepository<AsignacionOperario, Long> {
    @Query("SELECT a FROM AsignacionOperario a " +
           "LEFT JOIN FETCH a.operario " +
           "LEFT JOIN FETCH a.puesto p " +
           "LEFT JOIN FETCH a.mesa m " +
           "LEFT JOIN FETCH m.puesto mp " +
           "LEFT JOIN FETCH mp.municipio " +
           "WHERE a.operario.id = :operarioId")
    List<AsignacionOperario> findByOperarioId(@Param("operarioId") Long operarioId);
    
    void deleteByOperarioId(Long operarioId);

    @Query("SELECT a FROM AsignacionOperario a " +
           "LEFT JOIN FETCH a.operario " +
           "LEFT JOIN FETCH a.puesto p " +
           "LEFT JOIN FETCH a.mesa m " +
           "LEFT JOIN FETCH m.puesto mp " +
           "LEFT JOIN FETCH mp.municipio")
    List<AsignacionOperario> findAllWithEagerRelationships();
}
