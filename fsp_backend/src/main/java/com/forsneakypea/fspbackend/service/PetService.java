package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.PetDTO;
import com.forsneakypea.fspbackend.dto.response.PetActionResponse;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.Pet;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import com.forsneakypea.fspbackend.repository.PetRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

// The nine little ones. Permanent characters: no create/delete, and deliberately not part of any
// "delete all". Stats are computed from the snapshot on read; only a tap writes a row.
@Service
@RequiredArgsConstructor
public class PetService {

    static final Duration COOLDOWN = Duration.ofSeconds(8);
    static final Duration HUG_NOTIFY_WINDOW = Duration.ofMinutes(30);
    static final Set<String> ACTIONS = Set.of("feed", "play", "hug", "walk");

    private static final Map<String, List<String>> LINES = Map.of(
            "ate", List.of("nom nom", "yum!", "more please?"),
            "already_full", List.of("not hungry right now, but thank you", "too full, but so sweet", "maybe later, love"),
            "played", List.of("again again", "so fun", "wheee"),
            "too_sleepy", List.of("too sleepy, nap first?", "a little tired, maybe a hug?", "yawn, soon"),
            "hugged", List.of("warm", "best hug", "again?"),
            "walked", List.of("good walk", "sniff sniff", "that was fun"));

    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PetDTO> list() {
        return list(OffsetDateTime.now());
    }

    List<PetDTO> list(OffsetDateTime now) {
        List<Pet> pets = petRepository.findAllByOrderBySortOrderAsc();
        Set<Long> ids = pets.stream().map(Pet::getLastActionBy).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, String> names = new HashMap<>();
        if (!ids.isEmpty()) userRepository.findAllById(ids).forEach(u -> names.put(u.getId(), u.getName()));
        return pets.stream().map(p -> toDto(p, now, names.get(p.getLastActionBy()))).toList();
    }

    @Transactional
    public PetActionResponse act(String petId, String action, Long userId) {
        return act(petId, action, userId, OffsetDateTime.now());
    }

    PetActionResponse act(String petId, String action, Long userId, OffsetDateTime now) {
        String act = action == null ? "" : action.trim().toLowerCase();
        if (!ACTIONS.contains(act)) throw new BadRequestException("Unknown action.");
        Pet pet = petRepository.findForUpdate(petId).orElseThrow(() -> new NotFoundException("Pet not found."));
        if ("walk".equals(act) && !"dog".equals(pet.getKind())) {
            throw new BadRequestException("Plushies don't go for walks.");
        }

        // Only the latest action is stored, so the cooldown covers a repeat of that same action.
        if (act.equals(pet.getLastAction()) && pet.getLastActionAt() != null
                && Duration.between(pet.getLastActionAt(), now).compareTo(COOLDOWN) < 0) {
            throw new RateLimitExceededException("Give " + pet.getName() + " a moment, love.");
        }

        PetMath.Stats cur = current(pet, now);
        String kind = switch (act) {
            case "feed" -> cur.fullness() >= 95 ? "already_full" : "ate";
            case "play" -> cur.energy() < 20 ? "too_sleepy" : "played";
            case "walk" -> cur.energy() < 25 ? "too_sleepy" : "walked";
            default -> "hugged";
        };

        boolean hugRepeat = "hug".equals(act) && "hug".equals(pet.getLastAction())
                && userId != null && userId.equals(pet.getLastActionBy())
                && pet.getLastActionAt() != null
                && Duration.between(pet.getLastActionAt(), now).compareTo(HUG_NOTIFY_WINDOW) < 0;

        if (!kind.equals("already_full") && !kind.equals("too_sleepy")) {
            int f = cur.fullness(), e = cur.energy(), j = cur.joy();
            switch (act) {
                case "feed" -> { f += 35; j += 8; pet.setFedCount(pet.getFedCount() + 1); }
                case "play" -> { f -= 4; e -= 22; j += 18; pet.setPlayCount(pet.getPlayCount() + 1); }
                case "hug" -> { e += 2; j += 25; pet.setHugCount(pet.getHugCount() + 1); }
                default -> { f -= 8; e -= 32; j += 24; pet.setWalkCount(pet.getWalkCount() + 1); }
            }
            pet.setFullnessBase(PetMath.clamp(f));
            pet.setEnergyBase(PetMath.clamp(e));
            pet.setJoyBase(PetMath.clamp(j));
            pet.setSnapshotAt(now);
        }
        // A gentle "no" still counts as a visit and arms the cooldown against repeat taps.
        pet.setLastAction(act);
        pet.setLastActionBy(userId);
        pet.setLastActionAt(now);
        petRepository.saveAndFlush(pet);

        if ("hug".equals(act) && !hugRepeat && userId != null) {
            notificationService.notifyOthers(userId, NotificationType.SYSTEM,
                    "gave " + pet.getName() + " a hug", null, null);
        }

        String byName = userId == null ? null : CurrentUser.nameIfId(userId)
                .orElseGet(() -> userRepository.findById(userId).map(User::getName).orElse(null));
        return new PetActionResponse(toDto(pet, now, byName),
                new PetActionResponse.Reaction(kind, pickLine(kind)));
    }

    private static String pickLine(String kind) {
        List<String> lines = LINES.get(kind);
        return lines.get(ThreadLocalRandom.current().nextInt(lines.size()));
    }

    private static PetMath.Stats current(Pet p, OffsetDateTime now) {
        double dtHours = Duration.between(p.getSnapshotAt(), now).toMillis() / 3_600_000.0;
        return PetMath.at(p.getFullnessBase(), p.getEnergyBase(), p.getJoyBase(), dtHours);
    }

    private static PetDTO toDto(Pet p, OffsetDateTime now, String byName) {
        PetMath.Stats s = current(p, now);
        PetDTO.Last last = p.getLastAction() == null ? null
                : new PetDTO.Last(p.getLastAction(), p.getLastActionBy(), byName, p.getLastActionAt());
        return new PetDTO(p.getId(), p.getName(), p.getKind(),
                new PetDTO.Stats(s.fullness(), s.energy(), s.joy()), PetMath.mood(s),
                new PetDTO.Counts(p.getFedCount(), p.getPlayCount(), p.getHugCount(), p.getWalkCount()), last);
    }
}
