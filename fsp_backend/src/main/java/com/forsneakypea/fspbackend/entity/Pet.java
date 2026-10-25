package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "pets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pet {

    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 24)
    private String name;

    @Column(nullable = false, length = 5)
    private String kind;

    @Column(name = "fullness_base", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT) // pets.fullnessBase is smallint
    private int fullnessBase;

    @Column(name = "energy_base", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT) // pets.energyBase is smallint
    private int energyBase;

    @Column(name = "joy_base", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT) // pets.joyBase is smallint
    private int joyBase;

    @Column(name = "snapshot_at", nullable = false)
    private OffsetDateTime snapshotAt;

    @Column(name = "fed_count", nullable = false)
    private int fedCount;

    @Column(name = "play_count", nullable = false)
    private int playCount;

    @Column(name = "hug_count", nullable = false)
    private int hugCount;

    @Column(name = "walk_count", nullable = false)
    private int walkCount;

    @Column(name = "last_action", length = 5)
    private String lastAction;

    @Column(name = "last_action_by")
    private Long lastActionBy;

    @Column(name = "last_action_at")
    private OffsetDateTime lastActionAt;

    @Column(name = "sort_order", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT) // pets.sortOrder is smallint
    private int sortOrder;
}
