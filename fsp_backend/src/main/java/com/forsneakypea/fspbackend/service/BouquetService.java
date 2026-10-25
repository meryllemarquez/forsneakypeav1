package com.forsneakypea.fspbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import com.forsneakypea.fspbackend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Shared bouquets: a title plus a small JSON recipe the app draws as SVG. The recipe is rebuilt from
// allow-listed fields so unknown keys never reach the database.
// No activity-log entry: activity_logs.entity_type has a CHECK constraint with no bouquet value.
@Service
@RequiredArgsConstructor
public class BouquetService {

    static final int MAX_BOUQUETS = 200;
    static final int MAX_FLOWERS = 40;
    static final int MAX_TITLE = 40;
    static final int MAX_TEXT = 240;
    static final int MAX_NAME = 24;
    static final int MAX_RECIPE_BYTES = 8192;
    static final Set<String> WRAPS = Set.of(
            "kraft", "sea-dots", "citrus-stripes", "gelato-gingham", "cloud-white", "amalfi-stars");
    static final Set<String> RIBBON_STYLES = Set.of("bow", "band", "none");
    static final Set<String> RIBBON_COLORS = Set.of("sea", "citrus", "gelato", "amalfi", "white", "pink");
    static final Set<String> FLOWERS = Set.of("tulip", "daisy", "rose", "sunflower", "babysbreath", "lily",
            "leaf", "fern", "eucalyptus");
    static final Set<String> TINTS = Set.of(
            "pink", "white", "green", "sea", "citrus", "gelato", "amalfi",
            "sea-tint", "citrus-tint", "gelato-tint", "amalfi-tint");
    static final Set<String> PAPERS = Set.of("gelato", "sea", "citrus", "lined");

