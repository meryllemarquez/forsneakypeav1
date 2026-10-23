package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.LoveNote;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface LoveNoteRepository extends JpaRepository<LoveNote, UUID> {
    List<LoveNote> findAllByOrderByUpdatedAtDesc();

    // Home page: the newest unarchived note this user may see (same visibility rule as the board:
    // not private, or no author, or written by the user). Only the first 160 characters of the
    // text and two other fields are read, not the canvas blocks/attachments.
    @Query("SELECT SUBSTRING(n.content, 1, 160) AS content, n.createdAt AS createdAt, n.createdBy AS createdBy "
            + "FROM LoveNote n WHERE (n.isArchived IS NULL OR n.isArchived = false) "
            + "AND (n.isPrivate IS NULL OR n.isPrivate = false OR n.createdBy IS NULL OR n.createdBy = :userId) "
            + "ORDER BY n.createdAt DESC")
    Slice<LatestNoteRow> findLatestVisible(@Param("userId") Long userId, Pageable pageable);

    interface LatestNoteRow {
        String getContent();
        OffsetDateTime getCreatedAt();
        Long getCreatedBy();
    }
}
