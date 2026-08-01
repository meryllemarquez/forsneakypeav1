package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Attachment;
import com.forsneakypea.fspbackend.entity.FavorableType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findAllByAttachableTypeAndAttachableIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            FavorableType attachableType, UUID attachableId);
}
