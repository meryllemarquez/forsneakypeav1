-- -----------------------------------------------------------------------------
-- Phase 8b — real cross-user notifications
-- Widens notifications.type to cover edit/delete on love letters and edit on
-- memories (create/delete already existed; DATE_COMPLETED already existed in
-- the type list from Phase 8 but nothing ever triggered it until now).
-- -----------------------------------------------------------------------------

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
    check (type in (
        'REMINDER', 'CHECKLIST_UPDATE', 'DATE_CREATED', 'DATE_COMPLETED', 'DATE_UPDATED',
        'MEMORY_CREATED', 'MEMORY_UPDATED', 'MEMORY_DELETED', 'GALLERY_UPLOAD',
        'LOVE_NOTE_CREATED', 'LOVE_NOTE_UPDATED', 'LOVE_NOTE_DELETED',
        'PROFILE_CHANGED', 'ADMIN_ACTION', 'SYSTEM'
    ));
