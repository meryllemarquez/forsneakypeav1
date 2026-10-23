package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.HomeSummaryDTO;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/home", "/api/v1/home"})
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class HomeController {

    private final HomeService homeService;

    /** One small response with everything the Home page shows. */
    @GetMapping("/summary")
    public ResponseEntity<HomeSummaryDTO> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        return ResponseEntity.ok(homeService.getSummary(getCurrentUserId(), today));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user.getId() : null;
    }
}