    private final BouquetRepository bouquetRepository;
    private final LoveStickerRepository stickerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<BouquetDTO> list() {
        List<Bouquet> bouquets = bouquetRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, MAX_BOUQUETS));
        Map<Long, String> names = authorNames(bouquets);
        return bouquets.stream().map(b -> toDto(b, names.get(b.getCreatedBy()))).toList();
    }

    @Transactional(readOnly = true)
    public BouquetDTO get(UUID id) {
        Bouquet bouquet = find(id);
        return toDto(bouquet, authorName(bouquet.getCreatedBy()));
    }

    @Transactional
    public BouquetDTO create(BouquetRequest request, Long userId) {
        Bouquet bouquet = Bouquet.builder()
                .title(cleanTitle(request.getTitle()))
                .recipe(cleanRecipe(request.getRecipe()))
                .createdBy(userId)
                .build();
        bouquet = bouquetRepository.saveAndFlush(bouquet);

        notificationService.notifyOthers(userId, NotificationType.SYSTEM,
                "made you a bouquet: " + bouquet.getTitle(), null, null);
        return toDto(bouquet, authorName(userId));
    }

    @Transactional
    public BouquetDTO update(UUID id, BouquetRequest request) {
        Bouquet bouquet = find(id);
        if (request.getVersion() == null || !request.getVersion().equals(bouquet.getVersion())) {
            throw new ConflictException("This bouquet was just changed by someone else.");
        }
        bouquet.setTitle(cleanTitle(request.getTitle()));
        bouquet.setRecipe(cleanRecipe(request.getRecipe()));
        bouquet = bouquetRepository.saveAndFlush(bouquet);
        return toDto(bouquet, authorName(bouquet.getCreatedBy()));
    }

    @Transactional
    public void delete(UUID id) {
        Bouquet bouquet = find(id);
        // Pinned copies on the Love Board go with it, so no sticker is left pointing at nothing.
        stickerRepository.deleteAllByImage("bouquet:" + bouquet.getId());
        bouquetRepository.delete(bouquet);
    }

    private Bouquet find(UUID id) {
        return bouquetRepository.findById(id).orElseThrow(() -> new NotFoundException("That bouquet was not found."));
    }

    private String authorName(Long userId) {
        if (userId == null) return null;
        return CurrentUser.nameIfId(userId)
                .orElseGet(() -> userRepository.findById(userId).map(User::getName).orElse("Unknown"));
    }

    private Map<Long, String> authorNames(List<Bouquet> bouquets) {
        Set<Long> ids = new HashSet<>();
        bouquets.forEach(b -> ids.add(b.getCreatedBy()));
        Map<Long, String> names = new HashMap<>();
        userRepository.findAllById(ids).forEach(u -> names.put(u.getId(), u.getName()));
        return names;
    }

    private static String cleanTitle(String title) {
        String trimmed = title == null ? "" : title.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("Give the bouquet a name.");
        if (trimmed.length() > MAX_TITLE) throw new BadRequestException("That name is a bit long.");
        return trimmed;
    }

    private Map<String, Object> cleanRecipe(Map<String, Object> recipe) {
        if (recipe == null) throw new BadRequestException("That bouquet is empty.");
        if (!isNumber(recipe.get("v")) || ((Number) recipe.get("v")).intValue() != 1) {
            throw new BadRequestException("That bouquet is from a version this app does not know.");
        }
        Map<String, Object> clean = new LinkedHashMap<>();
        clean.put("v", 1);
        clean.put("wrap", oneOf(recipe.get("wrap"), WRAPS, "Pick one of the wrap papers."));

        Map<String, Object> ribbon = asMap(recipe.get("ribbon"), "Pick a ribbon.");
        Map<String, Object> cleanRibbon = new LinkedHashMap<>();
        cleanRibbon.put("style", oneOf(ribbon.get("style"), RIBBON_STYLES, "Pick one of the ribbon styles."));
        cleanRibbon.put("color", oneOf(ribbon.get("color"), RIBBON_COLORS, "Pick one of the ribbon colours."));
        clean.put("ribbon", cleanRibbon);

        clean.put("items", cleanItems(recipe.get("items")));
        clean.put("card", cleanCard(recipe.get("card")));

        try {
            if (objectMapper.writeValueAsBytes(clean).length > MAX_RECIPE_BYTES) {
                throw new BadRequestException("That bouquet is too big to save.");
            }
        } catch (JsonProcessingException e) {
            throw new BadRequestException("That bouquet could not be read.");
        }
        return clean;
    }

    private List<Map<String, Object>> cleanItems(Object raw) {
        if (!(raw instanceof List<?> items)) throw new BadRequestException("That bouquet has no flowers yet.");
        List<Map<String, Object>> cleaned = new java.util.ArrayList<>(items.size());
        Set<String> ids = new HashSet<>();
        int flowers = 0;
        int cards = 0;
        for (Object o : items) {
            Map<String, Object> item = asMap(o, "One of the flowers could not be read.");
            String id = text(item.get("id"));
            if (id.isEmpty() || id.length() > 16 || !ids.add(id)) {
                throw new BadRequestException("Each item needs its own id.");
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", id);
            String type = oneOf(item.get("type"), Set.of("flower", "card"), "Unknown kind of item.");
            out.put("type", type);
            if (type.equals("flower")) {
                if (++flowers > MAX_FLOWERS) {
                    throw new BadRequestException("That bouquet has too many flowers (max " + MAX_FLOWERS + ").");
                }
                out.put("name", oneOf(item.get("name"), FLOWERS, "That flower is not in the kit."));
                out.put("tint", oneOf(item.get("tint"), TINTS, "Pick one of the flower colours."));
            } else {
                if (++cards > 1) throw new BadRequestException("A bouquet has one letter card.");
                out.put("paper", oneOf(item.get("paper"), PAPERS, "Pick one of the card papers."));
            }
            out.put("x", number(item.get("x"), 0, 400));
            out.put("y", number(item.get("y"), 0, 500));
            out.put("r", number(item.get("r"), -180, 180));
            out.put("s", number(item.get("s"), 0.4, 2.5));
            if (type.equals("flower")) out.put("flip", Boolean.TRUE.equals(item.get("flip")));
            cleaned.add(out);
        }
        return cleaned;
    }

    private Map<String, Object> cleanCard(Object raw) {
        Map<String, Object> card = asMap(raw, "The letter card could not be read.");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("show", !Boolean.FALSE.equals(card.get("show")));
        out.put("to", limited(card.get("to"), MAX_NAME, "The 'to' name is a bit long."));
        out.put("from", limited(card.get("from"), MAX_NAME, "The 'from' name is a bit long."));
        out.put("text", limited(card.get("text"), MAX_TEXT, "The letter is a bit long (max 240 characters)."));
        return out;
    }

    private static String limited(Object value, int max, String message) {
        String s = text(value);
        if (s.length() > max) throw new BadRequestException(message);
        return s;
    }

    private static String text(Object value) {
        return value instanceof String s ? s.trim() : "";
    }

    private static String oneOf(Object value, Set<String> allowed, String message) {
        if (value instanceof String s && allowed.contains(s)) return s;
        throw new BadRequestException(message);
    }

    private static boolean isNumber(Object value) {
        return value instanceof Number n && !Double.isNaN(n.doubleValue()) && !Double.isInfinite(n.doubleValue());
    }

    // Whole numbers stay whole so a recipe round-trips exactly.
    private static Number number(Object value, double min, double max) {
        if (!isNumber(value)) throw new BadRequestException("A flower is missing its position.");
        double d = ((Number) value).doubleValue();
        if (d < min || d > max) throw new BadRequestException("A flower is outside the bouquet.");
        return value instanceof Integer || value instanceof Long ? (Number) value : (Number) d;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value, String message) {
        if (value instanceof Map<?, ?> m) return (Map<String, Object>) m;
        throw new BadRequestException(message);
    }

    private static BouquetDTO toDto(Bouquet bouquet, String authorName) {
        return BouquetDTO.builder()
                .id(bouquet.getId())
                .title(bouquet.getTitle())
                .recipe(bouquet.getRecipe())
                .createdBy(bouquet.getCreatedBy())
                .createdByName(authorName)
                .createdAt(bouquet.getCreatedAt())
                .updatedAt(bouquet.getUpdatedAt())
                .version(bouquet.getVersion())
                .build();
    }
}
