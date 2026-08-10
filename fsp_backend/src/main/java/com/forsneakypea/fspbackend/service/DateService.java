package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.DateEntryDTO;
import com.forsneakypea.fspbackend.dto.DateRequestDTO;
import com.forsneakypea.fspbackend.entity.ChecklistItem;
import com.forsneakypea.fspbackend.entity.DateCategory;
import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.entity.DatePriority;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.FavorableType;
import com.forsneakypea.fspbackend.entity.Favorite;
import com.forsneakypea.fspbackend.entity.ReservationStatus;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.ChecklistItemRepository;
import com.forsneakypea.fspbackend.repository.DateCategoryRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.FavoriteRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DateService {

    private final DateEntryRepository dateEntryRepository;
    private final DateCategoryRepository dateCategoryRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final FavoriteRepository favoriteRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final UserRepository userRepository;
    private final ChecklistItemService checklistItemService;

    @Transactional
    public DateEntryDTO createDate(DateRequestDTO.Create request, Long userId) {
        DateCategory category = resolveCategory(request.getCategoryId());

        DateEntry date = DateEntry.builder()
                .category(category)
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .plannedDate(request.getPlannedDate())
                .plannedTime(request.getPlannedTime())
                .durationMinutes(request.getDurationMinutes())
                .activityType(request.getActivityType())
                .travelMethod(request.getTravelMethod())
                .specialOccasion(request.getSpecialOccasion())
                .priority(request.getPriority() != null ? request.getPriority() : DatePriority.MEDIUM)
                .reservationStatus(request.getReservationStatus() != null ? request.getReservationStatus() : ReservationStatus.NOT_NEEDED)
                .estimatedCost(request.getEstimatedCost())
                .coverImageUrl(request.getCoverImageUrl())
                .status(DateStatus.DREAMING)
                .isArchived(false)
                .createdBy(userId)
                .build();

        date = dateEntryRepository.save(date);
        logActivity("DATE_CREATED", date.getId(), userId);
        notificationService.notifyOthers(userId, NotificationType.DATE_CREATED, date.getTitle(),
                RelatedEntityType.DATE, date.getId());

        return mapToDTO(date, userId, false);
    }

    @Transactional(readOnly = true)
    public List<DateEntryDTO> getDates(boolean includeArchived, UUID categoryId, DateStatus status, Long currentUserId) {
        List<DateEntry> dates;

        if (categoryId != null) {
            dates = dateEntryRepository.findAllByDeletedAtIsNullAndCategoryIdOrderByCreatedAtDesc(categoryId);
        } else if (status != null) {
            dates = dateEntryRepository.findAllByDeletedAtIsNullAndStatusOrderByCreatedAtDesc(status);
        } else if (includeArchived) {
            dates = dateEntryRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        } else {
            dates = dateEntryRepository.findAllByDeletedAtIsNullAndIsArchivedOrderByCreatedAtDesc(false);
        }

        Set<UUID> favoriteIds = favoriteDateIds(currentUserId);

        // Batch the per-row lookups that mapToDTO would otherwise repeat once per
        // date (checklist counts, creator name) into two queries total for the
        // whole list, instead of 2N queries.
        List<UUID> dateIds = dates.stream().map(DateEntry::getId).collect(Collectors.toList());
        Map<UUID, ChecklistItemRepository.ChecklistCountRow> checklistCounts = dateIds.isEmpty()
                ? Map.of()
                : checklistItemRepository.countByDateIds(dateIds).stream()
                        .collect(Collectors.toMap(ChecklistItemRepository.ChecklistCountRow::getDateId, r -> r));

        List<Long> creatorIds = dates.stream().map(DateEntry::getCreatedBy).filter(Objects::nonNull).distinct().collect(Collectors.toList());
        Map<Long, String> creatorNames = creatorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(creatorIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getName));

        return dates.stream().map(d -> mapToDTOBulk(d, favoriteIds, checklistCounts, creatorNames)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DateEntryDTO getDateById(UUID id, Long currentUserId) {
        return mapToDTO(findActiveOrThrow(id), currentUserId, true);
    }

    @Transactional
    public DateEntryDTO updateDate(UUID id, DateRequestDTO.Update request, Long currentUserId) {
        DateEntry date = findActiveOrThrow(id);
        DateStatus previousStatus = date.getStatus();

        date.setTitle(request.getTitle());
        date.setDescription(request.getDescription());
        date.setLocation(request.getLocation());
        date.setPlannedDate(request.getPlannedDate());
        date.setPlannedTime(request.getPlannedTime());
        date.setDurationMinutes(request.getDurationMinutes());
        date.setActivityType(request.getActivityType());
        date.setTravelMethod(request.getTravelMethod());
        date.setSpecialOccasion(request.getSpecialOccasion());
        date.setEstimatedCost(request.getEstimatedCost());
        if (request.getCoverImageUrl() != null) date.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getStatus() != null) date.setStatus(request.getStatus());
        if (request.getPriority() != null) date.setPriority(request.getPriority());
        if (request.getReservationStatus() != null) date.setReservationStatus(request.getReservationStatus());
        if (request.getIsArchived() != null) date.setIsArchived(request.getIsArchived());
        date.setCategory(resolveCategory(request.getCategoryId()));

        date = dateEntryRepository.save(date);
        boolean justCompleted = date.getStatus() == DateStatus.COMPLETED && previousStatus != DateStatus.COMPLETED;
        logActivity(justCompleted ? "DATE_COMPLETED" : "DATE_UPDATED", date.getId(), currentUserId);
        notificationService.notifyOthers(currentUserId, justCompleted ? NotificationType.DATE_COMPLETED : NotificationType.DATE_UPDATED,
                date.getTitle(), RelatedEntityType.DATE, date.getId());

        return mapToDTO(date, currentUserId, false);
    }

    @Transactional
    public void deleteDate(UUID id, Long currentUserId) {
        DateEntry date = findActiveOrThrow(id);
        date.setDeletedAt(OffsetDateTime.now());
        dateEntryRepository.save(date);
        logActivity("DATE_DELETED", date.getId(), currentUserId);
    }

    @Transactional
    public DateEntryDTO archiveDate(UUID id, Long currentUserId) {
        DateEntry date = findActiveOrThrow(id);
        date.setIsArchived(true);
        date = dateEntryRepository.save(date);
        logActivity("DATE_ARCHIVED", date.getId(), currentUserId);
        return mapToDTO(date, currentUserId, false);
    }

    @Transactional
    public DateEntryDTO restoreDate(UUID id, Long currentUserId) {
        DateEntry date = dateEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Date not found: " + id));

        if (date.getDeletedAt() == null) {
            throw new IllegalArgumentException("Date is not deleted, nothing to restore");
        }

        date.setDeletedAt(null);
        date = dateEntryRepository.save(date);
        logActivity("DATE_RESTORED", date.getId(), currentUserId);
        return mapToDTO(date, currentUserId, false);
    }

    @Transactional
    public DateEntryDTO unarchiveDate(UUID id, Long currentUserId) {
        DateEntry date = findActiveOrThrow(id);
        date.setIsArchived(false);
        date = dateEntryRepository.save(date);
        logActivity("DATE_UNARCHIVED", date.getId(), currentUserId);
        return mapToDTO(date, currentUserId, false);
    }

    @Transactional
    public DateEntryDTO duplicateDate(UUID id, Long currentUserId) {
        DateEntry original = findActiveOrThrow(id);

        DateEntry copy = DateEntry.builder()
                .category(original.getCategory())
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .location(original.getLocation())
                .plannedDate(original.getPlannedDate())
                .plannedTime(original.getPlannedTime())
                .durationMinutes(original.getDurationMinutes())
                .activityType(original.getActivityType())
                .travelMethod(original.getTravelMethod())
                .specialOccasion(original.getSpecialOccasion())
                .status(original.getStatus())
                .priority(original.getPriority())
                .reservationStatus(original.getReservationStatus())
                .estimatedCost(original.getEstimatedCost())
                .coverImageUrl(original.getCoverImageUrl())
                .isArchived(false)
                .createdBy(currentUserId)
                .build();

        copy = dateEntryRepository.save(copy);

        DateEntry finalCopy = copy;
        List<ChecklistItem> clonedItems = checklistItemRepository
                .findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(original.getId())
                .stream()
                .map(item -> ChecklistItem.builder()
                        .date(finalCopy)
                        .title(item.getTitle())
                        .isCompleted(item.getIsCompleted())
                        .sortOrder(item.getSortOrder())
                        .createdBy(currentUserId)
                        .build())
                .collect(Collectors.toList());
        checklistItemRepository.saveAll(clonedItems);

        logActivity("DATE_DUPLICATED", copy.getId(), currentUserId);
        return mapToDTO(copy, currentUserId, false);
    }

    @Transactional
    public DateEntryDTO setFavorite(UUID id, boolean favorite, Long currentUserId) {
        DateEntry date = findActiveOrThrow(id);

        var existing = favoriteRepository.findByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
                currentUserId, FavorableType.DATE, id);

        if (favorite && existing.isEmpty()) {
            Favorite fav = Favorite.builder()
                    .userId(currentUserId)
                    .favorableType(FavorableType.DATE)
                    .favorableId(id)
                    .build();
            favoriteRepository.save(fav);
            logActivity("DATE_FAVORITED", id, currentUserId);
        } else if (!favorite && existing.isPresent()) {
            Favorite fav = existing.get();
            fav.setDeletedAt(OffsetDateTime.now());
            favoriteRepository.save(fav);
            logActivity("DATE_UNFAVORITED", id, currentUserId);
        }

        return mapToDTO(date, currentUserId, false);
    }

    private DateEntry findActiveOrThrow(UUID id) {
        return dateEntryRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Date not found: " + id));
    }

    private DateCategory resolveCategory(UUID categoryId) {
        if (categoryId == null) return null;
        return dateCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private void logActivity(String action, UUID entityId, Long userId) {
        activityLogService.log(userId, action, RelatedEntityType.DATE, entityId);
    }

    private Set<UUID> favoriteDateIds(Long userId) {
        if (userId == null) return Set.of();
        return favoriteRepository.findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId).stream()
                .filter(f -> f.getFavorableType() == FavorableType.DATE)
                .map(Favorite::getFavorableId)
                .collect(Collectors.toSet());
    }

    private DateEntryDTO mapToDTO(DateEntry date, Long currentUserId, boolean includeChecklist) {
        Set<UUID> favoriteIds = favoriteDateIds(currentUserId);
        return mapToDTO(date, favoriteIds, includeChecklist);
    }

    // List-endpoint variant: takes pre-batched checklist counts and creator names
    // instead of querying per row (see getDates()).
    private DateEntryDTO mapToDTOBulk(DateEntry date, Set<UUID> favoriteIds,
                                       Map<UUID, ChecklistItemRepository.ChecklistCountRow> checklistCounts,
                                       Map<Long, String> creatorNames) {
        ChecklistItemRepository.ChecklistCountRow counts = checklistCounts.get(date.getId());

        return DateEntryDTO.builder()
                .id(date.getId())
                .categoryId(date.getCategory() != null ? date.getCategory().getId() : null)
                .categoryName(date.getCategory() != null ? date.getCategory().getName() : null)
                .categoryColorHex(date.getCategory() != null ? date.getCategory().getColorHex() : null)
                .title(date.getTitle())
                .description(date.getDescription())
                .location(date.getLocation())
                .plannedDate(date.getPlannedDate())
                .plannedTime(date.getPlannedTime())
                .durationMinutes(date.getDurationMinutes())
                .activityType(date.getActivityType())
                .travelMethod(date.getTravelMethod())
                .specialOccasion(date.getSpecialOccasion())
                .status(date.getStatus())
                .priority(date.getPriority())
                .reservationStatus(date.getReservationStatus())
                .estimatedCost(date.getEstimatedCost())
                .coverImageUrl(date.getCoverImageUrl())
                .isArchived(date.getIsArchived())
                .isFavorite(favoriteIds.contains(date.getId()))
                .createdBy(date.getCreatedBy())
                .createdByName(date.getCreatedBy() != null ? creatorNames.get(date.getCreatedBy()) : null)
                .checklistCompletedCount(counts != null ? (int) counts.getCompleted() : 0)
                .checklistTotalCount(counts != null ? (int) counts.getTotal() : 0)
                .createdAt(date.getCreatedAt())
                .updatedAt(date.getUpdatedAt())
                .build();
    }

    private DateEntryDTO mapToDTO(DateEntry date, Set<UUID> favoriteIds, boolean includeChecklist) {
        List<ChecklistItem> items = checklistItemRepository
                .findAllByDateIdAndDeletedAtIsNullOrderBySortOrderAsc(date.getId());

        String createdByName = null;
        if (date.getCreatedBy() != null) {
            createdByName = userRepository.findById(date.getCreatedBy())
                    .map(User::getName)
                    .orElse(null);
        }

        var builder = DateEntryDTO.builder()
                .id(date.getId())
                .categoryId(date.getCategory() != null ? date.getCategory().getId() : null)
                .categoryName(date.getCategory() != null ? date.getCategory().getName() : null)
                .categoryColorHex(date.getCategory() != null ? date.getCategory().getColorHex() : null)
                .title(date.getTitle())
                .description(date.getDescription())
                .location(date.getLocation())
                .plannedDate(date.getPlannedDate())
                .plannedTime(date.getPlannedTime())
                .durationMinutes(date.getDurationMinutes())
                .activityType(date.getActivityType())
                .travelMethod(date.getTravelMethod())
                .specialOccasion(date.getSpecialOccasion())
                .status(date.getStatus())
                .priority(date.getPriority())
                .reservationStatus(date.getReservationStatus())
                .estimatedCost(date.getEstimatedCost())
                .coverImageUrl(date.getCoverImageUrl())
                .isArchived(date.getIsArchived())
                .isFavorite(favoriteIds.contains(date.getId()))
                .createdBy(date.getCreatedBy())
                .createdByName(createdByName)
                .checklistCompletedCount((int) items.stream().filter(ChecklistItem::getIsCompleted).count())
                .checklistTotalCount(items.size())
                .createdAt(date.getCreatedAt())
                .updatedAt(date.getUpdatedAt());

        if (includeChecklist) {
            builder.checklistItems(items.stream()
                    .sorted(Comparator.comparing(ChecklistItem::getSortOrder))
                    .map(checklistItemService::mapToDTO)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
