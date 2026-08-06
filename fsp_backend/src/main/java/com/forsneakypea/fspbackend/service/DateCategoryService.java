package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.DateCategoryDTO;
import com.forsneakypea.fspbackend.entity.DateCategory;
import com.forsneakypea.fspbackend.repository.DateCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DateCategoryService {

    private final DateCategoryRepository dateCategoryRepository;

    @Transactional(readOnly = true)
    public List<DateCategoryDTO> getAllCategories() {
        return dateCategoryRepository.findAllByDeletedAtIsNullOrderByNameAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DateCategoryDTO createCategory(String name, String colorHex, String icon, String description, Long userId) {
        DateCategory category = DateCategory.builder()
                .name(name)
                .colorHex(colorHex != null ? colorHex : "#C73616")
                .icon(icon)
                .description(description)
                .createdBy(userId)
                .build();
        return mapToDTO(dateCategoryRepository.save(category));
    }

    private DateCategoryDTO mapToDTO(DateCategory category) {
        return DateCategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .colorHex(category.getColorHex())
                .icon(category.getIcon())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
