package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryPhotoRepository extends JpaRepository<MemoryPhoto, UUID> {
    List<MemoryPhoto> findByFolderIdOrderByCreatedAtDesc(UUID folderId);
    List<MemoryPhoto> findByIsFavoriteTrueOrderByCreatedAtDesc();
}
