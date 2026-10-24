package com.forsneakypea.fspbackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Thin client for the Google Drive v3 REST API, authenticated with the app owner's OAuth refresh
 * token. Responses are never buffered whole: file bytes are handed back as streams.
 * Error messages carry only an HTTP status, never a response body, so nothing sensitive is logged.
 */
@Slf4j
@Component
public class DriveClient {

    private static final String DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
    private static final String DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

    /** Subset of a Drive file's metadata the app cares about. */
    public record FileInfo(String id, String mimeType, List<String> parents, boolean trashed, long size, String thumbnailLink) {}

    /** An open response body from Drive, to be copied to the client and closed. */
    public record Download(InputStream body, String contentType, long contentLength) {}

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    // Trashing after a delete must not slow the request down, and a single thread keeps Drive calls gentle.
    private final ExecutorService trashExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "drive-trash");
        t.setDaemon(true);
        return t;
    });
    // thumbnailLink values are short-lived, so cache them for much less than their lifetime.
    private final Cache<String, String> thumbnailLinks = Caffeine.newBuilder()
            .maximumSize(2000).expireAfterWrite(Duration.ofMinutes(20)).build();

    @Value("${GOOGLE_DRIVE_OAUTH_CLIENT_ID:}")
    private String clientId;
    @Value("${GOOGLE_DRIVE_OAUTH_CLIENT_SECRET:}")
    private String clientSecret;
    @Value("${GOOGLE_DRIVE_REFRESH_TOKEN:}")
    private String refreshToken;

    private volatile String accessToken;
    private volatile long accessTokenExpiresAtMs;

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank() && !refreshToken.isBlank();
    }

    /** A valid access token, refreshed shortly before it expires. */
    public synchronized String accessToken() throws IOException, InterruptedException {
        if (accessToken != null && System.currentTimeMillis() < accessTokenExpiresAtMs - 60_000) {
            return accessToken;
        }
        String form = "client_id=" + enc(clientId)
                + "&client_secret=" + enc(clientSecret)
                + "&refresh_token=" + enc(refreshToken)
                + "&grant_type=refresh_token";
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();
        JsonNode json = sendJson(req, "token refresh");
        accessToken = json.get("access_token").asText();
        accessTokenExpiresAtMs = System.currentTimeMillis() + json.path("expires_in").asLong(3600) * 1000;
        return accessToken;
    }

    public String findOrCreateFolder(String name, String parentId) throws IOException, InterruptedException {
        String q = "name='" + name + "' and mimeType='application/vnd.google-apps.folder' and trashed=false and '" + parentId + "' in parents";
        JsonNode files = sendJson(authed(DRIVE_FILES + "?fields=files(id)&pageSize=1&q=" + enc(q)).GET().build(), "folder lookup").path("files");
        if (files.size() > 0) {
            return files.get(0).get("id").asText();
        }
        String body = mapper.writeValueAsString(Map.of(
                "name", name, "mimeType", "application/vnd.google-apps.folder", "parents", List.of(parentId)));
        return sendJson(authed(DRIVE_FILES + "?fields=id").header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build(), "folder create").get("id").asText();
    }

    /**
     * Starts a resumable upload into {@code parentId} and returns the session URL the browser PUTs to.
     * {@code origin} is forwarded so Google answers the browser's cross-origin upload with CORS headers.
     */
    public String createUploadSession(String parentId, String fileName, String mimeType, long size, String origin)
            throws IOException, InterruptedException {
        String body = mapper.writeValueAsString(Map.of("name", fileName, "mimeType", mimeType, "parents", List.of(parentId)));
        HttpRequest.Builder req = authed(DRIVE_UPLOAD + "?uploadType=resumable&fields=id")
                .header("Content-Type", "application/json; charset=UTF-8")
                .header("X-Upload-Content-Type", mimeType)
                .header("X-Upload-Content-Length", Long.toString(size));
        if (origin != null) {
            req.header("Origin", origin);
        }
        HttpResponse<Void> res = http.send(req.POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.discarding());
        if (res.statusCode() / 100 != 2) {
            throw new IllegalStateException("upload session returned HTTP " + res.statusCode());
        }
        return res.headers().firstValue("Location")
                .orElseThrow(() -> new IllegalStateException("upload session returned no Location"));
    }

    /** Metadata for a file, or null if Drive says it doesn't exist. */
    public FileInfo getFileInfo(String fileId) throws IOException, InterruptedException {
        HttpResponse<String> res = http.send(
                authed(DRIVE_FILES + "/" + enc(fileId) + "?fields=id,mimeType,parents,trashed,size,thumbnailLink").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() == 404) {
            return null;
        }
        if (res.statusCode() / 100 != 2) {
            throw new IllegalStateException("file lookup returned HTTP " + res.statusCode());
        }
        JsonNode json = mapper.readTree(res.body());
        List<String> parents = new java.util.ArrayList<>();
        json.path("parents").forEach(p -> parents.add(p.asText()));
        String thumb = json.path("thumbnailLink").asText(null);
        if (thumb != null) {
            thumbnailLinks.put(fileId, thumb);
        }
        return new FileInfo(json.path("id").asText(), json.path("mimeType").asText(""), parents,
                json.path("trashed").asBoolean(false), json.path("size").asLong(0), thumb);
    }

    /** The original file bytes. */
    public Download openOriginal(String fileId) throws IOException, InterruptedException {
        return open(authed(DRIVE_FILES + "/" + enc(fileId) + "?alt=media").GET().build());
    }

    /**
     * A Drive-rendered thumbnail whose longest side is {@code px}, or null when Drive has none
     * (the caller then falls back to the original).
     */
    public Download openThumbnail(String fileId, int px) throws IOException, InterruptedException {
        String link = thumbnailLinks.getIfPresent(fileId);
        if (link == null) {
            FileInfo info = getFileInfo(fileId);
            link = info == null ? null : info.thumbnailLink();
        }
        if (link == null) {
            return null;
        }
        String sized = link.replaceFirst("=s\\d+(-c)?$", "") + "=s" + px;
        try {
            return open(authed(sized).GET().build());
        } catch (IllegalStateException e) {
            // Stale link: forget it so the next request fetches a fresh one.
            thumbnailLinks.invalidate(fileId);
            return null;
        }
    }

    /** Moves files to the Drive trash once the surrounding transaction commits; failures are only logged. */
    public void trashAfterCommit(Collection<String> fileIds) {
        List<String> ids = fileIds.stream().filter(id -> id != null && !id.isBlank()).distinct().toList();
        if (ids.isEmpty() || !isConfigured()) {
            return;
        }
        Runnable trash = () -> trashExecutor.execute(() -> ids.forEach(this::trashQuietly));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    trash.run();
                }
            });
        } else {
            trash.run();
        }
    }

    private void trashQuietly(String fileId) {
        try {
            HttpRequest req = authed(DRIVE_FILES + "/" + enc(fileId) + "?fields=id")
                    .header("Content-Type", "application/json")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString("{\"trashed\":true}"))
                    .build();
            HttpResponse<Void> res = http.send(req, HttpResponse.BodyHandlers.discarding());
            if (res.statusCode() / 100 != 2 && res.statusCode() != 404) {
                log.warn("Could not trash Drive file {}: HTTP {}", fileId, res.statusCode());
            }
        } catch (Exception e) {
            log.warn("Could not trash Drive file {}: {}", fileId, e.getMessage());
        }
    }

    private Download open(HttpRequest req) throws IOException, InterruptedException {
        HttpResponse<InputStream> res = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (res.statusCode() / 100 != 2) {
            res.body().close();
            throw new IllegalStateException("download returned HTTP " + res.statusCode());
        }
        return new Download(res.body(),
                res.headers().firstValue("Content-Type").orElse("application/octet-stream"),
                res.headers().firstValueAsLong("Content-Length").orElse(-1));
    }

    private HttpRequest.Builder authed(String url) throws IOException, InterruptedException {
        return HttpRequest.newBuilder(URI.create(url)).header("Authorization", "Bearer " + accessToken());
    }

    private JsonNode sendJson(HttpRequest req, String what) throws IOException, InterruptedException {
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() / 100 != 2) {
            throw new IllegalStateException(what + " returned HTTP " + res.statusCode());
        }
        return mapper.readTree(res.body());
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
