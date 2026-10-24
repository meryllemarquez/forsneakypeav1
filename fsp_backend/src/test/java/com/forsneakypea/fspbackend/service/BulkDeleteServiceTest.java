package com.forsneakypea.fspbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BulkDeleteServiceTest {

    private JdbcTemplate jdbc;
    private BulkDeleteService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        when(jdbc.update(anyString())).thenReturn(3);
        service = new BulkDeleteService(jdbc);
    }

    private List<String> statements(int expected) {
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc, times(expected)).update(sql.capture());
        return sql.getAllValues();
    }

    @Test
    void loveBoardRemovesLettersStickersAndWhatPointsAtThem() {
        Map<String, Object> result = service.deleteLoveBoard();

        List<String> sql = statements(4);
        assertTrue(sql.get(0).contains("notifications") && sql.get(0).contains("LOVE_NOTE"));
        assertTrue(sql.get(1).contains("activity_logs"));
        assertEquals("DELETE FROM love_notes", sql.get(2));
        assertEquals("DELETE FROM love_stickers", sql.get(3));
        assertEquals(3, result.get("deletedNotes"));
        assertEquals(3, result.get("deletedStickers"));
    }

    @Test
    void memoriesReturnsTheStoragePathsAndDeletesPhotosBeforeFolders() {
        when(jdbc.queryForList(anyString(), eq(String.class))).thenReturn(List.of("photos/a.jpg", "photos/b.jpg"));

        Map<String, Object> result = service.deleteMemories();

        List<String> sql = statements(4);
        assertEquals("DELETE FROM memory_photos", sql.get(2));
        assertEquals("DELETE FROM memory_folders", sql.get(3));
        assertEquals(List.of("photos/a.jpg", "photos/b.jpg"), result.get("storagePaths"));
        assertEquals(3, result.get("deletedFolders"));
    }

    @Test
    void datesRemovesChecklistsRemindersAttachmentsAndFavoritesFirst_andKeepsCategories() {
        Map<String, Object> result = service.deleteDates();

        List<String> sql = statements(7);
        assertEquals("DELETE FROM reminders", sql.get(0));
        assertTrue(sql.get(1).startsWith("DELETE FROM attachments"));
        assertTrue(sql.get(2).startsWith("DELETE FROM favorites"));
        assertEquals("DELETE FROM checklist_items", sql.get(5));
        assertEquals("DELETE FROM dates", sql.get(6));
        assertFalse(sql.stream().anyMatch((s) -> s.contains("date_categories")));
        assertEquals(3, result.get("deletedChecklistItems"));
    }
}
