package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.MenuItemDTO;
import com.forsneakypea.fspbackend.dto.request.MenuItemRequest;
import com.forsneakypea.fspbackend.dto.request.MenuReorderRequest;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu-items")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<List<MenuItemDTO>> list() {
        return ResponseEntity.ok(menuService.list());
    }

    @PostMapping
    public ResponseEntity<MenuItemDTO> create(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.create(request, getCurrentUserId()));
    }

    @PutMapping("/order")
    public ResponseEntity<List<MenuItemDTO>> reorder(@Valid @RequestBody MenuReorderRequest request) {
        return ResponseEntity.ok(menuService.reorder(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemDTO> update(@PathVariable UUID id, @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        menuService.delete(id, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user.getId() : null;
    }
}
