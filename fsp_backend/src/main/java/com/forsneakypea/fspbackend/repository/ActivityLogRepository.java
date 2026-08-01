package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(RelatedEntityType entityType, UUID entityId);
}
