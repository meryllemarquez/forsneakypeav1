package com.forsneakypea.fspbackend.entity;

/**
 * Used by notifications.related_entity_type and activity_logs.entity_type to
 * point at whichever row triggered the notification/log entry, without a
 * real foreign key (a single column can't reference multiple parent tables).
 */
public enum RelatedEntityType {
    DATE,
    CHECKLIST_ITEM,
    CATEGORY,
    REMINDER,
    ATTACHMENT
}
