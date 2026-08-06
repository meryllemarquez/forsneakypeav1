package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.LoveSticker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LoveStickerRepository extends JpaRepository<LoveSticker, UUID> {
    List<LoveSticker> findAllByOrderByUpdatedAtDesc();
}
