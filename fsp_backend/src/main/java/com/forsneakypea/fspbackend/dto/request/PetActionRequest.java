package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PetActionRequest {
    /** feed | play | hug | walk */
    @NotBlank
    @Size(max = 8)
    private String action;
}
