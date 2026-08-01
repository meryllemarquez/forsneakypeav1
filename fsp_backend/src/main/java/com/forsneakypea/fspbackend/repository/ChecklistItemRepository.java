package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    List<ChecklistItem> findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID dateId);
}
