package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
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
    boolean existsByDriveFileId(String driveFileId);
    boolean existsByFolderIdAndDriveFileId(UUID folderId, String driveFileId);
    // Slice = no extra COUNT query (Page would run one whenever the page is full).
    Slice<MemoryPhoto> findAllBy(Pageable pageable);

    // Batched photo counts for a set of folders — one GROUP BY query instead of
    // lazy-initializing folder.getPhotos() once per folder in a list endpoint.
    @Query("SELECT p.folder.id AS folderId, COUNT(p) AS total FROM MemoryPhoto p WHERE p.folder.id IN :folderIds GROUP BY p.folder.id")
    List<FolderPhotoCountRow> countByFolderIds(@Param("folderIds") Collection<UUID> folderIds);

    // Photo URLs for a set of photo ids in one query (calendar view needs only the URL, not
    // the photo entity or its folder).
    @Query("SELECT p.id AS id, p.photoUrl AS photoUrl, p.driveFileId AS driveFileId FROM MemoryPhoto p WHERE p.id IN :ids")
    List<PhotoUrlRow> findPhotoUrlsByIds(@Param("ids") Collection<UUID> ids);

    interface PhotoUrlRow {
        UUID getId();
        String getPhotoUrl();
        String getDriveFileId();
    }

    interface FolderPhotoCountRow {
        UUID getFolderId();
        long getTotal();
    }
}
