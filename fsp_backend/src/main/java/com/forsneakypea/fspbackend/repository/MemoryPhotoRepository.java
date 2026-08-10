package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryPhotoRepository extends JpaRepository<MemoryPhoto, UUID> {
    List<MemoryPhoto> findByFolderIdOrderByCreatedAtDesc(UUID folderId);
    List<MemoryPhoto> findByIsFavoriteTrueOrderByCreatedAtDesc();

    // Batched photo counts for a set of folders — one GROUP BY query instead of
    // lazy-initializing folder.getPhotos() once per folder in a list endpoint.
    @Query("SELECT p.folder.id AS folderId, COUNT(p) AS total FROM MemoryPhoto p WHERE p.folder.id IN :folderIds GROUP BY p.folder.id")
    List<FolderPhotoCountRow> countByFolderIds(@Param("folderIds") Collection<UUID> folderIds);

    interface FolderPhotoCountRow {
        UUID getFolderId();
        long getTotal();
    }
}
