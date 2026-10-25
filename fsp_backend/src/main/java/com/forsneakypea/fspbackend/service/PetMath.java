package com.forsneakypea.fspbackend.service;

// The decay curve from the pets spec, kept pure so it is easy to test. "Current" stats are never
// stored: a snapshot (base values + time) is, and these functions read it at any moment.
final class PetMath {

    static final double FULLNESS_FLOOR = 20, FULLNESS_HALF_LIFE_H = 8;
    static final double JOY_FLOOR = 30, JOY_HALF_LIFE_H = 12;
    static final double ENERGY_CEIL = 100, ENERGY_HALF_LIFE_H = 6;

    private PetMath() {}

    record Stats(int fullness, int energy, int joy) {}

    /** Values after dtHours; clamped at 0 so clock skew never runs the curve backwards. */
    static Stats at(int fullnessBase, int energyBase, int joyBase, double dtHours) {
        double dt = Math.max(0, dtHours);
        return new Stats(
                clamp(FULLNESS_FLOOR + (fullnessBase - FULLNESS_FLOOR) * decay(dt, FULLNESS_HALF_LIFE_H)),
                clamp(ENERGY_CEIL - (ENERGY_CEIL - energyBase) * decay(dt, ENERGY_HALF_LIFE_H)),
                clamp(JOY_FLOOR + (joyBase - JOY_FLOOR) * decay(dt, JOY_HALF_LIFE_H)));
    }

    static String mood(Stats s) {
        if (s.energy() < 30) return "sleepy";
        if (s.fullness() < 35) return "peckish";
        if (s.joy() < 40) return "needs_cuddle";
        if (s.joy() >= 70 && s.fullness() >= 50 && s.energy() >= 40) return "so_happy";
        return "content";
    }

    private static double decay(double dt, double halfLife) {
        return Math.pow(0.5, dt / halfLife);
    }

    static int clamp(double v) {
        return (int) Math.max(0, Math.min(100, Math.round(v)));
    }
}
