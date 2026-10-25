package com.forsneakypea.fspbackend.repository;

import com.forsneakypea.fspbackend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findAllByOrderBySortOrderAsc();
}
