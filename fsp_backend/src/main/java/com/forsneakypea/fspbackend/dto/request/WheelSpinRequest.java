package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WheelSpinRequest {
    /** Create: the choice that won. */
    @Size(max = 16)
    private String choiceId;

    /** Create: used only when the choice has since been removed from the wheel. */
    @Size(max = 40)
    private String label;

    /** Patch: true once "Let's go" is pressed. */
    private Boolean accepted;
}
