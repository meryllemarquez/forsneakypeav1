package com.forsneakypea.fspbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forsneakypea.fspbackend.dto.BouquetDTO;
import com.forsneakypea.fspbackend.dto.request.BouquetRequest;
import com.forsneakypea.fspbackend.entity.Bouquet;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.ConflictException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.repository.BouquetRepository;
import com.forsneakypea.fspbackend.repository.LoveStickerRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BouquetServiceTest {

    private BouquetRepository bouquetRepository;
    private LoveStickerRepository stickerRepository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private BouquetService service;

    @BeforeEach
    void setUp() {
        bouquetRepository = mock(BouquetRepository.class);
        stickerRepository = mock(LoveStickerRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        service = new BouquetService(bouquetRepository, stickerRepository, userRepository,
                notificationService, new ObjectMapper());
        when(bouquetRepository.saveAndFlush(any(Bouquet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());
    }

    private static Map<String, Object> flower(String id) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("id", id);
        f.put("type", "flower");
        f.put("name", "rose");
        f.put("tint", "pink");
        f.put("x", 188);
        f.put("y", 150.5);
        f.put("r", -12);
        f.put("s", 1.1);
        f.put("flip", true);
        f.put("junk", "dropped");
        return f;
    }

    private static Map<String, Object> recipe(Consumer<Map<String, Object>> tweak) {
        Map<String, Object> ribbon = new LinkedHashMap<>(Map.of("style", "bow", "color", "sea"));
        Map<String, Object> card = new LinkedHashMap<>(Map.of("show", true, "to", "Cj", "from", "Merylle",
                "text", "Happy anniversary, mahal."));
        List<Object> items = new ArrayList<>(List.of(flower("f1")));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("v", 1);
        r.put("wrap", "kraft");
        r.put("ribbon", ribbon);
        r.put("items", items);
        r.put("card", card);
        tweak.accept(r);
        return r;
    }

    private static BouquetRequest request(String title, Map<String, Object> recipe) {
        BouquetRequest r = new BouquetRequest();
        r.setTitle(title);
        r.setRecipe(recipe);
        return r;
    }

    private Bouquet stored(long version) {
        Bouquet b = Bouquet.builder().id(UUID.randomUUID()).title("Anniversary")
                .recipe(recipe(m -> { })).version(version).createdBy(3L).build();
        when(bouquetRepository.findById(b.getId())).thenReturn(Optional.of(b));
        return b;
    }

    @Test
    void createTrimsKeepsOnlyKnownFieldsAndNotifiesThePartner() {
        BouquetDTO dto = service.create(request("  Anniversary ", recipe(m -> { })), 1L);

        assertEquals("Anniversary", dto.getTitle());
        @SuppressWarnings("unchecked")
        Map<String, Object> item = ((List<Map<String, Object>>) dto.getRecipe().get("items")).get(0);
        assertFalse(item.containsKey("junk"));
        assertEquals(188, item.get("x"));
        assertEquals(150.5, item.get("y"));
        verify(notificationService).notifyOthers(eq(1L), eq(NotificationType.SYSTEM),
                eq("made you a bouquet: Anniversary"), isNull(), isNull());
    }

    @Test
    void createRejectsBadTitlesAndRecipes() {
        assertThrows(BadRequestException.class, () -> service.create(request("  ", recipe(m -> { })), 1L));
        assertThrows(BadRequestException.class, () -> service.create(request("x".repeat(41), recipe(m -> { })), 1L));
        assertThrows(BadRequestException.class, () -> service.create(request("t", null), 1L));
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("v", 2))), 1L), "version");
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("wrap", "glitter"))), 1L), "wrap");
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("ribbon", Map.of("style", "bow", "color", "tomato")))), 1L), "tomato");
    }

    @Test
    void createEnforcesTheFlowerAndFieldLimits() {
        List<Object> forty = new ArrayList<>();
        for (int i = 0; i < 40; i++) forty.add(flower("f" + i));
        assertEquals(40, ((List<?>) service.create(request("t", recipe(m -> m.put("items", forty))), 1L)
                .getRecipe().get("items")).size());

        List<Object> fortyOne = new ArrayList<>(forty);
        fortyOne.add(flower("f40"));
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("items", fortyOne))), 1L));

        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("items",
                new ArrayList<Object>(List.of(flower("a"), flower("a")))))), 1L), "duplicate ids");

        Map<String, Object> outside = flower("a");
        outside.put("x", 401);
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("items",
                new ArrayList<Object>(List.of(outside))))), 1L), "x out of range");

        Map<String, Object> huge = flower("a");
        huge.put("s", 3);
        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("items",
                new ArrayList<Object>(List.of(huge))))), 1L), "scale");

        assertThrows(BadRequestException.class, () -> service.create(request("t", recipe(m -> m.put("card",
                Map.of("show", true, "text", "x".repeat(241))))), 1L), "letter");
    }

    @Test
    void updateChecksTheVersion() {
        Bouquet bouquet = stored(2L);
        BouquetRequest r = request("Renamed", recipe(m -> m.put("wrap", "sea-dots")));
        r.setVersion(1L);
        assertThrows(ConflictException.class, () -> service.update(bouquet.getId(), r));

        r.setVersion(2L);
        BouquetDTO dto = service.update(bouquet.getId(), r);
        assertEquals("Renamed", dto.getTitle());
        assertEquals("sea-dots", dto.getRecipe().get("wrap"));
    }

    @Test
    void getReturnsTheAuthorNameAndMissingIs404() {
        Bouquet bouquet = stored(0L);
        User author = new User();
        author.setId(3L);
        author.setName("Merylle");
        when(userRepository.findById(3L)).thenReturn(Optional.of(author));
        assertEquals("Merylle", service.get(bouquet.getId()).getCreatedByName());

        UUID id = UUID.randomUUID();
        when(bouquetRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.get(id));
        assertThrows(NotFoundException.class, () -> service.update(id, request("t", recipe(m -> { }))));
        assertThrows(NotFoundException.class, () -> service.delete(id));
    }

    @Test
    void deleteRemovesTheBouquetAndItsPinnedStickers() {
        Bouquet bouquet = stored(0L);
        service.delete(bouquet.getId());
        verify(stickerRepository).deleteAllByImage("bouquet:" + bouquet.getId());
        verify(bouquetRepository).delete(bouquet);
    }
}
