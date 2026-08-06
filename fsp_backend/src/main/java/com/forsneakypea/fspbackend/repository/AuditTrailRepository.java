package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.AuditTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, java.util.UUID> {
    Page<AuditTrail> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
