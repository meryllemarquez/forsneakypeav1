package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.config.SecurityConfig;
import com.forsneakypea.fspbackend.controller.AuthController;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.service.AuthService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Loads the real SecurityConfig (and the real default CORS properties) around AuthController. */
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SecurityConfigWebTest {

    @Autowired MockMvc mvc;

    @MockBean AuthService authService;
    @MockBean AuthRateLimiter rateLimiter;
    @MockBean JwtUtil jwtUtil;
    @MockBean UserDetailsService userDetailsService;
    @MockBean AuthenticationProvider authenticationProvider;

    private static final String LOGIN = "/api/v1/auth/login";
    private static final String LOGIN_BODY = "{\"username\":\"u\",\"password\":\"password123\"}";

    // ---- routing: only /api/auth/** and /api/v1/auth/** are public ----

    @Test
    void nonAuthEndpointRequiresAToken() throws Exception {
        mvc.perform(get("/api/v1/memories/folders")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/dates")).andExpect(status().isUnauthorized());
    }

    @Test
    void authEndpointStaysPublic() throws Exception {
        when(authService.login(any())).thenReturn(AuthResponse.builder().token("t").build());
        mvc.perform(post(LOGIN).contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isOk());
    }

    @Test
    void legacyUnprefixedAuthAliasAndBroadAuthPatternAreNoLongerPublic() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/anything/auth/whatever")).andExpect(status().isUnauthorized());
    }

    @Test
    void actuatorHealthIsPublicButOtherActuatorPathsAreNot() throws Exception {
        // No actuator in this slice, so 404 (not 401) proves the path is permitted.
        mvc.perform(get("/actuator/health")).andExpect(status().isNotFound());
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    }

    // ---- CORS ----

    @ParameterizedTest
    @ValueSource(strings = {
            "https://forsneakypea.vercel.app",
            "https://forsneakypeav1-abc123-meryllemarquezs-projects.vercel.app",
            "https://forsneakypeav1-git-perf-improvements-meryllemarquezs-projects.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:3000"
    })
    void corsAllowsProjectAndLocalOrigins(String origin) throws Exception {
        mvc.perform(options(LOGIN)
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://evil.vercel.app",
            "https://someone-elses-app.vercel.app",
            "https://forsneakypeav1-abc.vercel.app",
            "https://forsneakypea-abc123-meryllemarquezs-projects.vercel.app",
            "https://forsneakypeav1-abc123-otherteam.vercel.app",
            "https://forsneakypeav1-abc-meryllemarquezs-projects.vercel.app.evil.com",
            "https://forsneakypea.vercel.app.evil.com",
            "https://evil.com",
            "http://forsneakypea.vercel.app"
    })
    void corsRejectsOtherOrigins(String origin) throws Exception {
        mvc.perform(options(LOGIN)
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
