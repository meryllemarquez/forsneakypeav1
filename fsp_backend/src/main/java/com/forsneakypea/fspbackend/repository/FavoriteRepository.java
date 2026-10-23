package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.FavorableType;
import com.forsneakypea.fspbackend.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    List<Favorite> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
            Long userId, FavorableType favorableType, UUID favorableId);
    boolean existsByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
            Long userId, FavorableType favorableType, UUID favorableId);
}
