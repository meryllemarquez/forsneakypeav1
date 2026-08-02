package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.LoveNoteDTO;
import com.forsneakypea.fspbackend.dto.LoveNoteRequestDTO;
import com.forsneakypea.fspbackend.dto.LoveStickerDTO;
import com.forsneakypea.fspbackend.dto.LoveStickerRequestDTO;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.LoveBoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/love-board", "/api/v1/love-board"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LoveBoardController {

    private final LoveBoardService loveBoardService;

    /* ---------------------------------------------------------------
       NOTES
    --------------------------------------------------------------- */

    @GetMapping("/notes")
    public ResponseEntity<List<LoveNoteDTO>> getNotes() {
        return ResponseEntity.ok(loveBoardService.getVisibleNotes(getCurrentUserId()));
    }

    @GetMapping("/notes/{id}")
    public ResponseEntity<LoveNoteDTO> getNoteById(@PathVariable UUID id) {
        return ResponseEntity.ok(loveBoardService.getNoteById(id, getCurrentUserId()));
    }

    @PostMapping("/notes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoveNoteDTO> createNote(
            @Valid @RequestBody LoveNoteRequestDTO.CreateOrUpdateNote request) {
        return ResponseEntity.ok(loveBoardService.createNote(request, getCurrentUserId()));
    }

    @PutMapping("/notes/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoveNoteDTO> updateNote(
            @PathVariable UUID id,
            @RequestBody LoveNoteRequestDTO.NoteUpdate request) {
        return ResponseEntity.ok(loveBoardService.updateNote(id, request, getCurrentUserId()));
    }

    @PatchMapping("/notes/{id}/position")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoveNoteDTO> updateNotePosition(
            @PathVariable UUID id,
            @RequestBody LoveNoteRequestDTO.PositionUpdate request) {
        return ResponseEntity.ok(loveBoardService.updateNotePosition(id, request, getCurrentUserId()));
    }

    @DeleteMapping("/notes/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        loveBoardService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }

    /* ---------------------------------------------------------------
       STICKERS
    --------------------------------------------------------------- */

    @GetMapping("/stickers")
    public ResponseEntity<List<LoveStickerDTO>> getStickers() {
        return ResponseEntity.ok(loveBoardService.getStickers());
    }

    @PostMapping("/stickers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoveStickerDTO> createSticker(
            @Valid @RequestBody LoveStickerRequestDTO.CreateSticker request) {
        return ResponseEntity.ok(loveBoardService.createSticker(request, getCurrentUserId()));
    }

    @PatchMapping("/stickers/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoveStickerDTO> updateSticker(
            @PathVariable UUID id,
            @RequestBody LoveStickerRequestDTO.StickerUpdate request) {
        return ResponseEntity.ok(loveBoardService.updateSticker(id, request));
    }

    @DeleteMapping("/stickers/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSticker(@PathVariable UUID id) {
        loveBoardService.deleteSticker(id);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }
}
