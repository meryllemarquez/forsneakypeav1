package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.WheelSpin;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface WheelSpinRepository extends JpaRepository<WheelSpin, UUID> {
    List<WheelSpin> findByWheelIdOrderBySpunAtDesc(UUID wheelId, Pageable pageable);

    @Modifying
    @Query("delete from WheelSpin s where s.wheelId = :wheelId")
    void deleteAllByWheelId(@Param("wheelId") UUID wheelId);

    /** Keeps only the newest {@code keep} spins of a wheel. */
    @Modifying
    @Query(value = "DELETE FROM wheel_spins WHERE wheel_id = :wheelId AND id NOT IN "
            + "(SELECT id FROM wheel_spins WHERE wheel_id = :wheelId ORDER BY spun_at DESC LIMIT :keep)",
            nativeQuery = true)
    void pruneToNewest(@Param("wheelId") UUID wheelId, @Param("keep") int keep);
}
