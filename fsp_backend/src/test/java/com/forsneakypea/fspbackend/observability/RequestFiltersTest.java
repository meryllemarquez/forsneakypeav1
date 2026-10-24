package com.forsneakypea.fspbackend.observability;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestFiltersTest {

    private final Logger timingLogger = (Logger) LoggerFactory.getLogger(RequestTimingFilter.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    void attach() {
        logs.start();
        timingLogger.addAppender(logs);
    }

    @AfterEach
    void detach() {
        timingLogger.detachAppender(logs);
    }

    private static MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.setRequestURI(uri);
        return request;
    }

    private static void pause(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static MockFilterChain sleeping(long ms) {
        return new MockFilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) throws IOException, ServletException {
                pause(ms);
                super.doFilter(req, res);
            }
        };
    }

    // ---- RequestIdFilter ----

    @Test
    void requestIdIsEightHexCharsInTheHeaderAndTheLogContextButNeverTrustedFromTheClient() throws Exception {
        MockHttpServletRequest request = request("/api/v1/dates");
        request.addHeader("X-Request-Id", "forged-INJECTED-LOG-LINE");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> seenInMdc = new AtomicReference<>();

        new RequestIdFilter().doFilter(request, response, new MockFilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) {
                seenInMdc.set(MDC.get(RequestIdFilter.MDC_KEY));
            }
        });

        String id = response.getHeader("X-Request-Id");
        assertTrue(id.matches("[0-9a-f]{8}"), id);
        assertEquals(id, seenInMdc.get());
        assertEquals(id, RequestIdFilter.currentId(request));
        assertNull(MDC.get(RequestIdFilter.MDC_KEY), "context is cleared after the request");
    }

    @Test
    void eachRequestGetsADifferentId() throws Exception {
        MockHttpServletResponse a = new MockHttpServletResponse();
        MockHttpServletResponse b = new MockHttpServletResponse();
        new RequestIdFilter().doFilter(request("/x"), a, new MockFilterChain());
        new RequestIdFilter().doFilter(request("/x"), b, new MockFilterChain());

        assertNotEquals(a.getHeader("X-Request-Id"), b.getHeader("X-Request-Id"));
    }

    // ---- RequestTimingFilter ----

    @Test
    void aSlowRequestLogsOneWarnLineWithMethodPathStatusAndDuration() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(200);

        new RequestTimingFilter(50).doFilter(request("/api/v1/dates"), response, sleeping(90));

        assertEquals(1, logs.list.size());
        ILoggingEvent event = logs.list.get(0);
        assertEquals(Level.WARN, event.getLevel());
        String line = event.getFormattedMessage();
        assertTrue(line.startsWith("slow request method=GET path=/api/v1/dates status=200 durationMs="), line);
        long duration = Long.parseLong(line.substring(line.lastIndexOf('=') + 1));
        assertTrue(duration >= 80, line);
    }

    @Test
    void aFastRequestLogsNothing() throws Exception {
        new RequestTimingFilter(500).doFilter(request("/api/v1/dates"), new MockHttpServletResponse(), new MockFilterChain());

        assertTrue(logs.list.isEmpty());
    }

    @Test
    void theLogLineNeverContainsQueryStringTokensBodiesOrIds() throws Exception {
        MockHttpServletRequest request = request("/api/v1/dates/123e4567-e89b-12d3-a456-426614174000/checklist-items/42");
        request.setQueryString("includeArchived=true&email=someone@example.com&token=secret-query-token");
        request.addHeader("Authorization", "Bearer super-secret-jwt");
        request.setContent("{\"password\":\"hunter2\",\"title\":\"private note text\"}".getBytes());
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RequestTimingFilter(10).doFilter(request, response, sleeping(40));

        String line = logs.list.get(0).getFormattedMessage();
        assertTrue(line.contains("path=/api/v1/dates/{id}/checklist-items/{id} "), line);
        for (String forbidden : new String[]{"123e4567", "includeArchived", "someone@example.com", "secret-query-token",
                "super-secret-jwt", "Bearer", "hunter2", "private note text"}) {
            assertFalse(line.contains(forbidden), "log line leaked '" + forbidden + "': " + line);
        }
    }

    @Test
    void whenSpringMatchedARouteTheTemplateIsLoggedInsteadOfTheRawPath() throws Exception {
        MockHttpServletRequest request = request("/api/v1/admin/users/17");
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) throws IOException, ServletException {
                pause(30);
                req.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/v1/admin/users/{id}");
                super.doFilter(req, res);
            }
        };

        new RequestTimingFilter(10).doFilter(request, new MockHttpServletResponse(), chain);

        assertTrue(logs.list.get(0).getFormattedMessage().contains("path=/api/v1/admin/users/{id} "));
    }

    @Test
    void theResponseStatusIsLogged() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(503);

        new RequestTimingFilter(10).doFilter(request("/api/v1/dates"), response, sleeping(30));

        assertTrue(logs.list.get(0).getFormattedMessage().contains("status=503"));
    }

    @Test
    void anExceptionEscapingTheChainIsLoggedAs500AndStillPropagates() {
        MockFilterChain failing = new MockFilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) throws ServletException {
                pause(30);
                throw new ServletException("boom");
            }
        };

        assertThrows(ServletException.class,
                () -> new RequestTimingFilter(10).doFilter(request("/api/v1/dates"), new MockHttpServletResponse(), failing));

        assertTrue(logs.list.get(0).getFormattedMessage().contains("status=500"));
    }

    @Test
    void sanitizeReplacesUuidAndNumericSegmentsOnly() {
        assertEquals("/api/v1/dates/{id}/favorite",
                RequestTimingFilter.sanitize("/api/v1/dates/123e4567-e89b-12d3-a456-426614174000/favorite"));
        assertEquals("/api/v1/admin/users/{id}", RequestTimingFilter.sanitize("/api/v1/admin/users/17"));
        assertEquals("/api/v1/memories/folders", RequestTimingFilter.sanitize("/api/v1/memories/folders"));
        assertEquals("/", RequestTimingFilter.sanitize(""));
    }
}
