package com.electoral.testigos.repository;

import com.electoral.testigos.model.RegistroVotoTestigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroVotoTestigoRepository extends JpaRepository<RegistroVotoTestigo, Long> {
    Optional<RegistroVotoTestigo> findByMesaIdAndCandidatoIdAndTipoVotoId(Long mesaId, Long candidatoId, Long tipoVotoId);
    
    Optional<RegistroVotoTestigo> findByMesaIdAndCandidatoIsNullAndTipoVotoId(Long mesaId, Long tipoVotoId);

    List<RegistroVotoTestigo> findByMesaId(Long mesaId);
}
