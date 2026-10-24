package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.service.DriveClient;
import com.forsneakypea.fspbackend.service.MediaUrlService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Streams a private Drive image. Public in Spring Security terms: the HMAC-signed, expiring URL
 * is the credential (an img tag cannot send an Authorization header).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaUrlService mediaUrls;
    private final DriveClient drive;

    @GetMapping("/{fileId:[A-Za-z0-9_-]{10,100}}")
    public void get(
            @PathVariable String fileId,
            @RequestParam("s") String sizeKey,
            @RequestParam("e") long expires,
            @RequestParam("sig") String signature,
            HttpServletResponse response) throws IOException {

        MediaUrlService.Size size = MediaUrlService.Size.fromKey(sizeKey);
        if (size == null || !mediaUrls.verify(fileId, size, expires, signature)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        DriveClient.Download download;
        try {
            download = drive.openThumbnail(fileId, size.px);
            if (download == null) {
                download = drive.openOriginal(fileId);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.sendError(HttpServletResponse.SC_BAD_GATEWAY);
            return;
        } catch (Exception e) {
            log.warn("Could not fetch Drive file {}: {}", fileId, e.getMessage());
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        response.setContentType(download.contentType());
        if (download.contentLength() >= 0) {
            response.setContentLengthLong(download.contentLength());
        }
        // A file id never changes content, so the browser may keep it for a long time.
        response.setHeader("Cache-Control", "private, max-age=604800, immutable");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

        // Copied in small chunks: the image is never held in memory as a whole.
        try (InputStream in = download.body(); OutputStream out = response.getOutputStream()) {
            in.transferTo(out);
        }
    }
}
