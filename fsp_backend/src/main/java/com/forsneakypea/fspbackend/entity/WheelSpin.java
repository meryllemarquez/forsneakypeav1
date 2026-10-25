package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "wheel_spins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WheelSpin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "wheel_id", nullable = false)
    private UUID wheelId;

    @Column(name = "choice_id", nullable = false, length = 16)
    private String choiceId;

    @Column(nullable = false, length = 40)
    private String label;

    @Column(length = 24)
    private String doodle;

    @Column(nullable = false)
    @Builder.Default
    private boolean accepted = false;

    @Column(name = "spun_by")
    private Long spunBy;

    @CreationTimestamp
    @Column(name = "spun_at", nullable = false, updatable = false)
    private OffsetDateTime spunAt;
}
