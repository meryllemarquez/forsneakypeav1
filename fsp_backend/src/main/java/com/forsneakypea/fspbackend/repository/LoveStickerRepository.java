package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.LoveSticker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LoveStickerRepository extends JpaRepository<LoveSticker, UUID> {
    List<LoveSticker> findAllByOrderByUpdatedAtDesc();

    @Modifying
    @Query("delete from LoveSticker s where s.image = :image")
    void deleteAllByImage(@Param("image") String image);
}
