package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Notification;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<Notification> findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Boolean isRead);
    // Latest 50 only: the bell and the admin list never show more, and the unbounded list grows forever.
    List<Notification> findTop50ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<Notification> findTop50ByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Boolean isRead);
    long countByIsReadAndDeletedAtIsNull(Boolean isRead);

    // Slice = no extra COUNT query (Page would run one whenever the page is full).
    Slice<Notification> findAllBy(Pageable pageable);

    // Recipients (among userIds) that already got a notification of one of these types for this
    // entity since the given time -- used to avoid notifying about every save of the same note.
    @Query("select distinct n.userId from Notification n where n.userId in :userIds "
            + "and n.relatedEntityType = :entityType and n.relatedEntityId = :entityId "
            + "and n.type in :types and n.createdAt >= :since")
    Set<Long> findRecipientsNotifiedSince(@Param("userIds") Collection<Long> userIds,
                                          @Param("entityType") RelatedEntityType entityType,
                                          @Param("entityId") java.util.UUID entityId,
                                          @Param("types") Collection<NotificationType> types,
                                          @Param("since") OffsetDateTime since);
}
