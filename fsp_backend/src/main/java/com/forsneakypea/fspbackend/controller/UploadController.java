package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.service.UploadService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

    private final UploadService uploadService;
    private final CorsConfigurationSource corsSource;

    // Qualified because Spring MVC registers its own CorsConfigurationSource beans too.
    public UploadController(UploadService uploadService,
                            @Qualifier("corsConfigurationSource") CorsConfigurationSource corsSource) {
        this.uploadService = uploadService;
        this.corsSource = corsSource;
    }

    /** Returns a Drive resumable-upload URL the browser PUTs the image to. */
    @PostMapping("/session")
    public ResponseEntity<Map<String, String>> createSession(
            @Valid @RequestBody SessionRequest request, HttpServletRequest http) {
        String origin = http.getHeader("Origin");
        if (origin != null) {
            // Same allow-list as the API's CORS config, so a foreign site cannot get an upload URL.
            CorsConfiguration cors = corsSource.getCorsConfiguration(http);
            if (cors == null || cors.checkOrigin(origin) == null) {
                throw new BadRequestException("Origin not allowed.");
            }
        }
        String uploadUrl = uploadService.createSession(
                request.getTarget(), request.getMimeType(), request.getSize(), origin);
        return ResponseEntity.ok(Map.of("uploadUrl", uploadUrl));
    }

    @Data
    public static class SessionRequest {
        @NotBlank
        private String target;
        @NotBlank
        private String mimeType;
        @NotNull
        private Long size;
    }
}
