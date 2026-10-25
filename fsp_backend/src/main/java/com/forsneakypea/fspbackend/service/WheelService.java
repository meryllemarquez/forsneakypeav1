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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Shared decision wheels ("Saan kakain?") and their spin history. Deliberately not part of any
// "delete all" flow: deleting a wheel and clearing its history are the only wipes.
// No activity-log entry: activity_logs.entity_type has a CHECK constraint with no wheel value.
@Service
@RequiredArgsConstructor
public class WheelService {

    static final int MIN_CHOICES = 2;
    static final int MAX_CHOICES = 12;
    static final int MAX_LABEL = 40;
    static final int MAX_WHEELS = 50;
    static final int KEEP_SPINS = 30;
    static final int DEFAULT_SPIN_LIMIT = 8;
    static final Set<String> COLORS = Set.of(
            "sea", "citrus", "gelato", "amalfi", "sea-tint", "citrus-tint", "gelato-tint", "amalfi-tint");

    private final WheelRepository wheelRepository;
    private final WheelSpinRepository spinRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<WheelDTO> list() {
        return wheelRepository.findAllByOrderByUpdatedAtDesc(PageRequest.of(0, MAX_WHEELS))
                .stream().map(WheelService::toDto).toList();
    }

    @Transactional
    public WheelDTO create(WheelRequest request, Long userId) {
        Wheel wheel = Wheel.builder()
                .name(cleanName(request.getName()))
                .choices(cleanChoices(request.getChoices()))
                .createdBy(userId)
                .build();
        wheel = wheelRepository.saveAndFlush(wheel);

        notificationService.notifyOthers(userId, NotificationType.SYSTEM,
                "made a new wheel: " + wheel.getName(), null, null);
        return toDto(wheel);
    }

    @Transactional
    public WheelDTO update(UUID id, WheelRequest request) {
        Wheel wheel = find(id);
        if (request.getVersion() == null || !request.getVersion().equals(wheel.getVersion())) {
            throw new ConflictException("This wheel was just changed by someone else.");
        }
        wheel.setName(cleanName(request.getName()));
        wheel.setChoices(cleanChoices(request.getChoices()));
        return toDto(wheelRepository.saveAndFlush(wheel));
    }

    @Transactional
    public void delete(UUID id) {
        wheelRepository.delete(find(id)); // spins go with it (ON DELETE CASCADE)
    }

    @Transactional
    public WheelSpinDTO addSpin(UUID wheelId, WheelSpinRequest request, Long userId) {
        Wheel wheel = find(wheelId);
        String choiceId = request.getChoiceId();
        if (choiceId == null || choiceId.isBlank()) throw new BadRequestException("Pick a choice to save.");

        WheelChoice choice = wheel.getChoices().stream()
                .filter(c -> c.id().equals(choiceId)).findFirst().orElse(null);
        String label;
        String doodle;
        if (choice != null) {
            label = choice.label();
            doodle = choice.doodle();
        } else {
            // The choice was removed while the wheel was spinning: keep the label the client saw.
            label = request.getLabel() == null ? "" : request.getLabel().trim();
            doodle = null;
            if (label.isEmpty()) throw new BadRequestException("That choice is not on this wheel.");
        }

        WheelSpin spin = spinRepository.saveAndFlush(WheelSpin.builder()
                .wheelId(wheelId)
                .choiceId(choiceId)
                .label(label)
                .doodle(doodle)
                .spunBy(userId)
                .build());
        spinRepository.pruneToNewest(wheelId, KEEP_SPINS);
        return toDto(spin);
    }

    @Transactional
    public WheelSpinDTO setAccepted(UUID spinId, WheelSpinRequest request) {
        WheelSpin spin = spinRepository.findById(spinId)
                .orElseThrow(() -> new NotFoundException("That spin was not found."));
        spin.setAccepted(Boolean.TRUE.equals(request.getAccepted()));
        return toDto(spinRepository.saveAndFlush(spin));
    }

    @Transactional(readOnly = true)
    public List<WheelSpinDTO> listSpins(UUID wheelId, Integer limit) {
        find(wheelId);
        int size = limit == null ? DEFAULT_SPIN_LIMIT : Math.max(1, Math.min(limit, KEEP_SPINS));
        return spinRepository.findByWheelIdOrderBySpunAtDesc(wheelId, PageRequest.of(0, size))
                .stream().map(WheelService::toDto).toList();
    }

    @Transactional
    public void clearSpins(UUID wheelId) {
        find(wheelId);
        spinRepository.deleteAllByWheelId(wheelId);
    }

    private Wheel find(UUID id) {
        return wheelRepository.findById(id).orElseThrow(() -> new NotFoundException("That wheel was not found."));
    }

    private static String cleanName(String name) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("Give the wheel a name.");
        if (trimmed.length() > MAX_LABEL) throw new BadRequestException("That name is a bit long.");
        return trimmed;
    }

    private static List<WheelChoice> cleanChoices(List<WheelChoice> choices) {
        if (choices == null || choices.size() < MIN_CHOICES || choices.size() > MAX_CHOICES) {
            throw new BadRequestException("A wheel needs 2 to 12 choices.");
        }
        Set<String> ids = new HashSet<>();
        List<WheelChoice> cleaned = new ArrayList<>(choices.size());
        for (WheelChoice c : choices) {
            if (c == null) throw new BadRequestException("A wheel needs 2 to 12 choices.");
            String id = c.id() == null ? "" : c.id().trim();
            if (id.isEmpty() || id.length() > 16 || !ids.add(id)) {
                throw new BadRequestException("Each choice needs its own id.");
            }
            String label = c.label() == null ? "" : c.label().trim();
            if (label.isEmpty()) throw new BadRequestException("Give every choice a name.");
            if (label.length() > MAX_LABEL) throw new BadRequestException("A choice name is a bit long.");
            if (c.color() == null || !COLORS.contains(c.color())) {
                throw new BadRequestException("Pick one of the wheel colours.");
            }
            String doodle = c.doodle() == null || c.doodle().isBlank() ? null : c.doodle();
            if (doodle != null && !MenuService.DOODLES.contains(doodle)) {
                throw new BadRequestException("That doodle is not in the kit.");
            }
            cleaned.add(new WheelChoice(id, label, c.color(), doodle));
        }
        return cleaned;
    }

    private static WheelDTO toDto(Wheel wheel) {
        return WheelDTO.builder()
                .id(wheel.getId())
                .name(wheel.getName())
                .choices(wheel.getChoices())
                .version(wheel.getVersion())
                .updatedAt(wheel.getUpdatedAt())
                .build();
    }

    private static WheelSpinDTO toDto(WheelSpin spin) {
        return WheelSpinDTO.builder()
                .id(spin.getId())
                .wheelId(spin.getWheelId())
                .choiceId(spin.getChoiceId())
                .label(spin.getLabel())
                .doodle(spin.getDoodle())
                .accepted(spin.isAccepted())
                .spunBy(spin.getSpunBy())
                .spunAt(spin.getSpunAt())
                .build();
    }
}
