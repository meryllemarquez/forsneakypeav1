package com.forsneakypea.fspbackend.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * Logs one WARN line for every request slower than a threshold (default 500 ms):
 * {@code slow request method=GET path=/api/v1/dates status=200 durationMs=734}.
 *
 * What is deliberately never logged: the query string, headers (so no Authorization token),
 * request or response bodies (so no passwords or note text), and any id in the path. The path is
 * the route template ({@code /api/v1/dates/{id}}) when Spring matched one, otherwise the raw path
 * with UUID and numeric segments replaced by {@code {id}}.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1) // right after RequestIdFilter, outside Spring Security, so auth time is counted
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestTimingFilter.class);

    private static final Pattern UUID_SEGMENT =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final Pattern NUMERIC_SEGMENT = Pattern.compile("^\\d+$");
    private static final int MAX_PATH_LENGTH = 120;

    private final long thresholdMs;

    public RequestTimingFilter(@Value("${app.observability.slow-request-ms:500}") long thresholdMs) {
        this.thresholdMs = thresholdMs;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        long start = System.nanoTime();
        boolean failed = true;
        try {
            chain.doFilter(request, response);
            failed = false;
        } finally {
            long durationMs = (System.nanoTime() - start) / 1_000_000;
            if (durationMs > thresholdMs) {
                // If an exception escaped the chain the container will answer 500; the response
                // object still says 200 at this point.
                int status = failed ? 500 : response.getStatus();
                log.warn("slow request method={} path={} status={} durationMs={}",
                        request.getMethod(), safePath(request), status, durationMs);
            }
        }
    }

    /** Route template or id-free path: safe to write to logs. */
    public static String safePath(HttpServletRequest request) {
        if (request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE) instanceof String template) {
            return truncate(template);
        }
        return truncate(sanitize(request.getRequestURI()));
    }

    static String sanitize(String uri) {
        if (uri == null || uri.isEmpty()) return "/";
        String[] segments = uri.split("/", -1);
        for (int i = 0; i < segments.length; i++) {
            if (UUID_SEGMENT.matcher(segments[i]).matches() || NUMERIC_SEGMENT.matcher(segments[i]).matches()) {
                segments[i] = "{id}";
            }
        }
        return String.join("/", segments);
    }

    private static String truncate(String path) {
        return path.length() <= MAX_PATH_LENGTH ? path : path.substring(0, MAX_PATH_LENGTH) + "...";
    }
}
