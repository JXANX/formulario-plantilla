package com.electoral.testigos.repository;

import com.electoral.testigos.model.RegistroVotoRegistraduria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroVotoRegistraduriaRepository extends JpaRepository<RegistroVotoRegistraduria, Long> {
    Optional<RegistroVotoRegistraduria> findByMesaIdAndCandidatoIdAndTipoVotoId(Long mesaId, Long candidatoId, Long tipoVotoId);
    
    // For general count when candidate is null (like blank/null votes)
    Optional<RegistroVotoRegistraduria> findByMesaIdAndCandidatoIsNullAndTipoVotoId(Long mesaId, Long tipoVotoId);

    List<RegistroVotoRegistraduria> findByMesaId(Long mesaId);
}
