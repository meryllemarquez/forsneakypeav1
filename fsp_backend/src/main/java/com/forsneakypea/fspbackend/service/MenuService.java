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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// "Our usual orders": the couple's shared menu. Not part of any "delete all" flow.
// No activity-log entry: activity_logs.entity_type has a CHECK constraint with no menu value,
// and widening it needs its own migration.
@Service
@RequiredArgsConstructor
public class MenuService {

    static final int STEP = 1000;
    static final String DEFAULT_DOODLE = "utensils";
    static final Set<String> LOVED_BY = Set.of("her", "him", "both");

    // Icon-kit names (frontend GLYPHS). Anything else is stored as the default doodle.
    static final Set<String> DOODLES = Set.of(
            "motmot", "camera", "film", "star", "tulip", "daisy", "mic", "car", "rc", "dog", "plush", "ball",
            "chimken", "rorry", "mountain", "museum", "yogurt", "fries", "churro", "matcha", "cookie",
            "lasagna", "pizza", "donut", "bowl", "envelope", "house", "heart", "jorts", "bell", "sparkle",
            "vinyl", "cassette", "videocam", "meme", "tree", "wheel", "pin", "utensils", "bed", "claw",
            "plane", "arena", "lechon", "ferris", "sun", "her", "him", "ticket",
            "burger", "ramen", "milkTea", "iceCream", "cake", "sushi", "coffee", "siomai");

    private final MenuItemRepository repository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MenuItemDTO> list() {
        return repository.findAllByOrderBySortOrderAsc().stream().map(MenuService::toDto).toList();
    }

    @Transactional
    public MenuItemDTO create(MenuItemRequest request, Long userId) {
        List<MenuItem> items = repository.findAllByOrderBySortOrderAsc();
        int sortOrder = sortOrderAfter(items, request.getAfterId());
        if (sortOrder < 0) {
            renumber(items);
            sortOrder = sortOrderAfter(items, request.getAfterId());
        }

        MenuItem item = MenuItem.builder()
                .name(cleanName(request.getName()))
                .doodle(cleanDoodle(request.getDoodle()))
                .lovedBy(cleanLovedBy(request.getLovedBy()))
                .place(blankToNull(request.getPlace()))
                .pricePhp(request.getPricePhp())
                .note(blankToNull(request.getNote()))
                .sortOrder(sortOrder)
                .createdBy(userId)
                .build();
        item = repository.saveAndFlush(item);

        notificationService.notifyOthers(userId, NotificationType.SYSTEM,
                "added " + item.getName() + " to our usual orders", null, null);
        return toDto(item);
    }

    @Transactional
    public MenuItemDTO update(UUID id, MenuItemRequest request) {
        MenuItem item = find(id);
        if (request.getVersion() == null || !request.getVersion().equals(item.getVersion())) {
            throw new ConflictException("This was just changed by someone else.");
        }
        item.setName(cleanName(request.getName()));
        item.setDoodle(cleanDoodle(request.getDoodle()));
        item.setLovedBy(cleanLovedBy(request.getLovedBy()));
        item.setPlace(blankToNull(request.getPlace()));
        item.setPricePhp(request.getPricePhp());
        item.setNote(blankToNull(request.getNote()));
        return toDto(repository.saveAndFlush(item));
    }

    @Transactional
    public void delete(UUID id, Long userId) {
        MenuItem item = find(id);
        repository.delete(item);
        notificationService.notifyOthers(userId, NotificationType.SYSTEM,
                "removed " + item.getName() + " from our usual orders", null, null);
    }

    @Transactional
    public List<MenuItemDTO> reorder(MenuReorderRequest request) {
        List<MenuItem> items = repository.findAllByOrderBySortOrderAsc();
        List<UUID> ids = request.getIds();
        Set<UUID> requested = new HashSet<>(ids);
        Set<UUID> existing = items.stream().map(MenuItem::getId).collect(Collectors.toSet());
        if (requested.size() != ids.size() || !requested.equals(existing)) {
            throw new BadRequestException("The menu changed. Reload and try again.");
        }

        Map<UUID, MenuItem> byId = items.stream().collect(Collectors.toMap(MenuItem::getId, Function.identity()));
        // Only rows whose slot actually moved are written.
        for (int i = 0; i < ids.size(); i++) {
            MenuItem item = byId.get(ids.get(i));
            int sortOrder = (i + 1) * STEP;
            if (item.getSortOrder() != sortOrder) {
                item.setSortOrder(sortOrder);
            }
        }
        repository.saveAllAndFlush(items);
        return ids.stream().map(byId::get).map(MenuService::toDto).toList();
    }

    /**
     * Sort order for a new item placed after {@code afterId} (null = last): the midpoint to the next
     * item, or -1 when the gap has closed and the list must be renumbered first.
     */
    private int sortOrderAfter(List<MenuItem> items, UUID afterId) {
        if (afterId == null || items.isEmpty()) {
            return items.isEmpty() ? STEP : items.get(items.size() - 1).getSortOrder() + STEP;
        }
        for (int i = 0; i < items.size(); i++) {
            if (!items.get(i).getId().equals(afterId)) continue;
            int before = items.get(i).getSortOrder();
            if (i == items.size() - 1) return before + STEP;
            int after = items.get(i + 1).getSortOrder();
            return after - before < 2 ? -1 : before + (after - before) / 2;
        }
        throw new NotFoundException("That menu item was not found");
    }

    private void renumber(List<MenuItem> items) {
        for (int i = 0; i < items.size(); i++) {
            items.get(i).setSortOrder((i + 1) * STEP);
        }
        repository.saveAllAndFlush(items);
    }

    private MenuItem find(UUID id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("That one was taken off the menu."));
    }

    private static String cleanName(String name) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("Give it a name.");
        return trimmed;
    }

    private static String cleanDoodle(String doodle) {
        return doodle != null && DOODLES.contains(doodle) ? doodle : DEFAULT_DOODLE;
    }

    private static String cleanLovedBy(String lovedBy) {
        return lovedBy != null && LOVED_BY.contains(lovedBy) ? lovedBy : "both";
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static MenuItemDTO toDto(MenuItem item) {
        return MenuItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .doodle(item.getDoodle())
                .lovedBy(item.getLovedBy())
                .place(item.getPlace())
                .pricePhp(item.getPricePhp())
                .note(item.getNote())
                .sortOrder(item.getSortOrder())
                .version(item.getVersion())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
