package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.entity.Notification;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.NotificationRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class NotificationServiceTest {

    private NotificationRepository notificationRepository;
    private UserRepository userRepository;
    private NotificationService service;

    private final User actor = User.builder().id(1L).username("merylle").name("Merylle").role(Role.ROLE_USER).build();
    private final User partner = User.builder().id(2L).username("cj").name("CJ").role(Role.ROLE_USER).build();
    private final User third = User.builder().id(3L).username("third").name("Third").role(Role.ROLE_USER).build();

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        userRepository = mock(UserRepository.class);
        service = new NotificationService(notificationRepository, userRepository);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actor, null, actor.getAuthorities()));
        when(userRepository.findAllByRoleAndIdNot(Role.ROLE_USER, 1L)).thenReturn(List.of(partner, third));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @SuppressWarnings("unchecked")
    private List<Notification> savedNotifications() {
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    void insertsAllRecipientNotificationsWithOneSaveAll() {
        UUID folderId = UUID.randomUUID();

        service.notifyOthers(1L, NotificationType.MEMORY_CREATED, "Beach", RelatedEntityType.MEMORY_FOLDER, folderId);

        List<Notification> saved = savedNotifications();
        assertEquals(2, saved.size());
        assertEquals(Set.of(2L, 3L), Set.of(saved.get(0).getUserId(), saved.get(1).getUserId()));
        assertTrue(saved.get(0).getMessage().startsWith("Merylle added a new memory"));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void usesTheAuthenticatedUsersNameInsteadOfQueryingForTheActor() {
        service.notifyOthers(1L, NotificationType.MEMORY_CREATED, "Beach", RelatedEntityType.MEMORY_FOLDER, UUID.randomUUID());

        verify(userRepository, never()).findById(any());
    }

    @Test
    void fallsBackToLookingUpTheActorWhenTheyAreNotTheAuthenticatedUser() {
        SecurityContextHolder.clearContext();
        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));

        service.notifyOthers(1L, NotificationType.MEMORY_CREATED, "Beach", RelatedEntityType.MEMORY_FOLDER, UUID.randomUUID());

        verify(userRepository, times(1)).findById(1L);
        assertTrue(savedNotifications().get(0).getMessage().startsWith("Merylle"));
    }

    @Test
    void noRecipientsMeansNoWritesAndNoActorLookup() {
        when(userRepository.findAllByRoleAndIdNot(Role.ROLE_USER, 1L)).thenReturn(List.of());

        service.notifyOthers(1L, NotificationType.MEMORY_CREATED, "Beach", RelatedEntityType.MEMORY_FOLDER, UUID.randomUUID());

        verify(notificationRepository, never()).saveAll(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void editNotificationIsSkippedForRecipientsAlreadyNotifiedWithinTenMinutes() {
        UUID noteId = UUID.randomUUID();
        when(notificationRepository.findRecipientsNotifiedSince(anyCollection(), eq(RelatedEntityType.LOVE_NOTE),
                eq(noteId), anyCollection(), any(OffsetDateTime.class))).thenReturn(Set.of(2L));

        service.notifyOthers(1L, NotificationType.LOVE_NOTE_UPDATED, "Hi", RelatedEntityType.LOVE_NOTE, noteId);

        List<Notification> saved = savedNotifications();
        assertEquals(1, saved.size());
        assertEquals(3L, saved.get(0).getUserId()); // partner (2) skipped, the other recipient still notified
    }

    @Test
    void editNotificationIsNotCreatedAtAllWhenEveryoneWasRecentlyNotified() {
        UUID noteId = UUID.randomUUID();
        when(notificationRepository.findRecipientsNotifiedSince(anyCollection(), any(), eq(noteId), anyCollection(),
                any(OffsetDateTime.class))).thenReturn(Set.of(2L, 3L));

        service.notifyOthers(1L, NotificationType.LOVE_NOTE_UPDATED, "Hi", RelatedEntityType.LOVE_NOTE, noteId);

        verify(notificationRepository, never()).saveAll(any());
    }

    @Test
    void editNotificationLooksBackExactlyTenMinutes() {
        UUID noteId = UUID.randomUUID();
        when(notificationRepository.findRecipientsNotifiedSince(anyCollection(), any(), any(), anyCollection(), any()))
                .thenReturn(Set.of());
        OffsetDateTime before = OffsetDateTime.now();

        service.notifyOthers(1L, NotificationType.LOVE_NOTE_UPDATED, "Hi", RelatedEntityType.LOVE_NOTE, noteId);

        ArgumentCaptor<OffsetDateTime> since = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(notificationRepository).findRecipientsNotifiedSince(anyCollection(), any(), any(), anyCollection(), since.capture());
        assertTrue(!since.getValue().isBefore(before.minusMinutes(10).minusSeconds(1)));
        assertTrue(!since.getValue().isAfter(OffsetDateTime.now().minusMinutes(10).plusSeconds(1)));
    }

    @Test
    void otherNotificationTypesAreNeverDeduplicated() {
        service.notifyOthers(1L, NotificationType.LOVE_NOTE_DELETED, "Hi", RelatedEntityType.LOVE_NOTE, UUID.randomUUID());
        service.notifyOthers(1L, NotificationType.LOVE_NOTE_CREATED, "Hi", RelatedEntityType.LOVE_NOTE, UUID.randomUUID());

        verify(notificationRepository, never()).findRecipientsNotifiedSince(any(), any(), any(), any(), any());
        verify(notificationRepository, times(2)).saveAll(any());
    }

    @Test
    void listForUserReturnsOnlyTheLatestFifty() {
        service.listForUser(2L, false);
        service.listForUser(2L, true);

        verify(notificationRepository).findTop50ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(2L);
        verify(notificationRepository).findTop50ByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(2L, false);
        verify(notificationRepository, never()).findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(any());
    }

    @Test
    void markAllReadStillCoversEveryUnreadNotification() {
        // The 50-row cap is for display only; marking everything read must not be capped.
        when(notificationRepository.findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(2L, false))
                .thenReturn(List.of());

        service.markAllRead(2L);

        verify(notificationRepository).findAllByUserIdAndIsReadAndDeletedAtIsNullOrderByCreatedAtDesc(2L, false);
        verifyNoInteractions(userRepository);
    }
}
