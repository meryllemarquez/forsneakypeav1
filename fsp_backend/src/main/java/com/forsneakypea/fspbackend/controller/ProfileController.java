package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.AvatarUpdateRequestDTO;
import com.forsneakypea.fspbackend.dto.ProfileDTO;
import com.forsneakypea.fspbackend.dto.ProfileUpdateRequestDTO;
import com.forsneakypea.fspbackend.dto.ThemeUpdateRequestDTO;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// Every endpoint here acts only on the caller's own row (resolved from the JWT
// principal, never from a path/query id), so there is no way to address another
// user's profile. SecurityConfig also restricts /api/profile/** to ROLE_USER,
// so the admin account is rejected before it ever reaches this controller.
@RestController
@RequestMapping({"/api/profile", "/api/v1/profile"})
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileDTO>> getProfile() {
        ProfileDTO profile = profileService.getProfile(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile fetched successfully"));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileDTO>> updateProfile(@Valid @RequestBody ProfileUpdateRequestDTO request) {
        ProfileDTO profile = profileService.updateProfile(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    @PutMapping("/theme")
    public ResponseEntity<ApiResponse<ProfileDTO>> updateTheme(@Valid @RequestBody ThemeUpdateRequestDTO request) {
        ProfileDTO profile = profileService.updateTheme(getCurrentUserId(), request.getThemePref());
        return ResponseEntity.ok(ApiResponse.success(profile, "Theme saved"));
    }

    @PutMapping("/avatar")
    public ResponseEntity<ApiResponse<ProfileDTO>> updateAvatar(@Valid @RequestBody AvatarUpdateRequestDTO request) {
        ProfileDTO profile = profileService.updateAvatar(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile picture updated successfully"));
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<ApiResponse<ProfileDTO>> removeAvatar() {
        ProfileDTO profile = profileService.removeAvatar(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile picture removed successfully"));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }
}
