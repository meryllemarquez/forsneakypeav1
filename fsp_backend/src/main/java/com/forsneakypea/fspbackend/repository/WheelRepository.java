package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Wheel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WheelRepository extends JpaRepository<Wheel, UUID> {
    List<Wheel> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
