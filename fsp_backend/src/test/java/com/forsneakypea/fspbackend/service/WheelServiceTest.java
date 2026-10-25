package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.WheelDTO;
import com.forsneakypea.fspbackend.dto.WheelSpinDTO;
import com.forsneakypea.fspbackend.dto.request.WheelRequest;
import com.forsneakypea.fspbackend.dto.request.WheelSpinRequest;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.Wheel;
import com.forsneakypea.fspbackend.entity.WheelChoice;
import com.forsneakypea.fspbackend.entity.WheelSpin;
import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.ConflictException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.repository.WheelRepository;
import com.forsneakypea.fspbackend.repository.WheelSpinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WheelServiceTest {

    private WheelRepository wheelRepository;
    private WheelSpinRepository spinRepository;
    private NotificationService notificationService;
    private WheelService service;

    @BeforeEach
    void setUp() {
        wheelRepository = mock(WheelRepository.class);
        spinRepository = mock(WheelSpinRepository.class);
        notificationService = mock(NotificationService.class);
        service = new WheelService(wheelRepository, spinRepository, notificationService);
        when(wheelRepository.saveAndFlush(any(Wheel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(spinRepository.saveAndFlush(any(WheelSpin.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static WheelChoice choice(String id, String label) {
        return new WheelChoice(id, label, "sea", null);
    }

    private static List<WheelChoice> choices(int n) {
        List<WheelChoice> list = new ArrayList<>();
        for (int i = 1; i <= n; i++) list.add(choice("c" + i, "choice " + i));
        return list;
    }

    private static WheelRequest request(String name, List<WheelChoice> choices) {
        WheelRequest r = new WheelRequest();
        r.setName(name);
        r.setChoices(choices);
        return r;
    }

    private Wheel storedWheel(long version) {
        Wheel wheel = Wheel.builder().id(UUID.randomUUID()).name("Saan kakain?")
                .choices(List.of(new WheelChoice("a1", "Lasagna", "sea", "lasagna"), choice("a2", "Pizza")))
                .version(version).build();
        when(wheelRepository.findById(wheel.getId())).thenReturn(Optional.of(wheel));
        return wheel;
    }

    @Test
    void createTrimsAndNotifiesThePartner() {
        WheelDTO dto = service.create(request("  Saan pupunta? ", choices(2)), 1L);

        assertEquals("Saan pupunta?", dto.getName());
        assertEquals(2, dto.getChoices().size());
        verify(notificationService).notifyOthers(eq(1L), eq(NotificationType.SYSTEM),
                eq("made a new wheel: Saan pupunta?"), isNull(), isNull());
    }

    @Test
    void createEnforcesTwoToTwelveChoices() {
        assertThrows(BadRequestException.class, () -> service.create(request("w", choices(1)), 1L));
        assertThrows(BadRequestException.class, () -> service.create(request("w", choices(13)), 1L));
        assertThrows(BadRequestException.class, () -> service.create(request("w", null), 1L));
        assertEquals(12, service.create(request("w", choices(12)), 1L).getChoices().size());
    }

    @Test
    void createRejectsBadChoices() {
        assertThrows(BadRequestException.class, () -> service.create(
                request("w", List.of(choice("a", "x"), choice("a", "y"))), 1L), "duplicate ids");
        assertThrows(BadRequestException.class, () -> service.create(
                request("w", List.of(choice("a", "x"), choice("b", "  "))), 1L), "blank label");
        assertThrows(BadRequestException.class, () -> service.create(
                request("w", List.of(choice("a", "x"), choice("b", "y".repeat(41)))), 1L), "long label");
        assertThrows(BadRequestException.class, () -> service.create(
                request("w", List.of(choice("a", "x"), new WheelChoice("b", "y", "tomato", null))), 1L), "tomato");
        assertThrows(BadRequestException.class, () -> service.create(
                request("w", List.of(choice("a", "x"), new WheelChoice("b", "y", "sea", "nope"))), 1L), "doodle");
    }

    @Test
    void updateChecksTheVersion() {
        Wheel wheel = storedWheel(2L);
        WheelRequest r = request("Renamed", choices(3));
        r.setVersion(1L);
        assertThrows(ConflictException.class, () -> service.update(wheel.getId(), r));

        r.setVersion(2L);
        WheelDTO dto = service.update(wheel.getId(), r);
        assertEquals("Renamed", dto.getName());
        assertEquals(3, dto.getChoices().size());
    }

    @Test
    void missingWheelIs404() {
        UUID id = UUID.randomUUID();
        when(wheelRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.update(id, request("w", choices(2))));
        assertThrows(NotFoundException.class, () -> service.delete(id));
        assertThrows(NotFoundException.class, () -> service.listSpins(id, null));
    }

    @Test
    void deleteRemovesTheWheel() {
        Wheel wheel = storedWheel(0L);
        service.delete(wheel.getId());
        verify(wheelRepository).delete(wheel);
    }

    @Test
    void spinCopiesLabelAndDoodleFromTheWheelAndPrunes() {
        Wheel wheel = storedWheel(0L);
        WheelSpinRequest r = new WheelSpinRequest();
        r.setChoiceId("a1");

        WheelSpinDTO dto = service.addSpin(wheel.getId(), r, 7L);

        assertEquals("Lasagna", dto.getLabel());
        assertEquals("lasagna", dto.getDoodle());
        assertEquals(7L, dto.getSpunBy());
        assertFalse(dto.isAccepted());
        verify(spinRepository).pruneToNewest(wheel.getId(), 30);
    }

    @Test
    void spinOfARemovedChoiceNeedsTheClientLabel() {
        Wheel wheel = storedWheel(0L);
        WheelSpinRequest r = new WheelSpinRequest();
        r.setChoiceId("gone");
        assertThrows(BadRequestException.class, () -> service.addSpin(wheel.getId(), r, 7L));

        r.setLabel("Burger");
        WheelSpinDTO dto = service.addSpin(wheel.getId(), r, 7L);
        assertEquals("Burger", dto.getLabel());
        assertNull(dto.getDoodle());
    }

    @Test
    void setAcceptedMarksTheSpin() {
        WheelSpin spin = WheelSpin.builder().id(UUID.randomUUID()).wheelId(UUID.randomUUID())
                .choiceId("a1").label("Lasagna").build();
        when(spinRepository.findById(spin.getId())).thenReturn(Optional.of(spin));
        WheelSpinRequest r = new WheelSpinRequest();
        r.setAccepted(true);

        assertTrue(service.setAccepted(spin.getId(), r).isAccepted());

        UUID missing = UUID.randomUUID();
        when(spinRepository.findById(missing)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.setAccepted(missing, r));
    }

    @Test
    void listSpinsClampsTheLimitAndClearDeletesHistory() {
        Wheel wheel = storedWheel(0L);
        when(spinRepository.findByWheelIdOrderBySpunAtDesc(eq(wheel.getId()), any())).thenReturn(List.of());

        service.listSpins(wheel.getId(), null);
        service.listSpins(wheel.getId(), 999);
        verify(spinRepository).findByWheelIdOrderBySpunAtDesc(wheel.getId(), PageRequest.of(0, 8));
        verify(spinRepository).findByWheelIdOrderBySpunAtDesc(wheel.getId(), PageRequest.of(0, 30));

        service.clearSpins(wheel.getId());
        verify(spinRepository).deleteAllByWheelId(wheel.getId());
    }
}
