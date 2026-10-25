package com.forsneakypea.fspbackend.dto;

import java.time.OffsetDateTime;

public record PetDTO(String id, String name, String kind, Stats stats, String mood, Counts counts, Last last) {
    public record Stats(int fullness, int energy, int joy) {}

    public record Counts(int feed, int play, int hug, int walk) {}

    /** Null on the pet when nobody has acted on it yet. */
    public record Last(String action, Long byUserId, String byName, OffsetDateTime at) {}
}
