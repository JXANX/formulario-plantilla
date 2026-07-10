package com.electoral.testigos.repository;

import com.electoral.testigos.model.FotoE14;
import com.electoral.testigos.model.enums.OrigenFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FotoE14Repository extends JpaRepository<FotoE14, Long> {
    List<FotoE14> findByMesaId(Long mesaId);
    Optional<FotoE14> findByMesaIdAndOrigen(Long mesaId, OrigenFoto origen);
}
