package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.ChecklistItemDTO;
import com.forsneakypea.fspbackend.dto.ChecklistItemRequestDTO;
import com.forsneakypea.fspbackend.entity.ChecklistItem;
import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.exception.ValidationException;
import com.forsneakypea.fspbackend.repository.ChecklistItemRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistItemService {

    private final ChecklistItemRepository checklistItemRepository;
    private final DateEntryRepository dateEntryRepository;

    @Transactional(readOnly = true)
    public List<ChecklistItemDTO> getItemsForDate(UUID dateId) {
        return checklistItemRepository.findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(dateId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ChecklistItemDTO createItem(UUID dateId, ChecklistItemRequestDTO.Create request, Long userId) {
        DateEntry date = dateEntryRepository.findByIdAndDeletedAtIsNull(dateId)
                .orElseThrow(() -> new ResourceNotFoundException("Date not found: " + dateId));

        int nextSortOrder = checklistItemRepository
                .findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(dateId)
                .stream()
                .mapToInt(ChecklistItem::getSortOrder)
                .max()
                .orElse(-1) + 1;

        ChecklistItem item = ChecklistItem.builder()
                .date(date)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .priority(request.getPriority())
                .sortOrder(nextSortOrder)
                .isCompleted(false)
                .createdBy(userId)
                .build();

        return mapToDTO(checklistItemRepository.save(item));
    }

    @Transactional
    public ChecklistItemDTO updateItem(UUID itemId, ChecklistItemRequestDTO.Update request, Long userId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found: " + itemId));

        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) {
                throw new ValidationException("Checklist item title cannot be empty");
            }
            item.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getDueDate() != null) item.setDueDate(request.getDueDate());
        if (request.getPriority() != null) item.setPriority(request.getPriority());

        if (request.getIsCompleted() != null && !request.getIsCompleted().equals(item.getIsCompleted())) {
            item.setIsCompleted(request.getIsCompleted());
            if (request.getIsCompleted()) {
                item.setCompletedAt(OffsetDateTime.now());
                item.setCompletedBy(userId);
            } else {
                item.setCompletedAt(null);
                item.setCompletedBy(null);
            }
        }

        return mapToDTO(checklistItemRepository.save(item));
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found: " + itemId));
        item.setDeletedAt(OffsetDateTime.now());
        checklistItemRepository.save(item);
    }

    @Transactional
    public List<ChecklistItemDTO> reorderItems(UUID dateId, List<UUID> orderedIds) {
        List<ChecklistItem> existing = checklistItemRepository
                .findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(dateId);

        Set<UUID> existingIds = existing.stream().map(ChecklistItem::getId).collect(Collectors.toSet());
        Set<UUID> requestedIds = Set.copyOf(orderedIds);

        if (orderedIds.size() != existingIds.size() || !existingIds.equals(requestedIds)) {
            throw new ValidationException("Reorder list must contain exactly the checklist items currently on this date, with no duplicates");
        }

        Map<UUID, ChecklistItem> byId = existing.stream()
                .collect(Collectors.toMap(ChecklistItem::getId, item -> item));

        for (int i = 0; i < orderedIds.size(); i++) {
            byId.get(orderedIds.get(i)).setSortOrder(i);
        }

        List<ChecklistItem> saved = checklistItemRepository.saveAll(existing);
        return saved.stream()
                .sorted(Comparator.comparing(ChecklistItem::getSortOrder))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Package-private (not private) so DateService can reuse this exact mapping
    // when it embeds checklist items into a DateEntryDTO — avoids the two
    // mappers drifting out of sync as ChecklistItem gains fields.
    ChecklistItemDTO mapToDTO(ChecklistItem item) {
        return ChecklistItemDTO.builder()
                .id(item.getId())
                .dateId(item.getDate().getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .dueDate(item.getDueDate())
                .priority(item.getPriority())
                .isCompleted(item.getIsCompleted())
                .sortOrder(item.getSortOrder())
                .completedAt(item.getCompletedAt())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
