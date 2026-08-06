package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Shared by every module (Dates, Memories, Love Board, Checklist, Auth) so
// "who did what, when" is recorded in one place instead of each service
// reimplementing its own logger.
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public void log(Long userId, String action, RelatedEntityType entityType, UUID entityId) {
        log(userId, action, entityType, entityId, null);
    }

    public void log(Long userId, String action, RelatedEntityType entityType, UUID entityId, String metadataJson) {
        ActivityLog entry = ActivityLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .metadata(metadataJson)
                .status("SUCCESS")
                .build();
        activityLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLog> search(Long userId, RelatedEntityType entityType, String status, String action,
                                     OffsetDateTime from, OffsetDateTime to, Pageable pageable) {
        Specification<ActivityLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (userId != null) predicates.add(cb.equal(root.get("userId"), userId));
            if (entityType != null) predicates.add(cb.equal(root.get("entityType"), entityType));
            if (status != null && !status.isBlank()) predicates.add(cb.equal(root.get("status"), status));
            if (action != null && !action.isBlank()) predicates.add(cb.like(cb.lower(root.get("action")), "%" + action.toLowerCase() + "%"));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return activityLogRepository.findAll(spec, pageable);
    }
}
