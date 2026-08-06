package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.entity.Notification;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.NotificationRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification create(Long userId, NotificationType type, String title, String message,
                                RelatedEntityType relatedEntityType, UUID relatedEntityId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    // Couple-app broadcast: notify every other ROLE_USER account (i.e. the
    // partner) about the actor's action, skipping admin accounts and the
    // actor themselves. Title/message are generated centrally from the
    // actor's real name + an optional label for the specific item ("Our
    // Anniversary Trip") so every notification reads as a personal message
    // ("Merylle left you a new love letter.") instead of a generic system
    // string — the same action produces the same wording everywhere it's
    // triggered, and adding a new module only means adding one enum value
    // + one switch case here instead of duplicating copy at every call site.
    @Transactional
    public void notifyOthers(Long actorUserId, NotificationType type, String entityLabel,
                              RelatedEntityType relatedEntityType, UUID relatedEntityId) {
        String actorName = userRepository.findById(actorUserId).map(User::getName).orElse("Your partner");
        String[] titleAndMessage = personalize(actorName, type, entityLabel);

        List<User> recipients = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_USER)
                .filter(u -> !u.getId().equals(actorUserId))
                .collect(Collectors.toList());
        for (User recipient : recipients) {
            create(recipient.getId(), type, titleAndMessage[0], titleAndMessage[1], relatedEntityType, relatedEntityId);
        }
    }

    private String[] personalize(String actor, NotificationType type, String label) {
        String quoted = (label != null && !label.isBlank()) ? " \"" + label.trim() + "\"" : "";
        return switch (type) {
            case LOVE_NOTE_CREATED -> new String[]{"New Love Letter", actor + " left you a new love letter" + quoted + "."};
            case LOVE_NOTE_UPDATED -> new String[]{"Love Letter Edited", actor + " edited a love letter" + quoted + "."};
            case LOVE_NOTE_DELETED -> new String[]{"Love Letter Removed", actor + " deleted a love letter" + quoted + "."};
            case MEMORY_CREATED -> new String[]{"New Memory", actor + " added a new memory" + quoted + "."};
            case MEMORY_UPDATED -> new String[]{"Memory Updated", actor + " updated a memory" + quoted + "."};
            case MEMORY_DELETED -> new String[]{"Memory Deleted", actor + " deleted a memory" + quoted + "."};
            case GALLERY_UPLOAD -> new String[]{"New Photo", actor + " uploaded a new photo" + quoted + "."};
            case DATE_CREATED -> new String[]{"New Date Plan", actor + " planned a new date" + quoted + "."};
            case DATE_UPDATED -> new String[]{"Date Plan Updated", actor + " updated a date plan" + quoted + "."};
            case DATE_COMPLETED -> new String[]{"Date Completed", actor + " marked a date as completed" + quoted + "."};
            case PROFILE_CHANGED -> new String[]{"Profile Updated", actor + " updated their profile."};
            default -> new String[]{"Update", actor + " made an update."};
        };
    }

    @Transactional(readOnly = true)
    public List<Notification> listForUser(Long userId, Boolean unreadOnly) {
        if (Boolean.TRUE.equals(unreadOnly)) {
            return notificationRepository.findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(userId, false);
        }
        return notificationRepository.findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    // Admin oversight — most recent notifications across every user, not
    // scoped to one recipient. Used by the admin dashboard's "Recent
    // Notifications" section.
    @Transactional(readOnly = true)
    public List<Notification> listRecentAcrossAllUsers(int limit) {
        return notificationRepository.findAll(PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    }

    @Transactional
    public Notification markRead(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setIsRead(true);
        notification.setReadAt(OffsetDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(userId, false);
        OffsetDateTime now = OffsetDateTime.now();
        unread.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void delete(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setDeletedAt(OffsetDateTime.now());
        notificationRepository.save(notification);
    }
}
