package com.forsneakypea.fspbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Runs Flyway migrations over Supabase's session pooler (port 5432) while the application
 * itself keeps using the transaction pooler (port 6543).
 *
 * Flyway relies on session-level behaviour (locks, multi-statement migrations) that a
 * transaction pooler (PgBouncer in transaction mode) does not guarantee. The session pooler
 * lives on the same host with the same credentials, so for a *.pooler.supabase.com:6543 URL
 * the migration URL is derived by switching the port. Set FLYWAY_DB_URL to override it, or
 * point DB_URL at anything else (local Postgres, a direct connection) and Flyway simply
 * uses the application's own datasource.
 */
@Configuration
public class FlywayConfig {

    private static final Pattern TRANSACTION_POOLER =
            Pattern.compile("^(jdbc:postgresql://[^/:]+\\.pooler\\.supabase\\.com):6543(/.*)?$");

    @Bean
    FlywayConfigurationCustomizer flywayMigrationConnection(
            @Value("${spring.datasource.url}") String datasourceUrl,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${app.flyway.url:}") String overrideUrl) {
        String migrationUrl = overrideUrl.isBlank() ? sessionPoolerUrl(datasourceUrl) : overrideUrl;
        return configuration -> {
            if (migrationUrl != null && !migrationUrl.equals(datasourceUrl)) {
                configuration.dataSource(migrationUrl, username, password);
            }
        };
    }

    /** Returns the session-pooler URL for a Supabase transaction-pooler URL, or null if not applicable. */
    static String sessionPoolerUrl(String datasourceUrl) {
        Matcher m = TRANSACTION_POOLER.matcher(datasourceUrl);
        if (!m.matches()) return null;
        return m.group(1) + ":5432" + (m.group(2) == null ? "" : m.group(2));
    }
}
