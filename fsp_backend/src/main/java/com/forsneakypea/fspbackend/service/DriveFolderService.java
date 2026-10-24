package com.forsneakypea.fspbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Finds or creates the Google Drive folder layout used for uploaded photos:
 * "for sneakypea photos" (or GOOGLE_DRIVE_FOLDER_ID when set) containing the
 * "memories", "avatars" and "date-covers" subfolders. Ids are cached in memory.
 * A failure here is logged and never blocks startup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DriveFolderService {

    private static final String ROOT_FOLDER_NAME = "for sneakypea photos";
    public static final List<String> SUBFOLDERS = List.of("memories", "avatars", "date-covers");

    private final DriveClient drive;
    private final Map<String, String> folderIds = new ConcurrentHashMap<>();

    @Value("${GOOGLE_DRIVE_FOLDER_ID:}")
    private String configuredRootId;

    /** Cached folder id for "memories", "avatars" or "date-covers"; null if setup hasn't succeeded. */
    public String getSubfolderId(String name) {
        return folderIds.get(name);
    }

    public String getRootFolderId() {
        return folderIds.get(ROOT_FOLDER_NAME);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void setupFolders() {
        if (!drive.isConfigured()) {
            log.warn("Drive folder setup skipped: GOOGLE_DRIVE_OAUTH_CLIENT_ID / _CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN not all set");
            return;
        }
        try {
            boolean rootConfigured = !configuredRootId.isBlank();
            String rootId = rootConfigured ? configuredRootId : drive.findOrCreateFolder(ROOT_FOLDER_NAME, "root");
            folderIds.put(ROOT_FOLDER_NAME, rootId);
            for (String name : SUBFOLDERS) {
                folderIds.put(name, drive.findOrCreateFolder(name, rootId));
            }
            if (!rootConfigured) {
                log.info("Drive root folder id (set as GOOGLE_DRIVE_FOLDER_ID): {}", rootId);
            }
        } catch (Exception e) {
            log.warn("Drive folder setup failed: {}", e.getMessage());
        }
    }
}
