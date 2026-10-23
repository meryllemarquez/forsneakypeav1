package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.dto.LoveNoteDTO;
import com.forsneakypea.fspbackend.dto.LoveNoteRequestDTO;
import com.forsneakypea.fspbackend.dto.LoveStickerDTO;
import com.forsneakypea.fspbackend.dto.LoveStickerRequestDTO;
import com.forsneakypea.fspbackend.entity.AttachmentType;
import com.forsneakypea.fspbackend.entity.LoveNote;
import com.forsneakypea.fspbackend.entity.LoveSticker;
import com.forsneakypea.fspbackend.entity.NoteMood;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.LoveNoteRepository;
import com.forsneakypea.fspbackend.repository.LoveStickerRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoveBoardService {

    private final LoveNoteRepository noteRepository;
    private final LoveStickerRepository stickerRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    /* ---------------------------------------------------------------
       NOTES
    --------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<LoveNoteDTO> getVisibleNotes(Long currentUserId) {
        List<LoveNote> visible = noteRepository.findAllByOrderByUpdatedAtDesc().stream()
                .filter(note -> !Boolean.TRUE.equals(note.getIsPrivate())
                        || note.getCreatedBy() == null
                        || note.getCreatedBy().equals(currentUserId))
                .collect(Collectors.toList());

        // Author names are batch-loaded once, and only for the authors that actually appear
        // (see mapNoteToDTO's authorNames-map overload).
        Set<Long> authorIds = visible.stream()
                .map(LoveNote::getCreatedBy)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> authorNames = authorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(authorIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getName));

        return visible.stream()
                .map(note -> mapNoteToDTO(note, currentUserId, authorNames))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoveNoteDTO getNoteById(UUID id, Long currentUserId) {
        LoveNote note = findNoteOrThrow(id);
        // Same visibility rule as getVisibleNotes: a private note is only readable by
        // its author. Thrown as "not found" rather than "forbidden" so a guessed ID
        // can't be used to confirm a private note's existence.
        boolean isPrivateToSomeoneElse = Boolean.TRUE.equals(note.getIsPrivate())
                && note.getCreatedBy() != null
                && !note.getCreatedBy().equals(currentUserId);
        if (isPrivateToSomeoneElse) {
            throw new NotFoundException("Note not found");
        }
        return mapNoteToDTO(note, currentUserId);
    }

    @Transactional
    public LoveNoteDTO createNote(LoveNoteRequestDTO.CreateOrUpdateNote request, Long userId) {
        LoveNote note = LoveNote.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .contentBlocks(request.getContentBlocks())
                .attachments(request.getAttachments())
                .paperImage(request.getPaperImage())
                .attachmentType(parseAttachmentType(request.getAttachmentType()))
                .pinImage(request.getPinImage())
                .tapeImage(request.getTapeImage())
                .color(request.getColor())
                .fontFamily(request.getFontFamily() != null ? request.getFontFamily() : "Patrick Hand")
                .fontSize(request.getFontSize() != null ? request.getFontSize() : 18)
                .fontColor(request.getFontColor() != null ? request.getFontColor() : "#2b2b2b")
                .rotation(request.getRotation() != null ? request.getRotation() : 0.0)
                .positionX(request.getPositionX() != null ? request.getPositionX() : 0.0)
                .positionY(request.getPositionY() != null ? request.getPositionY() : 0.0)
                .zIndex(request.getZIndex() != null ? request.getZIndex() : 1)
                .isFavorite(Boolean.TRUE.equals(request.getIsFavorite()))
                .isArchived(Boolean.TRUE.equals(request.getIsArchived()))
                .isPrivate(Boolean.TRUE.equals(request.getIsPrivate()))
                .mood(parseMood(request.getMood()))
                .createdBy(userId)
                .build();

        note = noteRepository.saveAndFlush(note);
        activityLogService.log(userId, "LOVE_NOTE_CREATED", RelatedEntityType.LOVE_NOTE, note.getId());
        if (!Boolean.TRUE.equals(note.getIsPrivate())) {
            notificationService.notifyOthers(userId, NotificationType.LOVE_NOTE_CREATED, note.getTitle(),
                    RelatedEntityType.LOVE_NOTE, note.getId());
        }

        return mapNoteToDTO(note, userId);
    }

    @Transactional
    public LoveNoteDTO updateNote(UUID id, LoveNoteRequestDTO.NoteUpdate request, Long currentUserId) {
        LoveNote note = findNoteOrThrow(id);

        if (request.getTitle() != null) note.setTitle(request.getTitle());
        if (request.getContent() != null) note.setContent(request.getContent());
        if (request.getContentBlocks() != null) note.setContentBlocks(request.getContentBlocks());
        if (request.getAttachments() != null) note.setAttachments(request.getAttachments());
        if (request.getPaperImage() != null) note.setPaperImage(request.getPaperImage());
        if (request.getAttachmentType() != null) note.setAttachmentType(parseAttachmentType(request.getAttachmentType()));
        if (request.getPinImage() != null) note.setPinImage(request.getPinImage());
        if (request.getTapeImage() != null) note.setTapeImage(request.getTapeImage());
        if (request.getColor() != null) note.setColor(request.getColor());
        if (request.getFontFamily() != null) note.setFontFamily(request.getFontFamily());
        if (request.getFontSize() != null) note.setFontSize(request.getFontSize());
        if (request.getFontColor() != null) note.setFontColor(request.getFontColor());
        if (request.getIsFavorite() != null) note.setIsFavorite(request.getIsFavorite());
        if (request.getIsArchived() != null) note.setIsArchived(request.getIsArchived());
        if (request.getIsPrivate() != null) note.setIsPrivate(request.getIsPrivate());
        if (request.getMood() != null) note.setMood(parseMood(request.getMood()));

        note = noteRepository.saveAndFlush(note);
        if (!Boolean.TRUE.equals(note.getIsPrivate())) {
            notificationService.notifyOthers(currentUserId, NotificationType.LOVE_NOTE_UPDATED, note.getTitle(),
                    RelatedEntityType.LOVE_NOTE, note.getId());
        }

        return mapNoteToDTO(note, currentUserId);
    }

    @Transactional
    public void updateNotePosition(UUID id, LoveNoteRequestDTO.PositionUpdate request) {
        LoveNote note = findNoteOrThrow(id);

        if (request.getPositionX() != null) note.setPositionX(request.getPositionX());
        if (request.getPositionY() != null) note.setPositionY(request.getPositionY());
        if (request.getRotation() != null) note.setRotation(request.getRotation());
        if (request.getZIndex() != null) note.setZIndex(request.getZIndex());

        // Nothing is read back: the endpoint answers 204 and the board already holds the new position.
        noteRepository.save(note);
    }

    @Transactional
    public void deleteNote(UUID id, Long userId) {
        LoveNote note = noteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Note not found"));
        String title = note.getTitle();
        boolean wasPrivate = Boolean.TRUE.equals(note.getIsPrivate());

        noteRepository.deleteById(id);
        activityLogService.log(userId, "LOVE_NOTE_DELETED", RelatedEntityType.LOVE_NOTE, id);
        if (!wasPrivate) {
            notificationService.notifyOthers(userId, NotificationType.LOVE_NOTE_DELETED, title,
                    RelatedEntityType.LOVE_NOTE, id);
        }
    }

    /* ---------------------------------------------------------------
       STICKERS
    --------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<LoveStickerDTO> getStickers() {
        return stickerRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::mapStickerToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LoveStickerDTO createSticker(LoveStickerRequestDTO.CreateSticker request, Long userId) {
        LoveSticker sticker = LoveSticker.builder()
                .image(request.getImage())
                .positionX(request.getPositionX() != null ? request.getPositionX() : 0.0)
                .positionY(request.getPositionY() != null ? request.getPositionY() : 0.0)
                .rotation(request.getRotation() != null ? request.getRotation() : 0.0)
                .scale(request.getScale() != null ? request.getScale() : 1.0)
                .zIndex(request.getZIndex() != null ? request.getZIndex() : 1)
                .createdBy(userId)
                .build();

        sticker = stickerRepository.saveAndFlush(sticker);
        activityLogService.log(userId, "LOVE_STICKER_ADDED", RelatedEntityType.LOVE_STICKER, sticker.getId());

        return mapStickerToDTO(sticker);
    }

    @Transactional
    public LoveStickerDTO updateSticker(UUID id, LoveStickerRequestDTO.StickerUpdate request) {
        LoveSticker sticker = stickerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sticker not found"));

        if (request.getPositionX() != null) sticker.setPositionX(request.getPositionX());
        if (request.getPositionY() != null) sticker.setPositionY(request.getPositionY());
        if (request.getRotation() != null) sticker.setRotation(request.getRotation());
        if (request.getScale() != null) sticker.setScale(request.getScale());
        if (request.getZIndex() != null) sticker.setZIndex(request.getZIndex());
        if (request.getIsLocked() != null) sticker.setIsLocked(request.getIsLocked());

        return mapStickerToDTO(stickerRepository.saveAndFlush(sticker));
    }

    @Transactional
    public void deleteSticker(UUID id, Long userId) {
        if (!stickerRepository.existsById(id)) {
            throw new NotFoundException("Sticker not found");
        }
        stickerRepository.deleteById(id);
        activityLogService.log(userId, "LOVE_STICKER_DELETED", RelatedEntityType.LOVE_STICKER, id);
    }

    /* ---------------------------------------------------------------
       HELPERS
    --------------------------------------------------------------- */

    private LoveNote findNoteOrThrow(UUID id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Note not found"));
    }

    private AttachmentType parseAttachmentType(String value) {
        if (value == null || value.isBlank()) return AttachmentType.NONE;
        try {
            return AttachmentType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid attachment type: " + value);
        }
    }

    private NoteMood parseMood(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return NoteMood.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid mood: " + value);
        }
    }

    private LoveNoteDTO mapNoteToDTO(LoveNote note, Long currentUserId) {
        String authorName = null;
        if (note.getCreatedBy() != null) {
            // The author is usually the authenticated user the JWT filter already loaded.
            authorName = CurrentUser.nameIfId(note.getCreatedBy())
                    .orElseGet(() -> userRepository.findById(note.getCreatedBy())
                            .map(User::getName)
                            .orElse("Unknown"));
        }
        return mapNoteToDTO(note, currentUserId, authorName);
    }

    // Bulk-lookup variant used by getVisibleNotes() to avoid one findById() per note.
    private LoveNoteDTO mapNoteToDTO(LoveNote note, Long currentUserId, Map<Long, String> authorNames) {
        String authorName = note.getCreatedBy() != null
                ? authorNames.getOrDefault(note.getCreatedBy(), "Unknown")
                : null;
        return mapNoteToDTO(note, currentUserId, authorName);
    }

    private LoveNoteDTO mapNoteToDTO(LoveNote note, Long currentUserId, String authorName) {
        return LoveNoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .contentBlocks(note.getContentBlocks())
                .attachments(note.getAttachments())
                .paperImage(note.getPaperImage())
                .attachmentType(note.getAttachmentType() != null ? note.getAttachmentType().name() : null)
                .pinImage(note.getPinImage())
                .tapeImage(note.getTapeImage())
                .color(note.getColor())
                .fontFamily(note.getFontFamily())
                .fontSize(note.getFontSize())
                .fontColor(note.getFontColor())
                .rotation(note.getRotation())
                .positionX(note.getPositionX())
                .positionY(note.getPositionY())
                .zIndex(note.getZIndex())
                .isFavorite(note.getIsFavorite())
                .isArchived(note.getIsArchived())
                .isPrivate(note.getIsPrivate())
                .mood(note.getMood() != null ? note.getMood().name() : null)
                .authorId(note.getCreatedBy())
                .authorName(authorName)
                .isMine(note.getCreatedBy() != null && note.getCreatedBy().equals(currentUserId))
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }

    private LoveStickerDTO mapStickerToDTO(LoveSticker sticker) {
        return LoveStickerDTO.builder()
                .id(sticker.getId())
                .image(sticker.getImage())
                .positionX(sticker.getPositionX())
                .positionY(sticker.getPositionY())
                .rotation(sticker.getRotation())
                .scale(sticker.getScale())
                .zIndex(sticker.getZIndex())
                .isLocked(sticker.getIsLocked())
                .authorId(sticker.getCreatedBy())
                .createdAt(sticker.getCreatedAt())
                .updatedAt(sticker.getUpdatedAt())
                .build();
    }
}
