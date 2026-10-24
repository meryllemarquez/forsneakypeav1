package com.forsneakypea.fspbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

/**
 * Builds and checks the short-lived HMAC-signed URLs that serve private Drive files through
 * MediaController. A URL is valid for 1-2 hours: the expiry is rounded to the hour so the same
 * file gets the same URL for the whole hour and the browser can cache it.
 */
@Slf4j
@Service
public class MediaUrlService {

    public static final String MEDIA_PATH = "/api/v1/media/";
    private static final long BUCKET_SECONDS = 3600;

    public enum Size {
        THUMB("thumb", 480),
        LARGE("large", 1600);

        public final String key;
        public final int px;

        Size(String key, int px) {
            this.key = key;
            this.px = px;
        }

        public static Size fromKey(String key) {
            for (Size s : values()) {
                if (s.key.equals(key)) return s;
            }
            return null;
        }
    }

    @Value("${MEDIA_SIGNING_SECRET:}")
    private String secret;

    private boolean warned;

    /** A signed URL for a Drive file, or {@code legacyUrl} when the row has no Drive file id. */
    public String resolve(String legacyUrl, String driveFileId, Size size) {
        if (driveFileId == null || driveFileId.isBlank()) {
            return legacyUrl;
        }
        return url(driveFileId, size);
    }

    public String url(String fileId, Size size) {
        if (secret.isBlank()) {
            if (!warned) {
                warned = true;
                log.warn("MEDIA_SIGNING_SECRET is not set; Drive photos cannot be served");
            }
            return null;
        }
        long exp = (Instant.now().getEpochSecond() / BUCKET_SECONDS + 2) * BUCKET_SECONDS;
        String sig = sign(fileId, size, exp);
        // Absolute, because the frontend runs on a different origin than this API.
        if (RequestContextHolder.getRequestAttributes() != null) {
            return ServletUriComponentsBuilder.fromCurrentContextPath().path(MEDIA_PATH + fileId)
                    .queryParam("s", size.key).queryParam("e", exp).queryParam("sig", sig).toUriString();
        }
        return MEDIA_PATH + fileId + "?s=" + size.key + "&e=" + exp + "&sig=" + sig;
    }

    public boolean verify(String fileId, Size size, long exp, String sig) {
        if (secret.isBlank() || sig == null || exp < Instant.now().getEpochSecond()) {
            return false;
        }
        return MessageDigest.isEqual(
                sign(fileId, size, exp).getBytes(StandardCharsets.UTF_8),
                sig.getBytes(StandardCharsets.UTF_8));
    }

    /** True for a URL this service issued; such URLs expire, so they must never be stored. */
    public boolean isSignedUrl(String url) {
        return url != null && url.contains(MEDIA_PATH);
    }

    private String sign(String fileId, Size size, long exp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] out = mac.doFinal((fileId + "|" + size.key + "|" + exp).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign media URL", e);
        }
    }
}
