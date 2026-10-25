package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.PetDTO;
import com.forsneakypea.fspbackend.dto.request.PetActionRequest;
import com.forsneakypea.fspbackend.dto.response.PetActionResponse;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pets")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<PetDTO> pets = petService.list();
        return ResponseEntity.ok(Map.of("serverTime", Instant.now().toString(), "pets", pets));
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<PetActionResponse> act(@PathVariable String id, @Valid @RequestBody PetActionRequest request) {
        return ResponseEntity.ok(petService.act(id, request.getAction(), getCurrentUserId()));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user.getId() : null;
    }
}
