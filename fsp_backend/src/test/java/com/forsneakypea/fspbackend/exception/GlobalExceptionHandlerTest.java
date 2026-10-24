package com.forsneakypea.fspbackend.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.forsneakypea.fspbackend.observability.RequestIdFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class ThrowingController {
        @GetMapping("/t/illegal-argument") void illegalArgument() { throw new IllegalArgumentException("That photo doesn't belong to this album."); }
        @GetMapping("/t/bad-request") void badRequest() { throw new BadRequestException("Invalid attachment type: foo"); }
        @GetMapping("/t/not-found") void notFound() { throw new NotFoundException("Folder not found"); }
        @GetMapping("/t/resource-not-found") void resourceNotFound() { throw new ResourceNotFoundException("Date not found"); }
        @GetMapping("/t/forbidden") void forbidden() { throw new AccessDeniedException("nope"); }
        @GetMapping("/t/bad-credentials") void badCredentials() { throw new BadCredentialsException("Incorrect username or password"); }
        @GetMapping("/t/user-not-found") void userNotFound() { throw new UsernameNotFoundException("no such user"); }
        @GetMapping("/t/auth-required") void authRequired() { throw new InsufficientAuthenticationException("Full authentication is required"); }
        @GetMapping("/t/boom") void boom() { throw new RuntimeException("secret internal detail"); }
        @GetMapping("/t/number/{n}") void number(@PathVariable int n) { }
        @PostMapping("/t/post-only") void postOnly() { }
    }

    private MockMvc mvc;
    private final Logger handlerLogger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new RequestIdFilter())
                .build();
        logs.start();
        handlerLogger.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        handlerLogger.detachAppender(logs);
    }

    @Test
    void illegalArgumentIsBadRequestNotUnauthorized() throws Exception {
        mvc.perform(get("/t/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("That photo doesn't belong to this album."));
    }

    @Test
    void badRequestExceptionIs400() throws Exception {
        mvc.perform(get("/t/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid attachment type: foo"));
    }

    @Test
    void notFoundExceptionIs404() throws Exception {
        mvc.perform(get("/t/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Folder not found"));
    }

    @Test
    void resourceNotFoundExceptionIsStill404() throws Exception {
        mvc.perform(get("/t/resource-not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Date not found"));
    }

    @Test
    void accessDeniedIs403() throws Exception {
        mvc.perform(get("/t/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void badCredentialsIs401() throws Exception {
        mvc.perform(get("/t/bad-credentials"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Incorrect username or password"));
    }

    @Test
    void usernameNotFoundIs401() throws Exception {
        mvc.perform(get("/t/user-not-found")).andExpect(status().isUnauthorized());
    }

    @Test
    void otherAuthenticationFailuresAre401() throws Exception {
        mvc.perform(get("/t/auth-required")).andExpect(status().isUnauthorized());
    }

    @Test
    void unexpectedErrorsStay500WithoutLeakingDetail() throws Exception {
        mvc.perform(get("/t/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("An unexpected error occurred. Please try again. (ref: ")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret internal detail"))));
    }

    @Test
    void a500ReturnsTheSameRequestIdInHeaderBodyAndLog() throws Exception {
        org.springframework.mock.web.MockHttpServletResponse response = mvc.perform(get("/t/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.requestId").exists())
                .andReturn().getResponse();
        String headerId = response.getHeader(RequestIdFilter.HEADER);

        assertNotNull(headerId);
        assertEquals(8, headerId.length());
        assertTrue(response.getContentAsString().contains("\"requestId\":\"" + headerId + "\""), response.getContentAsString());
        assertTrue(response.getContentAsString().contains("(ref: " + headerId + ")"), response.getContentAsString());

        ILoggingEvent error = logs.list.stream().filter(e -> e.getLevel() == Level.ERROR).findFirst().orElseThrow();
        assertTrue(error.getFormattedMessage().contains("requestId=" + headerId), error.getFormattedMessage());
        assertTrue(error.getFormattedMessage().contains("type=java.lang.RuntimeException"), error.getFormattedMessage());
        assertTrue(error.getFormattedMessage().contains("path=/t/boom"), error.getFormattedMessage());
    }

    @Test
    void theLogLineNamesTheExceptionTypeButNotItsMessage() throws Exception {
        mvc.perform(get("/t/boom")).andExpect(status().isInternalServerError());

        assertEquals(1, logs.list.stream().filter(e -> e.getLevel() == Level.ERROR).count());
        ILoggingEvent event = logs.list.get(0);
        assertFalse(event.getFormattedMessage().contains("secret internal detail"));
        assertNotNull(event.getThrowableProxy()); // the stack trace is still logged for debugging
    }

    @Test
    void everyResponseCarriesARequestIdHeader() throws Exception {
        String id = mvc.perform(get("/t/not-found")).andReturn().getResponse().getHeader(RequestIdFilter.HEADER);

        assertNotNull(id);
        assertEquals(8, id.length());
    }

    @Test
    void aMalformedPathParameterIs400NotA500() throws Exception {
        mvc.perform(get("/t/number/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        assertTrue(logs.list.stream().noneMatch(e -> e.getLevel() == Level.ERROR));
    }

    @Test
    void aWrongHttpMethodIs405NotA500() throws Exception {
        mvc.perform(get("/t/post-only")).andExpect(status().isMethodNotAllowed());
        assertTrue(logs.list.stream().noneMatch(e -> e.getLevel() == Level.ERROR));
    }
}
