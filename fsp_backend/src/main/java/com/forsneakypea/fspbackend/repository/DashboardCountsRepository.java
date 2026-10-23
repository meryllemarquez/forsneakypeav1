package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;

/**
 * Every headline number on the admin dashboard in a single round trip. The old implementation
 * loaded the folders, notes and dates tables (plus up to 500 activity logs) just to count and
 * filter them in Java.
 */
public interface DashboardCountsRepository extends Repository<User, Long> {

    @Query(nativeQuery = true, value = """
            select
              (select count(*) from users) as "totalUsers",
              (select count(*) from memory_folders) as "totalFolders",
              (select count(*) from memory_folders where is_archived = true) as "archivedFolders",
              (select count(*) from love_notes) as "totalNotes",
              (select count(*) from love_notes where is_archived = true) as "archivedNotes",
              (select count(*) from dates where deleted_at is null) as "totalDates",
              (select count(*) from dates where deleted_at is null and is_archived = true) as "archivedDates",
              (select count(*) from notifications where deleted_at is null and is_read = false) as "unreadNotifications",
              (select count(*) from activity_logs where action = 'LOVE_NOTE_CREATED' and created_at > :since) as "lettersThisWeek",
              (select count(*) from activity_logs where action = 'MEMORY_FOLDER_CREATED' and created_at > :since) as "memoriesThisWeek",
              (select count(*) from activity_logs where action = 'DATE_CREATED' and created_at > :since) as "datesThisWeek"
            """)
    DashboardCounts loadCounts(@Param("since") OffsetDateTime since);

    interface DashboardCounts {
        long getTotalUsers();
        long getTotalFolders();
        long getArchivedFolders();
        long getTotalNotes();
        long getArchivedNotes();
        long getTotalDates();
        long getArchivedDates();
        long getUnreadNotifications();
        long getLettersThisWeek();
        long getMemoriesThisWeek();
        long getDatesThisWeek();
    }
}
