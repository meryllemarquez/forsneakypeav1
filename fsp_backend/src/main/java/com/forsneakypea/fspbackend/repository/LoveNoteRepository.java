package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.LoveNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LoveNoteRepository extends JpaRepository<LoveNote, UUID> {
    List<LoveNote> findAllByOrderByUpdatedAtDesc();
}
