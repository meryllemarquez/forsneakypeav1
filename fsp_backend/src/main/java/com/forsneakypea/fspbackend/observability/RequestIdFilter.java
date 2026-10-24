package com.forsneakypea.fspbackend.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Gives every request a short id. It is exposed three ways so a user report can be matched to the
 * server log: the {@code X-Request-Id} response header, the {@code requestId} field in the body of
 * a 500 error, and the {@code [id]} printed on every log line written while the request runs.
 *
 * The id is always generated here; a client-supplied value is never trusted (it could be used to
 * forge or inject log content).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";
    public static final String REQUEST_ATTRIBUTE = RequestIdFilter.class.getName() + ".ID";

    /** 8 hex characters: short enough to read out loud, plenty to tell apart the requests of one day. */
    public static String newId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    /** The id of the request being handled, or null outside a request. */
    public static String currentId(HttpServletRequest request) {
        if (request != null && request.getAttribute(REQUEST_ATTRIBUTE) instanceof String id) return id;
        return MDC.get(MDC_KEY);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String id = newId();
        request.setAttribute(REQUEST_ATTRIBUTE, id);
        response.setHeader(HEADER, id);
        MDC.put(MDC_KEY, id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
