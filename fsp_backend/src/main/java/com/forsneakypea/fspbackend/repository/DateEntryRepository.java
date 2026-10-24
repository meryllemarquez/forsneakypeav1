package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.entity.DateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DateEntryRepository extends JpaRepository<DateEntry, UUID> {
    boolean existsByCoverDriveFileIdAndIdNot(String coverDriveFileId, UUID id);


    List<DateEntry> findAllByDeletedAtIsNullAndIsArchivedOrderByCreatedAtDesc(Boolean isArchived);

    List<DateEntry> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<DateEntry> findAllByDeletedAtIsNullAndCategoryIdOrderByCreatedAtDesc(UUID categoryId);

    List<DateEntry> findAllByDeletedAtIsNullAndStatusOrderByCreatedAtDesc(DateStatus status);

    Optional<DateEntry> findByIdAndDeletedAtIsNull(UUID id);

    // Home page: the next few unarchived dates on/after `today`, as a light projection (no
    // entity, no category or checklist loading).
    @Query("SELECT d.id AS id, d.title AS title, d.plannedDate AS plannedDate, d.location AS location, d.status AS status "
            + "FROM DateEntry d WHERE d.deletedAt IS NULL AND d.isArchived = false AND d.plannedDate >= :today "
            + "ORDER BY d.plannedDate ASC, d.createdAt DESC")
    Slice<UpcomingDateRow> findUpcoming(@Param("today") LocalDate today, Pageable pageable);

    interface UpcomingDateRow {
        UUID getId();
        String getTitle();
        LocalDate getPlannedDate();
        String getLocation();
        DateStatus getStatus();
    }

    // Dashboard status breakdown: one grouped query instead of loading every date.
    @Query("SELECT d.status AS status, COUNT(d) AS total FROM DateEntry d WHERE d.deletedAt IS NULL GROUP BY d.status")
    List<StatusCountRow> countByStatus();

    interface StatusCountRow {
        DateStatus getStatus();
        long getTotal();
    }
}
