package com.electoral.testigos.repository;

import com.electoral.testigos.model.Puesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PuestoRepository extends JpaRepository<Puesto, Long> {
    List<Puesto> findByMunicipioId(Long municipioId);
    Optional<Puesto> findByCodigoPuestoAndMunicipioId(String codigoPuesto, Long municipioId);
    Optional<Puesto> findByCodigoPuestoAndMunicipioIdAndZona(String codigoPuesto, Long municipioId, String zona);
}
