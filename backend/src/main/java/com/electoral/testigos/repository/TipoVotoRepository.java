package com.electoral.testigos.repository;

import com.electoral.testigos.model.TipoVoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoVotoRepository extends JpaRepository<TipoVoto, Long> {
    List<TipoVoto> findByActivoTrue();
    Optional<TipoVoto> findByCodigo(String codigo);
}
