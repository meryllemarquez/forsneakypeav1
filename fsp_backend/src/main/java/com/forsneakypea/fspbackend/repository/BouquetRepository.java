package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.Bouquet;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BouquetRepository extends JpaRepository<Bouquet, UUID> {
    List<Bouquet> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
