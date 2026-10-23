package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MemoryFolder;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemoryFolderRepository extends JpaRepository<MemoryFolder, UUID> {
    List<MemoryFolder> findAllByIsArchivedOrderByCreatedAtDesc(Boolean isArchived);
    List<MemoryFolder> findAllByOrderByCreatedAtDesc();

    // Slice = no extra COUNT query (Page would run one whenever the page is full).
    Slice<MemoryFolder> findAllBy(Pageable pageable);

    Optional<MemoryFolder> findByEventDateAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNullAndIdNot(
            LocalDate eventDate, UUID excludeId);

    List<MemoryFolder> findByEventDateBetweenAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNull(
            LocalDate start, LocalDate end);

    Optional<MemoryFolder> findByHighlightPhotoId(UUID highlightPhotoId);
}
