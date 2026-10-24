package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.DatePriority;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.ReservationStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public class DateRequestDTO {

    @Data
    public static class Create {
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be under 150 characters")
        private String title;

        private UUID categoryId;

        private String description;

        @Size(max = 200, message = "Location must be under 200 characters")
        private String location;

        private LocalDate plannedDate;

        private LocalTime plannedTime;

        @Min(value = 0, message = "Duration cannot be negative")
        private Integer durationMinutes;

        @Size(max = 50, message = "Activity type must be under 50 characters")
        private String activityType;

        @Size(max = 50, message = "Travel method must be under 50 characters")
        private String travelMethod;

        @Size(max = 150, message = "Special occasion must be under 150 characters")
        private String specialOccasion;

        private DatePriority priority = DatePriority.MEDIUM;

        private ReservationStatus reservationStatus = ReservationStatus.NOT_NEEDED;

        @DecimalMin(value = "0.0", message = "Estimated cost cannot be negative")
        private BigDecimal estimatedCost;

        private String coverImageUrl;
        private String coverDriveFileId;
    }

    @Data
    public static class Update {
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be under 150 characters")
        private String title;

        private UUID categoryId;

        private String description;

        @Size(max = 200, message = "Location must be under 200 characters")
        private String location;

        private LocalDate plannedDate;

        private LocalTime plannedTime;

        @Min(value = 0, message = "Duration cannot be negative")
        private Integer durationMinutes;

        @Size(max = 50, message = "Activity type must be under 50 characters")
        private String activityType;

        @Size(max = 50, message = "Travel method must be under 50 characters")
        private String travelMethod;

        @Size(max = 150, message = "Special occasion must be under 150 characters")
        private String specialOccasion;

        private DateStatus status;

        private DatePriority priority;

        private ReservationStatus reservationStatus;

        @DecimalMin(value = "0.0", message = "Estimated cost cannot be negative")
        private BigDecimal estimatedCost;

        private String coverImageUrl;
        private String coverDriveFileId;

        private Boolean isArchived;
    }
}
