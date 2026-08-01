package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<Notification> findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Boolean isRead);
}
