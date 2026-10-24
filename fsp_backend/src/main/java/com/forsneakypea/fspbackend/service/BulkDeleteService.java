package com.forsneakypea.fspbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Delete all" for one section of the app. Hard deletes (no soft-delete flags) the section's rows
 * and everything that points at them (checklists, reminders, favorites, attachments, the
 * notifications and activity-log lines about them), for both accounts. Plain SQL on purpose: it
 * has to reach soft-deleted rows too, and it avoids loading every entity just to remove it.
 * Audit-trail rows (admin actions) are kept.
 */
@Service
@RequiredArgsConstructor
public class BulkDeleteService {

    private final JdbcTemplate jdbc;

    /** Letters and stickers. */
    @Transactional
    public Map<String, Object> deleteLoveBoard() {
        int notifications = jdbc.update(
                "DELETE FROM notifications WHERE related_entity_type IN ('LOVE_NOTE', 'LOVE_STICKER') "
                        + "OR type IN ('LOVE_NOTE_CREATED', 'LOVE_NOTE_UPDATED', 'LOVE_NOTE_DELETED')");
        int activity = jdbc.update("DELETE FROM activity_logs WHERE entity_type IN ('LOVE_NOTE', 'LOVE_STICKER')");
        int notes = jdbc.update("DELETE FROM love_notes");
        int stickers = jdbc.update("DELETE FROM love_stickers");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deletedNotes", notes);
        result.put("deletedStickers", stickers);
        result.put("deletedNotifications", notifications);
        result.put("deletedActivityLogs", activity);
        return result;
    }

    /**
     * Albums and photos. The photo files live in Supabase Storage, which the backend cannot reach,
     * so the storage paths are returned and the browser removes the files afterwards.
     */
    @Transactional
    public Map<String, Object> deleteMemories() {
        List<String> storagePaths = jdbc.queryForList("SELECT storage_path FROM memory_photos WHERE storage_path IS NOT NULL", String.class);

        int notifications = jdbc.update(
                "DELETE FROM notifications WHERE related_entity_type IN ('MEMORY_FOLDER', 'MEMORY_PHOTO') "
                        + "OR type IN ('MEMORY_CREATED', 'MEMORY_UPDATED', 'MEMORY_DELETED', 'GALLERY_UPLOAD')");
        int activity = jdbc.update("DELETE FROM activity_logs WHERE entity_type IN ('MEMORY_FOLDER', 'MEMORY_PHOTO')");
        int photos = jdbc.update("DELETE FROM memory_photos");
        int folders = jdbc.update("DELETE FROM memory_folders");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deletedFolders", folders);
        result.put("deletedPhotos", photos);
        result.put("deletedNotifications", notifications);
        result.put("deletedActivityLogs", activity);
        result.put("storagePaths", storagePaths);
        return result;
    }

    /** Dates with their checklists, reminders, attachments and favorites. Categories stay. */
    @Transactional
    public Map<String, Object> deleteDates() {
        jdbc.update("DELETE FROM reminders");
        jdbc.update("DELETE FROM attachments WHERE attachable_type IN ('DATE', 'CHECKLIST_ITEM')");
        jdbc.update("DELETE FROM favorites WHERE favorable_type IN ('DATE', 'CHECKLIST_ITEM')");
        int notifications = jdbc.update(
                "DELETE FROM notifications WHERE related_entity_type IN ('DATE', 'CHECKLIST_ITEM', 'REMINDER', 'ATTACHMENT') "
                        + "OR type IN ('DATE_CREATED', 'DATE_UPDATED', 'DATE_COMPLETED', 'CHECKLIST_UPDATE', 'REMINDER')");
        int activity = jdbc.update(
                "DELETE FROM activity_logs WHERE entity_type IN ('DATE', 'CHECKLIST_ITEM', 'REMINDER', 'ATTACHMENT')");
        int checklistItems = jdbc.update("DELETE FROM checklist_items");
        int dates = jdbc.update("DELETE FROM dates");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deletedDates", dates);
        result.put("deletedChecklistItems", checklistItems);
        result.put("deletedNotifications", notifications);
        result.put("deletedActivityLogs", activity);
        return result;
    }
}
