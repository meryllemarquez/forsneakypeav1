package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID>, JpaSpecificationExecutor<ActivityLog> {
    List<ActivityLog> findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(RelatedEntityType entityType, UUID entityId);

    Optional<ActivityLog> findFirstByActionOrderByCreatedAtDesc(String action);

    // Slice = no extra COUNT query (Page would run one whenever the page is full).
    Slice<ActivityLog> findAllBy(Pageable pageable);
}
