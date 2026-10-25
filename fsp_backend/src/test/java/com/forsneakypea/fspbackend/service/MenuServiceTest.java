package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.MenuItemDTO;
import com.forsneakypea.fspbackend.dto.request.MenuItemRequest;
import com.forsneakypea.fspbackend.dto.request.MenuReorderRequest;
import com.forsneakypea.fspbackend.entity.MenuItem;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.ConflictException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.repository.MenuItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MenuServiceTest {

    private MenuItemRepository repository;
    private NotificationService notificationService;
    private MenuService service;

    @BeforeEach
    void setUp() {
        repository = mock(MenuItemRepository.class);
        notificationService = mock(NotificationService.class);
        service = new MenuService(repository, notificationService);
        when(repository.saveAndFlush(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static MenuItem item(String name, int sortOrder) {
        return MenuItem.builder().id(UUID.randomUUID()).name(name).sortOrder(sortOrder).version(0L).build();
    }

    private static MenuItemRequest request(String name) {
        MenuItemRequest r = new MenuItemRequest();
        r.setName(name);
        return r;
    }

    @Test
    void createWithoutAfterIdGoesLastAndNotifiesThePartner() {
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(item("a", 1000), item("b", 2000)));

        MenuItemDTO dto = service.create(request("  Ramen night "), 1L);

        assertEquals(3000, dto.getSortOrder());
        assertEquals("Ramen night", dto.getName());
        verify(notificationService).notifyOthers(eq(1L), eq(NotificationType.SYSTEM),
                eq("added Ramen night to our usual orders"), isNull(), isNull());
    }

    @Test
    void createAfterAnItemUsesTheMidpoint() {
        MenuItem a = item("a", 1000);
        MenuItem b = item("b", 2000);
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(a, b));
        MenuItemRequest r = request("new");
        r.setAfterId(a.getId());

        assertEquals(1500, service.create(r, 1L).getSortOrder());
    }

    @Test
    void createRenumbersWhenTheGapHasClosed() {
        MenuItem a = item("a", 10);
        MenuItem b = item("b", 11);
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(new ArrayList<>(List.of(a, b)));
        MenuItemRequest r = request("new");
        r.setAfterId(a.getId());

        int sortOrder = service.create(r, 1L).getSortOrder();

        assertEquals(1000, a.getSortOrder());
        assertEquals(2000, b.getSortOrder());
        assertEquals(1500, sortOrder);
    }

    @Test
    void createFallsBackForUnknownDoodleAndLovedBy() {
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        MenuItemRequest r = request("x");
        r.setDoodle("not-an-icon");
        r.setLovedBy("everyone");
        r.setPlace("   ");

        MenuItemDTO dto = service.create(r, 1L);

        assertEquals("utensils", dto.getDoodle());
        assertEquals("both", dto.getLovedBy());
        assertNull(dto.getPlace());
        assertEquals(1000, dto.getSortOrder());
    }

    @Test
    void createRejectsABlankName() {
        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.create(request("   "), 1L));
        assertEquals("Give it a name.", ex.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createAfterAMissingItemIsNotFound() {
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(item("a", 1000)));
        MenuItemRequest r = request("new");
        r.setAfterId(UUID.randomUUID());

        assertThrows(NotFoundException.class, () -> service.create(r, 1L));
    }

    @Test
    void updateWithAStaleVersionIsAConflict() {
        MenuItem existing = item("a", 1000);
        existing.setVersion(3L);
        when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));
        MenuItemRequest r = request("renamed");
        r.setVersion(2L);

        assertThrows(ConflictException.class, () -> service.update(existing.getId(), r));
        assertEquals("a", existing.getName());
    }

    @Test
    void updateWithTheCurrentVersionAppliesTheChanges() {
        MenuItem existing = item("a", 1000);
        when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));
        MenuItemRequest r = request("renamed");
        r.setVersion(0L);
        r.setPricePhp(420);
        r.setDoodle("ramen");

        MenuItemDTO dto = service.update(existing.getId(), r);

        assertEquals("renamed", dto.getName());
        assertEquals(420, dto.getPricePhp());
        assertEquals("ramen", dto.getDoodle());
    }

    @Test
    void updateOfAMissingItemIsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        MenuItemRequest r = request("x");
        r.setVersion(0L);

        assertThrows(NotFoundException.class, () -> service.update(id, r));
    }

    @Test
    void deleteRemovesTheItemAndNotifiesThePartner() {
        MenuItem existing = item("lasagna", 1000);
        when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

        service.delete(existing.getId(), 1L);

        verify(repository).delete(existing);
        verify(notificationService).notifyOthers(eq(1L), eq(NotificationType.SYSTEM),
                eq("removed lasagna from our usual orders"), isNull(), isNull());
    }

    @Test
    void deleteOfAMissingItemIsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.delete(id, 1L));
        verify(repository, never()).delete(any());
    }

    @Test
    void reorderRenumbersInTheRequestedOrder() {
        MenuItem a = item("a", 1000);
        MenuItem b = item("b", 2000);
        MenuItem c = item("c", 3000);
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(a, b, c));

        List<MenuItemDTO> result = service.reorder(new MenuReorderRequest(List.of(c.getId(), a.getId(), b.getId())));

        assertEquals(List.of("c", "a", "b"), result.stream().map(MenuItemDTO::getName).toList());
        assertEquals(1000, c.getSortOrder());
        assertEquals(2000, a.getSortOrder());
        assertEquals(3000, b.getSortOrder());
    }

    @Test
    void reorderRejectsIdsThatDoNotMatchTheMenu() {
        MenuItem a = item("a", 1000);
        MenuItem b = item("b", 2000);
        when(repository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(a, b));

        assertThrows(BadRequestException.class,
                () -> service.reorder(new MenuReorderRequest(List.of(a.getId()))));
        assertThrows(BadRequestException.class,
                () -> service.reorder(new MenuReorderRequest(List.of(a.getId(), UUID.randomUUID()))));
        assertThrows(BadRequestException.class,
                () -> service.reorder(new MenuReorderRequest(List.of(a.getId(), a.getId()))));
        verify(repository, never()).saveAllAndFlush(any());
    }
}
