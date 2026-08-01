package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.DateCategoryDTO;
import com.forsneakypea.fspbackend.dto.DateCategoryRequestDTO;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.DateCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/date-categories", "/api/v1/date-categories"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DateCategoryController {

    private final DateCategoryService dateCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DateCategoryDTO>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(
                dateCategoryService.getAllCategories(), "Categories retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateCategoryDTO>> createCategory(
            @Valid @RequestBody DateCategoryRequestDTO.Create request) {
        DateCategoryDTO created = dateCategoryService.createCategory(
                request.getName(), request.getColorHex(), request.getIcon(), request.getDescription(), getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(created, "Category created successfully"));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }
}
