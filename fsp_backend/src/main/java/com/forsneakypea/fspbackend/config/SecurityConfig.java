package com.forsneakypea.fspbackend.config;

import com.forsneakypea.fspbackend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    // Reads both app.allowed-origins AND ALLOWED_ORIGINS env variables
    @Value("${app.allowed-origins:${ALLOWED_ORIGINS:}}")
    private String extraAllowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // 1. Permit Preflight CORS OPTIONS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 2. Permit Auth Endpoints & Error Pages
                .requestMatchers("/api/v1/auth/**", "/api/auth/**", "/error", "/error/**").permitAll()
                // 3. Protect Memory Module
                .requestMatchers("/api/memories/**", "/api/v1/memories/**").authenticated()
                // 4. Protect Date Bucket List Module
                .requestMatchers("/api/dates/**", "/api/v1/dates/**", "/api/date-categories/**", "/api/v1/date-categories/**").authenticated()
                // 5. Protect Love Board Module
                .requestMatchers("/api/love-board/**", "/api/v1/love-board/**").authenticated()
                // 6. Protect Admin Control Center & Notifications
                .requestMatchers("/api/admin/**", "/api/v1/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/notifications/**", "/api/v1/notifications/**").authenticated()
                // 7. Protect Profile Customization Module
                .requestMatchers("/api/profile/**", "/api/v1/profile/**").hasAuthority("ROLE_USER")
                // 8. Authenticate everything else
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Please log in.\"}");
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Automatically allows localhost AND any *.vercel.app domain
        List<String> allowedOriginPatterns = new ArrayList<>(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.vercel.app"
        ));

        if (extraAllowedOrigins != null && !extraAllowedOrigins.isBlank()) {
            Arrays.stream(extraAllowedOrigins.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .forEach(allowedOriginPatterns::add);
        }

        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}