package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.AvatarUpdateRequestDTO;
import com.forsneakypea.fspbackend.dto.ProfileDTO;
import com.forsneakypea.fspbackend.dto.ProfileUpdateRequestDTO;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.exception.ValidationException;
import com.forsneakypea.fspbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final MediaUrlService mediaUrls;
    private final UploadService uploadService;
    private final DriveClient drive;

    // Curated accent-color palette (matches constants/profileOptions.js on the frontend).
    // Kept as a fixed allow-list rather than free-form hex so the value can only ever
    // drive a handful of known-safe CSS custom properties.
    private static final Set<String> ALLOWED_ACCENT_COLORS = Set.of(
            "soft-pink", "rose", "lavender", "cream", "sky-blue", "sage-green"
    );

    @Transactional(readOnly = true)
    public ProfileDTO getProfile(Long userId) {
        User user = findUser(userId);
        return mapToDTO(user);
    }

    @Transactional
    public ProfileDTO updateProfile(Long userId, ProfileUpdateRequestDTO request) {
        User user = findUser(userId);

        String name = requireSafeText(request.getName(), "Display name");
        String nickname = sanitizeOptional(request.getNickname(), "Nickname");
        String bio = sanitizeOptional(request.getBio(), "Bio");
        String favoriteEmoji = request.getFavoriteEmoji() != null ? request.getFavoriteEmoji().trim() : null;

        if (request.getAccentColor() != null && !ALLOWED_ACCENT_COLORS.contains(request.getAccentColor())) {
            throw new ValidationException("Please choose a valid accent color.");
        }

        user.setName(name);
        user.setNickname(nickname);
        user.setBio(bio);
        user.setFavoriteEmoji(favoriteEmoji);
        if (request.getAccentColor() != null) {
            user.setAccentColor(request.getAccentColor());
        }

        user = userRepository.save(user);
        activityLogService.log(userId, "PROFILE_UPDATED", RelatedEntityType.USER, null);

        return mapToDTO(user);
    }

    @Transactional
    public ProfileDTO updateAvatar(Long userId, AvatarUpdateRequestDTO request) {
        User user = findUser(userId);
        String newFileId = request.getDriveFileId();
        uploadService.requireUploadedImage(newFileId, "avatars");
        String oldFileId = user.getAvatarDriveFileId();
        user.setAvatarDriveFileId(newFileId);
        user.setAvatarUrl(null);
        user.setAvatarStoragePath(null);
        user = userRepository.save(user);
        activityLogService.log(userId, "PROFILE_AVATAR_UPDATED", RelatedEntityType.USER, null);
        if (oldFileId != null && !oldFileId.equals(newFileId)) {
            drive.trashAfterCommit(Collections.singletonList(oldFileId));
        }
        return mapToDTO(user);
    }

    @Transactional
    public ProfileDTO removeAvatar(Long userId) {
        User user = findUser(userId);
        String oldFileId = user.getAvatarDriveFileId();
        user.setAvatarDriveFileId(null);
        user.setAvatarUrl(null);
        user.setAvatarStoragePath(null);
        user = userRepository.save(user);
        activityLogService.log(userId, "PROFILE_AVATAR_REMOVED", RelatedEntityType.USER, null);
        drive.trashAfterCommit(Collections.singletonList(oldFileId));
        return mapToDTO(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Trims and rejects angle brackets so a name/bio can never smuggle in an
    // HTML tag or script — every place in the UI renders these as plain text.
    private String requireSafeText(String value, String fieldLabel) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.contains("<") || trimmed.contains(">")) {
            throw new ValidationException(fieldLabel + " cannot contain '<' or '>' characters.");
        }
        return trimmed;
    }

    private String sanitizeOptional(String value, String fieldLabel) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.contains("<") || trimmed.contains(">")) {
            throw new ValidationException(fieldLabel + " cannot contain '<' or '>' characters.");
        }
        return trimmed;
    }

    private ProfileDTO mapToDTO(User user) {
        return ProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .nickname(user.getNickname())
                .bio(user.getBio())
                .favoriteEmoji(user.getFavoriteEmoji())
                .accentColor(user.getAccentColor())
                .avatarUrl(mediaUrls.resolve(user.getAvatarUrl(), user.getAvatarDriveFileId(), MediaUrlService.Size.THUMB))
                .role(user.getRole() != null ? user.getRole().name() : null)
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
