package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.config.SecurityConfig;
import com.forsneakypea.fspbackend.controller.BulkDeleteController;
import com.forsneakypea.fspbackend.service.BulkDeleteService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Who may call the "delete all" endpoints: couple accounts and admins only. */
@WebMvcTest(BulkDeleteController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class BulkDeleteSecurityTest {

    @Autowired MockMvc mvc;

    @MockBean BulkDeleteService bulkDeleteService;
    @MockBean AuthRateLimiter rateLimiter;
    @MockBean JwtUtil jwtUtil;
    @MockBean UserDetailsService userDetailsService;
    @MockBean AuthenticationProvider authenticationProvider;

    /** Signs in as a user holding exactly this authority, through the real JWT filter. */
    private void signInWith(String authority) {
        when(jwtUtil.extractUsername(anyString())).thenReturn("someone");
        when(jwtUtil.validateToken(anyString(), anyString())).thenReturn(true);
        when(userDetailsService.loadUserByUsername("someone"))
                .thenReturn(new User("someone", "x", AuthorityUtils.createAuthorityList(authority)));
    }

    private static final String[] PATHS = {"/api/v1/love-board/all", "/api/v1/memories/all", "/api/v1/dates/all"};

    @Test
    void noTokenIsRejected() throws Exception {
        for (String path : PATHS) {
            mvc.perform(delete(path)).andExpect(status().isUnauthorized());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"ROLE_GUEST", "ROLE_VIEWER", "USER"})
    void otherRolesAreForbidden(String authority) throws Exception {
        signInWith(authority);
        for (String path : PATHS) {
            mvc.perform(delete(path).header("Authorization", "Bearer t")).andExpect(status().isForbidden());
        }
    }

    @Test
    void coupleAccountsAreAllowed() throws Exception {
        signInWith("ROLE_USER");
        when(bulkDeleteService.deleteDates()).thenReturn(Map.of());
        when(bulkDeleteService.deleteMemories()).thenReturn(Map.of());
        when(bulkDeleteService.deleteLoveBoard()).thenReturn(Map.of());
        for (String path : PATHS) {
            mvc.perform(delete(path).header("Authorization", "Bearer t")).andExpect(status().isOk());
        }
    }

    @Test
    void adminsAreAllowed() throws Exception {
        signInWith("ROLE_ADMIN");
        when(bulkDeleteService.deleteDates()).thenReturn(Map.of());
        when(bulkDeleteService.deleteMemories()).thenReturn(Map.of());
        when(bulkDeleteService.deleteLoveBoard()).thenReturn(Map.of());
        for (String path : PATHS) {
            mvc.perform(delete(path).header("Authorization", "Bearer t")).andExpect(status().isOk());
        }
    }
}
