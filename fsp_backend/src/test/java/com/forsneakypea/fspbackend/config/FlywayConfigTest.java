package com.forsneakypea.fspbackend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class FlywayConfigTest {

    @Test
    void transactionPoolerUrlMapsToSessionPoolerKeepingQueryString() {
        assertEquals(
                "jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require&prepareThreshold=0",
                FlywayConfig.sessionPoolerUrl(
                        "jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0"));
    }

    @Test
    void otherUrlsAreLeftAlone() {
        assertNull(FlywayConfig.sessionPoolerUrl("jdbc:postgresql://localhost:5432/postgres"));
        assertNull(FlywayConfig.sessionPoolerUrl("jdbc:postgresql://db.example.supabase.co:6543/postgres"));
        assertNull(FlywayConfig.sessionPoolerUrl("jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"));
    }
}
