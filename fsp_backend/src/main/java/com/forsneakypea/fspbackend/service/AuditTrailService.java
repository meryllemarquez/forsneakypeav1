package com.forsneakypea.fspbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forsneakypea.fspbackend.entity.AuditTrail;
import com.forsneakypea.fspbackend.repository.AuditTrailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

// Admin-initiated actions only — never pruned, always includes a before/after
// snapshot so every administrative change is traceable.
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditTrailService {

    private final AuditTrailRepository auditTrailRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void record(Long actorId, String entity, UUID entityId, String action,
                        Object before, Object after, Map<String, Object> changedFields, String reason) {
        AuditTrail entry = AuditTrail.builder()
                .actorId(actorId)
                .entity(entity)
                .entityId(entityId)
                .action(action)
                .beforeData(toJson(before))
                .afterData(toJson(after))
                .changedFields(toJson(changedFields))
                .reason(reason)
                .build();
        auditTrailRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditTrail> list(Pageable pageable) {
        return auditTrailRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit trail payload: {}", e.getMessage());
            return null;
        }
    }
}
