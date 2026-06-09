package com.electoral.testigos.repository;

import com.electoral.testigos.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.usuario ORDER BY a.fecha DESC")
    Page<AuditLog> findAllWithUsuario(Pageable pageable);
}