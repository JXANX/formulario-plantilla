package com.electoral.testigos.repository;

import com.electoral.testigos.model.DuplicadoLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DuplicadoLogRepository extends JpaRepository<DuplicadoLog, Long> {
}
