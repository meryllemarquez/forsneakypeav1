package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MemoryFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryFolderRepository extends JpaRepository<MemoryFolder, UUID> {
    List<MemoryFolder> findAllByIsArchivedOrderByCreatedAtDesc(Boolean isArchived);
    List<MemoryFolder> findAllByOrderByCreatedAtDesc();
}
