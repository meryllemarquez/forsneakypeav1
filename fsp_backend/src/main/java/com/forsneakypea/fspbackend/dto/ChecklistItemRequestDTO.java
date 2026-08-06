package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.DatePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ChecklistItemRequestDTO {

    @Data
    public static class Create {
        @NotBlank(message = "Checklist item title is required")
        @Size(max = 200, message = "Title must be under 200 characters")
        private String title;

        @Size(max = 2000, message = "Description must be under 2000 characters")
        private String description;

        private LocalDate dueDate;

        private DatePriority priority = DatePriority.MEDIUM;
    }

    @Data
    public static class Update {
        @Size(max = 200, message = "Title must be under 200 characters")
        private String title;

        @Size(max = 2000, message = "Description must be under 2000 characters")
        private String description;

        private LocalDate dueDate;

        private DatePriority priority;

        private Boolean isCompleted;
    }

    @Data
    public static class Reorder {
        @NotEmpty(message = "orderedIds must not be empty")
        private List<UUID> orderedIds;
    }
}
