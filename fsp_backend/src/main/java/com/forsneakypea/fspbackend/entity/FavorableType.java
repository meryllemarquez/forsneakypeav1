package com.forsneakypea.fspbackend.entity;

/**
 * Narrower than {@link RelatedEntityType} — favorites and attachments only
 * ever point at a date or a checklist item, matching the favorable_type /
 * attachable_type check constraints in date_bucket_list_schema.sql.
 */
public enum FavorableType {
    DATE,
    CHECKLIST_ITEM
}
