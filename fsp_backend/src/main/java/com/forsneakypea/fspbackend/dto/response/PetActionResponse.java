package com.forsneakypea.fspbackend.dto.response;

import com.forsneakypea.fspbackend.dto.PetDTO;

/** reaction.kind is one of ate | already_full | played | too_sleepy | hugged | walked. */
public record PetActionResponse(PetDTO pet, Reaction reaction) {
    public record Reaction(String kind, String line) {}
}
