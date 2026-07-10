package com.electoral.testigos.repository;

import com.electoral.testigos.model.Discrepancia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscrepanciaRepository extends JpaRepository<Discrepancia, Long> {
    Optional<Discrepancia> findByMesaIdAndCandidatoIdAndTipoVotoId(Long mesaId, Long candidatoId, Long tipoVotoId);
    
    Optional<Discrepancia> findByMesaIdAndCandidatoIsNullAndTipoVotoId(Long mesaId, Long tipoVotoId);

    List<Discrepancia> findByMesaId(Long mesaId);

    @Query("SELECT d FROM Discrepancia d " +
           "JOIN FETCH d.mesa m " +
           "JOIN FETCH m.puesto p " +
           "JOIN FETCH p.municipio mu " +
           "LEFT JOIN FETCH d.candidato c " +
           "JOIN FETCH d.tipoVoto tv " +
           "WHERE d.diferencia <> 0")
    List<Discrepancia> findAllWithDiscrepancy();

    long countByDiferenciaNot(int diferencia);
}
