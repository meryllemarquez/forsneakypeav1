package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.PetDTO;
import com.forsneakypea.fspbackend.dto.response.PetActionResponse;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.Pet;
import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import com.forsneakypea.fspbackend.repository.PetRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetServiceTest {

    private static final OffsetDateTime T0 = OffsetDateTime.of(2026, 10, 25, 9, 0, 0, 0, ZoneOffset.UTC);

    private PetRepository repository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private PetService service;

    @BeforeEach
    void setUp() {
        repository = mock(PetRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        service = new PetService(repository, userRepository, notificationService);
        when(repository.saveAndFlush(any(Pet.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Pet pet(String id, String kind, int fullness, int energy, int joy) {
        Pet p = Pet.builder().id(id).name(id).kind(kind)
                .fullnessBase(fullness).energyBase(energy).joyBase(joy).snapshotAt(T0).build();
        when(repository.findForUpdate(id)).thenReturn(Optional.of(p));
        return p;
    }

    // ---- decay curve ------------------------------------------------------------------

    @Test
    void decayMatchesSpecExamples() {
        assertEquals(55, PetMath.at(90, 80, 70, 8).fullness());
        assertEquals(29, PetMath.at(90, 80, 70, 24).fullness());   // 28.75 rounds to 29, "peckish"
        assertEquals(50, PetMath.at(70, 80, 70, 12).joy());        // 30 + 40 * 0.5
        assertEquals(90, PetMath.at(70, 80, 70, 6).energy());      // 100 - 20 * 0.5
    }

    @Test
    void longAbsenceSettlesAtTheFloorsNeverZero() {
        PetMath.Stats s = PetMath.at(100, 0, 100, 24 * 30);
        assertEquals(20, s.fullness());
        assertEquals(30, s.joy());
        assertEquals(100, s.energy());
        // after 3 days fullness (~20) outranks joy (~30) in the mood priority
        assertEquals("peckish", PetMath.mood(PetMath.at(70, 80, 70, 72)));
    }

    @Test
    void negativeElapsedTimeIsTreatedAsZero() {
        assertEquals(new PetMath.Stats(70, 80, 70), PetMath.at(70, 80, 70, -5));
    }

    @Test
    void moodPriority() {
        assertEquals("sleepy", PetMath.mood(new PetMath.Stats(10, 20, 10)));
        assertEquals("peckish", PetMath.mood(new PetMath.Stats(30, 80, 10)));
        assertEquals("needs_cuddle", PetMath.mood(new PetMath.Stats(60, 80, 39)));
        assertEquals("so_happy", PetMath.mood(new PetMath.Stats(50, 40, 70)));
        assertEquals("content", PetMath.mood(new PetMath.Stats(60, 80, 55)));
    }

    // ---- list -------------------------------------------------------------------------

    @Test
    void listComputesStatsFromTheSnapshot() {
        Pet p = pet("zizi", "dog", 90, 80, 70);
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(p));
        PetDTO dto = service.list(T0.plusHours(8)).get(0);
        assertEquals(55, dto.stats().fullness());
        assertNull(dto.last());
        verify(repository, never()).saveAndFlush(any());
    }

    // ---- actions ----------------------------------------------------------------------

    @Test
    void feedAddsFullnessAndJoyAndWritesNewSnapshot() {
        Pet p = pet("zizi", "dog", 40, 80, 50);
        PetActionResponse r = service.act("zizi", "feed", 2L, T0);
        assertEquals("ate", r.reaction().kind());
        assertEquals(75, p.getFullnessBase());
        assertEquals(58, p.getJoyBase());
        assertEquals(1, p.getFedCount());
        assertEquals(T0, p.getSnapshotAt());
        assertEquals("feed", r.pet().last().action());
    }

    @Test
    void feedWhenAlreadyFullChangesNothing() {
        Pet p = pet("zizi", "dog", 96, 80, 50);
        PetActionResponse r = service.act("zizi", "feed", 2L, T0);
        assertEquals("already_full", r.reaction().kind());
        assertEquals(96, p.getFullnessBase());
        assertEquals(0, p.getFedCount());
    }

    @Test
    void playWhenTooSleepyChangesNothing() {
        Pet p = pet("zoey", "dog", 70, 10, 50);
        // 10 energy recovers toward 100; check at snapshot time so it stays under 20.
        PetActionResponse r = service.act("zoey", "play", 2L, T0);
        assertEquals("too_sleepy", r.reaction().kind());
        assertEquals(10, p.getEnergyBase());
        assertEquals(0, p.getPlayCount());
    }

    @Test
    void playCostsEnergyAndRaisesJoy() {
        Pet p = pet("zoey", "dog", 70, 80, 50);
        assertEquals("played", service.act("zoey", "play", 2L, T0).reaction().kind());
        assertEquals(66, p.getFullnessBase());
        assertEquals(58, p.getEnergyBase());
        assertEquals(68, p.getJoyBase());
    }

    @Test
    void walkNeedsEnergyAndIsDogsOnly() {
        Pet dog = pet("tato", "dog", 70, 24, 50);
        assertEquals("too_sleepy", service.act("tato", "walk", 2L, T0).reaction().kind());
        assertEquals(0, dog.getWalkCount());

        Pet plush = pet("junebug", "plush", 70, 80, 50);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.act("junebug", "walk", 2L, T0));
        assertEquals("Plushies don't go for walks.", ex.getMessage());
        assertNull(plush.getLastAction());
    }

    @Test
    void walkAppliesItsCosts() {
        Pet p = pet("cooper", "dog", 70, 80, 50);
        assertEquals("walked", service.act("cooper", "walk", 2L, T0).reaction().kind());
        assertEquals(62, p.getFullnessBase());
        assertEquals(48, p.getEnergyBase());
        assertEquals(74, p.getJoyBase());
        assertEquals(1, p.getWalkCount());
    }

    @Test
    void actionsApplyToTheDecayedValuesNotTheStoredBase() {
        Pet p = pet("zizi", "dog", 90, 80, 70);
        service.act("zizi", "feed", 2L, T0.plusHours(8));   // fullness had decayed to 55
        assertEquals(90, p.getFullnessBase());
    }

    @Test
    void valuesAreClampedTo100() {
        Pet p = pet("zizi", "dog", 90, 99, 90);
        service.act("zizi", "hug", 2L, T0);
        assertEquals(100, p.getJoyBase());
        assertEquals(100, p.getEnergyBase());
    }

    @Test
    void sameActionWithinCooldownIsRejectedWithoutWriting() {
        Pet p = pet("loafie", "dog", 40, 80, 50);
        service.act("loafie", "hug", 2L, T0);
        int hugs = p.getHugCount();
        assertThrows(RateLimitExceededException.class, () -> service.act("loafie", "hug", 3L, T0.plusSeconds(5)));
        assertEquals(hugs, p.getHugCount());
        // a different action, or the same one after the cooldown, is fine
        assertEquals("ate", service.act("loafie", "feed", 3L, T0.plusSeconds(5)).reaction().kind());
        assertEquals("hugged", service.act("loafie", "hug", 3L, T0.plusSeconds(20)).reaction().kind());
    }

    @Test
    void unknownActionAndUnknownPet() {
        assertThrows(BadRequestException.class, () -> service.act("zizi", "yeet", 2L, T0));
        when(repository.findForUpdate("nobody")).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.act("nobody", "hug", 2L, T0));
    }

    @Test
    void reactionLineIsOneOfTheAllowedLines() {
        pet("zizi", "dog", 40, 80, 50);
        String line = service.act("zizi", "feed", 2L, T0).reaction().line();
        assertTrue(List.of("nom nom", "yum!", "more please?").contains(line));
    }

    // ---- hug notifications ------------------------------------------------------------

    @Test
    void hugNotifiesThePartnerButNotRepeatHugsFromTheSameUserWithin30Minutes() {
        pet("zoey", "dog", 70, 80, 50);
        service.act("zoey", "hug", 2L, T0);
        service.act("zoey", "hug", 2L, T0.plusMinutes(10));
        verify(notificationService, org.mockito.Mockito.times(1))
                .notifyOthers(eq(2L), eq(NotificationType.SYSTEM), eq("gave zoey a hug"), isNull(), isNull());

        service.act("zoey", "hug", 2L, T0.plusMinutes(45));
        verify(notificationService, org.mockito.Mockito.times(2))
                .notifyOthers(eq(2L), eq(NotificationType.SYSTEM), eq("gave zoey a hug"), isNull(), isNull());
    }

    @Test
    void otherActionsNeverNotify() {
        pet("zoey", "dog", 40, 80, 50);
        service.act("zoey", "feed", 2L, T0);
        verify(notificationService, never()).notifyOthers(any(), any(), any(), any(), any());
    }
}
