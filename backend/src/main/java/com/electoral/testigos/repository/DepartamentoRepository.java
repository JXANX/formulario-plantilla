package com.electoral.testigos.repository;

import com.electoral.testigos.model.Departamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartamentoRepository extends JpaRepository<Departamento, Long> {
    Optional<Departamento> findByCodigoDepartamento(String codigoDepartamento);
}
