package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.AdminUserDTO;
import com.forsneakypea.fspbackend.dto.AdminUserRequestDTO;
import com.forsneakypea.fspbackend.dto.DashboardStatsDTO;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<AdminUserDTO> updateUser(@PathVariable Long id, @RequestBody AdminUserRequestDTO request) {
        if (request.getActive() == null) {
            return ResponseEntity.ok(adminService.getUser(id));
        }
        return ResponseEntity.ok(adminService.setUserActive(id, request.getActive(), getCurrentUserId(), request.getReason()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @RequestParam(required = false) String reason) {
        adminService.deleteUser(id, getCurrentUserId(), reason);
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
