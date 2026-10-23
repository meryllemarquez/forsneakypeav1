package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.entity.DateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DateEntryRepository extends JpaRepository<DateEntry, UUID> {

    List<DateEntry> findAllByDeletedAtIsNullAndIsArchivedOrderByCreatedAtDesc(Boolean isArchived);

    List<DateEntry> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<DateEntry> findAllByDeletedAtIsNullAndCategoryIdOrderByCreatedAtDesc(UUID categoryId);

    List<DateEntry> findAllByDeletedAtIsNullAndStatusOrderByCreatedAtDesc(DateStatus status);

    Optional<DateEntry> findByIdAndDeletedAtIsNull(UUID id);

    // Dashboard status breakdown: one grouped query instead of loading every date.
    @Query("SELECT d.status AS status, COUNT(d) AS total FROM DateEntry d WHERE d.deletedAt IS NULL GROUP BY d.status")
    List<StatusCountRow> countByStatus();

    interface StatusCountRow {
        DateStatus getStatus();
        long getTotal();
    }
}
