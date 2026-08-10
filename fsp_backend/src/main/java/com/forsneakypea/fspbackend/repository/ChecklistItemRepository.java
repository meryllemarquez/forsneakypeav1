package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    List<ChecklistItem> findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID dateId);

    // Batched replacement for calling findAllByDateId... once per date in a list —
    // one GROUP BY query instead of N queries just to compute completed/total counts.
    @Query("SELECT c.date.id AS dateId, COUNT(c) AS total, " +
            "SUM(CASE WHEN c.isCompleted = true THEN 1L ELSE 0L END) AS completed " +
            "FROM ChecklistItem c WHERE c.deletedAt IS NULL AND c.date.id IN :dateIds GROUP BY c.date.id")
    List<ChecklistCountRow> countByDateIds(@Param("dateIds") Collection<UUID> dateIds);

    interface ChecklistCountRow {
        UUID getDateId();
        long getTotal();
        long getCompleted();
    }
}
