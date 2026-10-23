package com.forsneakypea.fspbackend.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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
    }

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
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
                .andExpect(jsonPath("$.message").value("An unexpected error occurred. Please try again."));
    }
}
