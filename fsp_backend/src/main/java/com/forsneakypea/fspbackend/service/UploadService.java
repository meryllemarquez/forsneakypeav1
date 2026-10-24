package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/** Creates Drive upload sessions for the browser and checks files it says it uploaded. */
@Slf4j
@Service
@RequiredArgsConstructor
public class UploadService {

    public static final long MAX_BYTES = 15L * 1024 * 1024;

    /** Upload target -> Drive subfolder name. */
    private static final Map<String, String> TARGET_FOLDERS = Map.of(
            "memories", "memories",
            "avatars", "avatars",
            "date-covers", "date-covers");

    private final DriveClient drive;
    private final DriveFolderService folders;

    public String createSession(String target, String mimeType, long size, String origin) {
        String folderId = folderFor(target);
        requireImageType(mimeType);
        if (size <= 0 || size > MAX_BYTES) {
            throw new BadRequestException("Images must be 15 MB or smaller.");
        }
        try {
            return drive.createUploadSession(folderId, UUID.randomUUID() + extensionFor(mimeType), mimeType, size, origin);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Upload session interrupted", e);
        } catch (Exception e) {
            log.warn("Could not create Drive upload session: {}", e.getMessage());
            throw new IllegalStateException("Photo storage is unavailable right now.");
        }
    }

    /** Throws unless the file exists in Drive, is an image, and sits in the subfolder for {@code target}. */
    public void requireUploadedImage(String fileId, String target) {
        String folderId = folderFor(target);
        DriveClient.FileInfo info;
        try {
            info = drive.getFileInfo(fileId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Upload check interrupted", e);
        } catch (Exception e) {
            log.warn("Could not check Drive file {}: {}", fileId, e.getMessage());
            throw new IllegalStateException("Photo storage is unavailable right now.");
        }
        if (info == null || info.trashed() || !info.parents().contains(folderId)) {
            throw new BadRequestException("That upload was not found. Please try again.");
        }
        requireImageType(info.mimeType());
        if (info.size() > MAX_BYTES) {
            throw new BadRequestException("Images must be 15 MB or smaller.");
        }
    }

    private String folderFor(String target) {
        String name = target == null ? null : TARGET_FOLDERS.get(target);
        if (name == null) {
            throw new BadRequestException("Unknown upload target.");
        }
        String id = folders.getSubfolderId(name);
        if (id == null) {
            throw new IllegalStateException("Photo storage is not ready.");
        }
        return id;
    }

    private static void requireImageType(String mimeType) {
        if (mimeType == null || !mimeType.toLowerCase().startsWith("image/")) {
            throw new BadRequestException("Only image files can be uploaded.");
        }
    }

    private static String extensionFor(String mimeType) {
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "image/heic" -> ".heic";
            default -> "";
        };
    }
}
