package com.forsneakypea.fspbackend.entity;

/** One slice of a wheel; stored inside wheels.choices (jsonb). */
public record WheelChoice(String id, String label, String color, String doodle) {
}
